import { promises as dns } from "node:dns";
import { domainToASCII } from "node:url";
import type { Db } from "../db";
import { normalizeEmail } from "../normalize";

export type CheckStatus = "safe" | "risky" | "invalid" | "unknown";

export interface EmailCheck {
  email: string;
  status: CheckStatus;
  /** Plain-English reason shown to the rep or admin. */
  reason: string;
  /** "builtin" = syntax, typo, disposable, role and MX records (cannot confirm the mailbox); "reacher" = a real SMTP probe. */
  source: "builtin" | "reacher";
  details: Record<string, unknown>;
  checkedAt: string;
}

export const CHECK_MAX_AGE_DAYS = 30;

// ------------------------------------------------------------------------------------------------ static knowledge
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com", "10minutemail.com", "10minutemail.net",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "throwawaymail.com", "yopmail.com", "yopmail.net", "trashmail.com", "trashmail.net", "getnada.com",
  "dispostable.com", "maildrop.cc", "mailnesia.com", "fakeinbox.com", "mintemail.com", "mohmal.com", "emailondeck.com", "tempinbox.com", "spamgourmet.com",
  "mytemp.email", "tempr.email", "discard.email", "burnermail.io", "moakt.com", "tmpmail.org", "tmpmail.net", "mailcatch.com", "spambox.us", "mailtemp.info",
  "anonbox.net", "33mail.com", "guerrillamailblock.com", "inboxkitten.com", "emailfake.com", "fakemail.net", "tempail.com", "dropmail.me", "mail.tm", "temp.mail",
]);

const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.com.au", "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "icloud.com", "me.com",
  "aol.com", "proton.me", "protonmail.com", "gmx.com", "gmx.net", "yandex.com", "mail.com", "zoho.com", "bigpond.com", "optusnet.com.au", "bigpond.net.au",
]);

const ROLE_LOCALS = new Set(["info", "sales", "admin", "support", "contact", "hello", "enquiries", "enquiry", "office", "accounts", "billing", "team", "mail", "help", "service", "reception", "bookings", "marketing", "hr", "jobs", "careers", "press", "media", "webmaster", "postmaster", "abuse"]);
const NO_REPLY = /^(no-?reply|do-?not-?reply|donotreply|noreply|mailer-daemon|bounce|bounces|unsubscribe)([._+-].*)?$/i;

/** Domains people mistype: used only to suggest a correction (never to block). */
const POPULAR = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "aol.com", "protonmail.com", "yahoo.com.au", "bigpond.com", "optusnet.com.au", "hotmail.co.uk", "yahoo.co.uk", "me.com", "msn.com"];

/** Edit distance where swapping two neighbouring letters ("gmial" for "gmail") counts as one mistake. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  }
  return dp[a.length][b.length];
}

export function suggestDomain(domain: string): string | null {
  if (POPULAR.includes(domain)) return null;
  const best = POPULAR.map((p) => ({ p, d: levenshtein(domain, p) })).filter((x) => x.d > 0 && x.d <= 1 && domain.length >= 6).sort((x, y) => x.d - y.d)[0];
  return best?.p ?? null;
}

/** Practical syntax check (RFC-lite): one @, sane local part, a dotted ASCII-able domain. */
export function checkSyntax(email: string): { ok: boolean; local: string; domain: string; reason?: string } {
  const e = email.trim();
  const at = e.lastIndexOf("@");
  if (at < 1 || at !== e.indexOf("@")) return { ok: false, local: "", domain: "", reason: "That is not a valid email address (it needs exactly one @)." };
  const local = e.slice(0, at);
  const rawDomain = e.slice(at + 1).toLowerCase();
  const domain = domainToASCII(rawDomain);
  if (e.length > 254 || local.length > 64) return { ok: false, local, domain, reason: "That address is too long to be valid." };
  if (/\s/.test(e) || /\.\./.test(e) || local.startsWith(".") || local.endsWith(".")) return { ok: false, local, domain, reason: "That address has invalid characters or dots." };
  if (!/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local)) return { ok: false, local, domain, reason: "The part before the @ has invalid characters." };
  if (!domain || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) return { ok: false, local, domain, reason: "The domain after the @ is not valid." };
  return { ok: true, local, domain };
}

// ------------------------------------------------------------------------------------------------ DNS
export type MxResult = { kind: "mx"; hosts: string[] } | { kind: "none"; reason: "nxdomain" | "no_mail" } | { kind: "error" };
export type MxResolver = (domain: string) => Promise<MxResult>;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(Object.assign(new Error("dns timeout"), { code: "ETIMEOUT" })), ms))]);

/** Looks up the domain's mail servers; falls back to an A/AAAA record (the implicit-MX rule). Timeouts are "error", never "dead". */
export const defaultMxResolver: MxResolver = async (domain) => {
  if (process.env.VITEST) return { kind: "mx", hosts: [domain] }; // unit tests must not depend on the network
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 5000);
    const hosts = mx.sort((a, b) => a.priority - b.priority).map((m) => m.exchange).filter((h) => h && h !== ".");
    if (mx.length > 0 && hosts.length === 0) return { kind: "none", reason: "no_mail" }; // null MX: "this domain accepts no mail"
    if (hosts.length > 0) return { kind: "mx", hosts };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "ENOTFOUND") return { kind: "none", reason: "nxdomain" };
    if (code !== "ENODATA") return { kind: "error" };
  }
  try {
    const a = await withTimeout(dns.resolve4(domain), 5000).catch(() => withTimeout(dns.resolve6(domain), 5000));
    return a.length > 0 ? { kind: "mx", hosts: [domain] } : { kind: "none", reason: "no_mail" };
  } catch (e) {
    const code = (e as { code?: string }).code;
    return code === "ENOTFOUND" || code === "ENODATA" ? { kind: "none", reason: "no_mail" } : { kind: "error" };
  }
};

// ------------------------------------------------------------------------------------------------ the free checks
export async function builtinCheck(email: string, resolve: MxResolver = defaultMxResolver, now = new Date()): Promise<EmailCheck> {
  const clean = normalizeEmail(email);
  const base = { email: clean, source: "builtin" as const, checkedAt: now.toISOString() };
  const s = checkSyntax(clean);
  if (!s.ok) return { ...base, status: "invalid", reason: s.reason ?? "Invalid address.", details: { syntax: false } };

  const details: Record<string, unknown> = { syntax: true, domain: s.domain, role: ROLE_LOCALS.has(s.local.toLowerCase()), freeProvider: FREE_PROVIDERS.has(s.domain) };
  if (NO_REPLY.test(s.local)) return { ...base, status: "invalid", reason: "This is a no-reply mailbox: nobody reads it.", details: { ...details, noReply: true } };
  if (DISPOSABLE.has(s.domain)) return { ...base, status: "invalid", reason: "This is a disposable-email address that will not reach a real person.", details: { ...details, disposable: true } };

  const mx = await resolve(s.domain);
  if (mx.kind === "none") {
    return { ...base, status: "invalid", reason: mx.reason === "nxdomain" ? `The domain ${s.domain} does not exist.` : `The domain ${s.domain} has no mail server, so it cannot receive email.`, details: { ...details, mx: false } };
  }
  if (mx.kind === "error") return { ...base, status: "unknown", reason: "The domain's mail records could not be looked up right now.", details: { ...details, mx: null } };

  details.mx = true;
  details.mxHosts = mx.hosts.slice(0, 3);
  const typo = suggestDomain(s.domain);
  if (typo) return { ...base, status: "risky", reason: `The domain looks like a typo. Did you mean ${s.local}@${typo}?`, details: { ...details, typoOf: typo } };
  return { ...base, status: "safe", reason: "The domain accepts email. (The mailbox itself cannot be confirmed without a mail-server probe.)", details };
}

// ------------------------------------------------------------------------------------------------ optional: Reacher (SMTP probe)
interface ReacherResponse {
  is_reachable?: string;
  misc?: { is_disposable?: boolean; is_role_account?: boolean };
  smtp?: { is_deliverable?: boolean; is_disabled?: boolean; has_full_inbox?: boolean; is_catch_all?: boolean; can_connect_smtp?: boolean };
}

export function reacherConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean((env.REACHER_URL ?? "").trim());
}

/**
 * Asks a Reacher backend you host (it needs outbound port 25, which Vercel does not have). Returns null on any failure so the
 * free checks stand: an unreachable probe service must never block or delay sending.
 */
export async function reacherCheck(email: string, opts: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch; now?: Date } = {}): Promise<EmailCheck | null> {
  const env = opts.env ?? process.env;
  const url = (env.REACHER_URL ?? "").trim().replace(/\/$/, "");
  if (!url) return null;
  try {
    const res = await (opts.fetcher ?? fetch)(`${url}/v0/check_email`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(env.REACHER_SECRET ? { "x-reacher-secret": env.REACHER_SECRET } : {}) },
      body: JSON.stringify({ to_email: email }),
      signal: AbortSignal.timeout(25_000),
      redirect: "error",
    });
    if (!res.ok) return null;
    const j = (await res.json()) as ReacherResponse;
    const map: Record<string, CheckStatus> = { safe: "safe", risky: "risky", invalid: "invalid", unknown: "unknown" };
    const status = map[String(j.is_reachable)] ?? "unknown";
    const sm = j.smtp ?? {};
    const reason =
      status === "invalid" ? (sm.is_disabled ? "The mailbox has been disabled." : sm.is_deliverable === false ? "The mail server says this mailbox does not exist." : "The mail server rejected this address.")
      : status === "risky" ? (sm.is_catch_all ? "The domain accepts mail for any address, so this mailbox cannot be confirmed." : sm.has_full_inbox ? "The mailbox is full." : "The mail server gave a risky answer.")
      : status === "safe" ? "The mail server confirmed this mailbox." : "The mail server did not give a clear answer.";
    return { email: normalizeEmail(email), status, reason, source: "reacher", details: { disposable: !!j.misc?.is_disposable, role: !!j.misc?.is_role_account, catchAll: !!sm.is_catch_all, fullInbox: !!sm.has_full_inbox, disabled: !!sm.is_disabled }, checkedAt: (opts.now ?? new Date()).toISOString() };
  } catch {
    return null;
  }
}

/** Combines the free checks with the optional probe: a free-check "invalid" is final; otherwise a real probe answer wins. */
export async function runCheck(email: string, deps: { resolve?: MxResolver; reacher?: (email: string) => Promise<EmailCheck | null>; now?: Date } = {}): Promise<EmailCheck> {
  const free = await builtinCheck(email, deps.resolve, deps.now);
  if (free.status === "invalid") return free;
  const probe = await (deps.reacher ?? ((e: string) => reacherCheck(e, { now: deps.now })))(email);
  if (!probe) return free;
  if (probe.status === "unknown" && free.status !== "unknown") return free; // an inconclusive probe adds nothing
  return { ...probe, details: { ...free.details, ...probe.details } };
}

// ------------------------------------------------------------------------------------------------ cache
const rowToCheck = (r: { email_normalized: string; status: CheckStatus; reason: string; source: "builtin" | "reacher"; details: Record<string, unknown>; checked_at: string }): EmailCheck => ({
  email: r.email_normalized, status: r.status, reason: r.reason, source: r.source, details: r.details ?? {}, checkedAt: r.checked_at,
});

export const isFresh = (checkedAt: string, now = new Date(), days = CHECK_MAX_AGE_DAYS) => now.getTime() - Date.parse(checkedAt) < days * 86_400_000;

export async function getCachedCheck(db: Db, email: string): Promise<EmailCheck | null> {
  const { data } = await db.from("acq_email_checks").select("*").eq("email_normalized", normalizeEmail(email)).maybeSingle();
  return data ? rowToCheck(data as never) : null;
}

/**
 * The result for an address: the cached one if it is under 30 days old (or `force` is not set), otherwise a fresh check that is
 * saved. Never throws: a failed save still returns the result.
 */
export async function verifyEmail(db: Db, email: string, opts: { force?: boolean; deps?: Parameters<typeof runCheck>[1]; now?: Date } = {}): Promise<EmailCheck> {
  const now = opts.now ?? new Date();
  if (!opts.force) {
    const cached = await getCachedCheck(db, email).catch(() => null);
    // An "unknown" (DNS hiccup) is retried sooner than a real answer.
    if (cached && isFresh(cached.checkedAt, now, cached.status === "unknown" ? 0.04 : CHECK_MAX_AGE_DAYS)) return cached;
  }
  const result = await runCheck(email, { ...opts.deps, now });
  await db.from("acq_email_checks").upsert({ email_normalized: result.email, status: result.status, reason: result.reason, source: result.source, details: result.details, checked_at: result.checkedAt }, { onConflict: "email_normalized" });
  return result;
}
