import type { Db } from "../db";
import { normalizeEmail } from "../normalize";
import { recordInboundReply } from "./process";
import { alertRep } from "../alerts";
import { log } from "@/lib/logger";

export interface InboundMail {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  receivedAt: string;
  /** Automatic mail (out-of-office, mailing-list, bounce). */
  automated: boolean;
}

export interface MailReader {
  /** Messages that arrived after `afterEpochSec` (newest first is fine), without fetching bodies of mail we don't need. */
  list(afterEpochSec: number): Promise<{ id: string; fromEmail: string }[]>;
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
    const ids = ((await this.api<{ messages?: { id: string }[] }>(`messages?q=${q}&maxResults=40`)).messages ?? []).map((m) => m.id);
    const out: { id: string; fromEmail: string }[] = [];
    for (const id of ids) {
      const m = await this.api<GmailMessage>(`messages/${id}?format=metadata&metadataHeaders=From`);
      out.push({ id, fromEmail: parseAddress(header(m, "From")).email });
    }
    return out;
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
  for (const item of await reader.list(after)) {
    const email = normalizeEmail(item.fromEmail);
    if (!email.includes("@") || SYSTEM_SENDER.test(email)) continue;

    const { data: contact } = await db.from("acq_contacts").select("id").eq("email_normalized", email).maybeSingle();
    if (contact) {
      const mail = await reader.get(item.id);
      if (mail.automated) continue; // out-of-office and list mail are not conversations
      const r = await record(db, { email, body: mail.body || `(no text) ${mail.subject}`, providerEventId: `gmail:${item.id}`, receivedAt: mail.receivedAt });
      if (r) recorded++;
      continue;
    }

    // Not in the lead pool: was it a rep's own one-off prospect?
    const { data: sent } = await db.from("rep_outreach_logs").select("employee_id,recipient_name").eq("recipient_email", email).order("sent_at", { ascending: false }).limit(1);
    const owner = sent?.[0] as { employee_id: string; recipient_name: string | null } | undefined;
    if (!owner) continue;
    const mail = await reader.get(item.id);
    if (mail.automated) continue;
    await alertRep(db, owner.employee_id, {
      kind: "reply",
      title: `${owner.recipient_name || email} replied to your email`,
      body: mail.body.slice(0, 600),
      dedupeKey: `gmail:${item.id}`,
    });
    repNotified++;
  }

  const saved = await db.from("acq_settings").upsert({ key: "gmail_cursor", value: { at: startedAt } }).select("key");
  if (saved.error) log("warn", { message: "could not save gmail cursor", error: saved.error });
  return { recorded, repNotified };
}
