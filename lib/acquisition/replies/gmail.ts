import type { Db } from "../db";
import { normalizeEmail } from "../normalize";
import { recordInboundReply } from "./process";
import { alertAdmin, alertRep } from "../alerts";
import { log } from "@/lib/logger";
import { classifyByRules } from "./classify";
import { recordReply } from "@/lib/crm/activity";
import { refreshScoresForEmail } from "@/lib/crm/refresh";

export interface InboundMail {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  receivedAt: string;
  /** Automatic mail (out-of-office, mailing-list, bounce). */
  automated: boolean;
  /** The sender passed DMARC, or a DKIM signature aligned with the From domain. Without it the From address cannot be trusted. */
  authenticated: boolean;
}

export interface MailReader {
  /**
   * Messages that arrived after `afterEpochSec`, without fetching bodies of mail we don't need.
   * `truncated` is true when more mail exists than was returned (the caller must not move its cursor past it).
   */
  list(afterEpochSec: number): Promise<{ items: { id: string; fromEmail: string }[]; truncated: boolean }>;
  get(id: string): Promise<InboundMail>;
}

type GmailHeader = { name: string; value: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[]; headers?: GmailHeader[] };
type GmailMessage = { id: string; internalDate?: string; payload?: GmailPart };

const header = (m: GmailMessage, name: string) => m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

export function parseAddress(raw: string): { email: string; name: string } {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const email = (m ? m[2] : raw).trim().toLowerCase();
  return { email, name: m ? m[1].trim() : "" };
}

const b64 = (data: string) => Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function findText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return b64(part.body.data);
  for (const p of part.parts ?? []) {
    const t = findText(p);
    if (t) return t;
  }
  return "";
}

/** Drops the quoted original so the classifier reads only what the person wrote. */
export function stripQuoted(text: string): string {
  const out: string[] = [];
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    if (/^On .{5,200} wrote:\s*$/i.test(line) || /^-{2,}\s*Original Message\s*-{2,}/i.test(line) || /^From:\s.+@/i.test(line)) break;
    if (line.trimStart().startsWith(">")) continue;
    out.push(line);
  }
  return out.join("\n").trim().slice(0, 5000);
}

const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";

/**
 * Gmail records the results of SPF/DKIM/DMARC checks in Authentication-Results. We trust a sender only if DMARC passed,
 * or a DKIM signature passed for the From domain (or a parent/sub domain of it). Anything else could be a forged From.
 */
export function isAuthenticatedSender(authResults: string, fromEmail: string): boolean {
  if (/\bdmarc=pass\b/i.test(authResults)) return true;
  const from = domainOf(fromEmail);
  if (!from) return false;
  for (const m of authResults.matchAll(/\bdkim=pass\b[^;]*?\bheader\.(?:d|i)=@?([^\s;]+)/gi)) {
    const d = domainOf(`x@${m[1].includes("@") ? m[1].split("@")[1] : m[1]}`);
    if (d && (d === from || from.endsWith(`.${d}`) || d.endsWith(`.${from}`))) return true;
  }
  return false;
}

export function toInboundMail(m: GmailMessage): InboundMail {
  const from = parseAddress(header(m, "From"));
  const auto = header(m, "Auto-Submitted");
  const precedence = header(m, "Precedence").toLowerCase();
  return {
    id: m.id,
    fromEmail: from.email,
    fromName: from.name,
    subject: header(m, "Subject"),
    body: stripQuoted(findText(m.payload)),
    receivedAt: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : new Date().toISOString(),
    automated: (auto !== "" && auto.toLowerCase() !== "no") || ["bulk", "junk", "list"].includes(precedence),
    authenticated: isAuthenticatedSender((m.payload?.headers ?? []).filter((h) => h.name.toLowerCase() === "authentication-results").map((h) => h.value).join(" ; "), from.email),
  };
}

/** Reads the shared reply inbox (read-only Gmail scope). Credentials come from environment variables. */
export class GmailReader implements MailReader {
  private token: { value: string; expires: number } | null = null;
  constructor(private readonly cfg = { clientId: process.env.GMAIL_CLIENT_ID ?? "", clientSecret: process.env.GMAIL_CLIENT_SECRET ?? "", refreshToken: process.env.GMAIL_REFRESH_TOKEN ?? "" }) {}

  static configured(): boolean {
    return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires > Date.now() + 30_000) return this.token.value;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: this.cfg.clientId, client_secret: this.cfg.clientSecret, refresh_token: this.cfg.refreshToken, grant_type: "refresh_token" }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
    if (!res.ok || !j.access_token) throw new Error(`Gmail auth failed (${res.status}${j.error ? `: ${j.error}` : ""})`);
    this.token = { value: j.access_token, expires: Date.now() + (j.expires_in ?? 3000) * 1000 };
    return this.token.value;
  }

  private async api<T>(path: string): Promise<T> {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { authorization: `Bearer ${await this.accessToken()}` }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Gmail API ${res.status}`);
    return (await res.json()) as T;
  }

  async list(afterEpochSec: number) {
    const q = encodeURIComponent(`in:inbox -from:me after:${afterEpochSec}`);
    const ids: string[] = [];
    let page: string | undefined;
    let truncated = false;
    for (let i = 0; i < 5; i++) {
      const r = await this.api<{ messages?: { id: string }[]; nextPageToken?: string }>(`messages?q=${q}&maxResults=100${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`);
      ids.push(...(r.messages ?? []).map((m) => m.id));
      page = r.nextPageToken;
      if (!page) break;
      if (i === 4) truncated = true; // more mail than five pages: leave the cursor where it is so nothing is skipped
    }
    const items: { id: string; fromEmail: string }[] = [];
    for (const id of ids.reverse()) { // oldest first
      const m = await this.api<GmailMessage>(`messages/${id}?format=metadata&metadataHeaders=From`);
      items.push({ id, fromEmail: parseAddress(header(m, "From")).email });
    }
    return { items, truncated };
  }

  async get(id: string) {
    return toInboundMail(await this.api<GmailMessage>(`messages/${id}?format=full`));
  }
}

const SYSTEM_SENDER = /^(mailer-daemon|postmaster|no-?reply|noreply|do-?not-?reply)@/i;

/**
 * Matches new inbox mail to people we emailed. A reply from a lead-pool/campaign contact is recorded (idempotent
 * on the Gmail message id) and handled by the normal reply pipeline; a reply from a rep's own prospect just
 * notifies that rep. Anything else in the inbox is ignored and never stored.
 */
export async function pollReplies(db: Db, reader: MailReader, now = new Date(), record: typeof recordInboundReply = recordInboundReply): Promise<{ recorded: number; repNotified: number }> {
  const cursor = await db.from("acq_settings").select("value").eq("key", "gmail_cursor").maybeSingle();
  const last = Number((cursor.data?.value as { at?: number } | null)?.at ?? 0);
  const startedAt = Math.floor(now.getTime() / 1000);
  const after = last > 0 ? last - 3600 : startedAt - 2 * 86400; // overlap an hour; first run looks back two days

  let recorded = 0;
  let repNotified = 0;
  let failed = 0;
  const { items, truncated } = await reader.list(after);
  for (const item of items) {
    // One bad message must never stop the others (an opt-out may be behind it).
    try {
      const email = normalizeEmail(item.fromEmail);
      if (!email.includes("@") || SYSTEM_SENDER.test(email)) continue;

      const { data: contact } = await db.from("acq_contacts").select("id").eq("email_normalized", email).maybeSingle();
      if (contact) {
        const mail = await reader.get(item.id);
        if (mail.automated) continue; // out-of-office and list mail are not conversations
        if (!mail.authenticated) {
          // A forged From could otherwise stop a sequence or add someone to the permanent opt-out list. A person decides.
          await alertAdmin(db, {
            kind: "reply_unverified",
            title: `Unverified reply claiming to be from ${email}`,
            body: `The sender could not be authenticated (no passing DMARC/DKIM), so it was not processed automatically. Check the inbox and handle it by hand if it is genuine.\n\n${mail.body.slice(0, 300)}`,
            dedupeKey: `gmail-unverified:${item.id}`,
          });
          continue;
        }
        // Mail we already filtered for automation headers is human: an "out of office" wording in it is a real reply.
        const r = await record(db, { email, body: mail.body || `(no text) ${mail.subject}`, providerEventId: `gmail:${item.id}`, receivedAt: mail.receivedAt, humanMail: true });
        if (r) recorded++;
        continue;
      }

      // Not in the lead pool: was it a rep's own one-off prospect?
      const { data: sent } = await db.from("rep_outreach_logs").select("employee_id,recipient_name").eq("recipient_email", email).order("sent_at", { ascending: false }).limit(1);
      const owner = sent?.[0] as { employee_id: string; recipient_name: string | null } | undefined;
      if (!owner) continue;
      const mail = await reader.get(item.id);
      if (mail.automated || !mail.authenticated) continue; // a notification only: unverified mail is simply not announced
      await alertRep(db, owner.employee_id, {
        kind: "reply",
        title: `${owner.recipient_name || email} replied to your email`,
        body: mail.body.slice(0, 600),
        dedupeKey: `gmail:${item.id}`,
      });
      repNotified++;
      // CRM: the reply goes on the lead's timeline and the rep gets a "reply to them" task.
      try {
        const cls = classifyByRules(mail.body)?.classification ?? "uncertain";
        if (await recordReply(db, { email, classification: cls, snippet: mail.body })) await refreshScoresForEmail(db, email);
      } catch (crmErr) {
        log("warn", { message: "could not record the reply in the CRM", error: crmErr });
      }
    } catch (e) {
      failed++;
      log("error", { message: "gmail reply could not be processed", context: { messageId: item.id }, error: e });
    }
  }
  if (failed > 0) {
    await alertAdmin(db, { kind: "health", title: `${failed} inbox message(s) could not be processed`, body: "The reply reader hit an error on one or more messages and will keep retrying them. Check the server logs for 'gmail reply could not be processed'.", link: "/admin/acquisition/settings", dedupeKey: `health:gmail_failed:${now.toISOString().slice(0, 10)}` });
  }

  // Only move on when everything was handled and nothing was left unlisted; otherwise the next tick sees it all again.
  if (failed > 0 || truncated) return { recorded, repNotified };

  const saved = await db.from("acq_settings").upsert({ key: "gmail_cursor", value: { at: startedAt } }).select("key");
  if (saved.error) log("warn", { message: "could not save gmail cursor", error: saved.error });
  return { recorded, repNotified };
}
