import { createHmac, timingSafeEqual } from "node:crypto";
import { brevoSenderEmail, webhookSecret } from "../env";

/**
 * Email provider boundary. `send` must only ever be called after
 * `reserveSend()` (acq_reserve_send) has approved the message; see queue/send.ts.
 * Brevo is the production provider; the generic provider can only parse webhooks.
 */

export type InboundEventType = "delivered" | "bounced" | "complained" | "replied" | "unsubscribed";

export interface InboundEmailEvent {
  /** Provider-unique id; used to de-duplicate redelivered webhooks. */
  id: string;
  type: InboundEventType;
  email: string;
  providerMessageId?: string;
  bounceType?: "hard" | "soft";
  body?: string;
  occurredAt?: string;
}

export interface OutboundEmail {
  to: string;
  from: { name: string; email: string };
  subject: string;
  text: string;
  headers: Record<string, string>;
  replyTo?: { name?: string; email: string };
}

/** The provider answered and refused the message (nothing was sent). Safe to mark failed. */
export class ProviderRejectedError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ProviderRejectedError";
  }
}

export interface EmailProvider {
  readonly name: string;
  send(msg: OutboundEmail): Promise<{ providerMessageId: string }>;
  /** Verify authenticity first; throw WebhookAuthError if it can't be verified. */
  verifyAndParseWebhook(rawBody: string, headers: Headers, url?: string): InboundEmailEvent[];
}

export class WebhookAuthError extends Error {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "WebhookAuthError";
  }
}

/** RFC 8058 one-click unsubscribe headers (POST target must be the same URL). */
export function listUnsubscribeHeaders(url: string): Record<string, string> {
  return { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}

const TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verifies `x-acq-signature: sha256=<hex>` where the HMAC covers `${timestamp}.${rawBody}`
 * and `x-acq-timestamp` is within 5 minutes. Provider-specific adapters can reuse this
 * or substitute their own scheme.
 */
export function verifyHmacSignature(rawBody: string, headers: Headers, secret: string, now = Date.now()): void {
  const ts = headers.get("x-acq-timestamp");
  const sig = (headers.get("x-acq-signature") ?? "").replace(/^sha256=/, "");
  const tsNum = Number(ts);
  if (!ts || !Number.isFinite(tsNum) || Math.abs(now - tsNum * 1000) > TOLERANCE_MS) throw new WebhookAuthError("Stale or missing timestamp");
  const expected = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "hex");
  } catch {
    throw new WebhookAuthError();
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new WebhookAuthError();
}

export function signWebhookBody(rawBody: string, secret: string, timestampSeconds: number): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestampSeconds}.${rawBody}`).digest("hex");
}

/** Placeholder provider: authenticates + parses our normalised event format; cannot send. */
export class GenericWebhookProvider implements EmailProvider {
  readonly name = "generic";

  async send(): Promise<{ providerMessageId: string }> {
    throw new Error("Automated sending is not enabled. Implement EmailProvider.send once a provider is approved.");
  }

  verifyAndParseWebhook(rawBody: string, headers: Headers): InboundEmailEvent[] {
    const secret = webhookSecret();
    if (!secret) throw new WebhookAuthError("Webhook secret is not configured");
    verifyHmacSignature(rawBody, headers, secret);
    const parsed = JSON.parse(rawBody) as { events?: InboundEmailEvent[] } | InboundEmailEvent[];
    return Array.isArray(parsed) ? parsed : parsed.events ?? [];
  }
}

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/** Maps a Brevo transactional webhook event name to our normalised event, or null to ignore it. */
export function mapBrevoEvent(ev: Record<string, unknown>): InboundEmailEvent | null {
  const name = String(ev.event ?? "").toLowerCase();
  const email = typeof ev.email === "string" ? ev.email : "";
  if (!email) return null;
  const messageId = typeof ev["message-id"] === "string" ? (ev["message-id"] as string) : undefined;
  const occurredAt = typeof ev.ts_event === "number" ? new Date(ev.ts_event * 1000).toISOString() : undefined;
  const id = ev.id != null ? `brevo:${String(ev.id)}` : `brevo:${messageId ?? email}:${name}:${String(ev.ts_event ?? "")}`;
  const base = { id, email, providerMessageId: messageId, occurredAt };
  switch (name) {
    case "delivered":
      return { ...base, type: "delivered" };
    case "hard_bounce":
    case "invalid_email":
      return { ...base, type: "bounced", bounceType: "hard" };
    case "soft_bounce":
    case "blocked":
    case "deferred":
      return { ...base, type: "bounced", bounceType: "soft" };
    case "spam":
    case "complaint":
      return { ...base, type: "complained" };
    case "unsubscribe":
    case "unsubscribed":
      return { ...base, type: "unsubscribed" };
    default:
      return null; // request / opened / click etc. are not needed
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Brevo: sends through the transactional API from the dedicated sending subdomain.
 * Brevo webhooks are not HMAC-signed, so they are authenticated with ACQ_WEBHOOK_SECRET
 * sent as `Authorization: Bearer <secret>` (or `?token=<secret>` on the URL); fails closed.
 */
export class BrevoProvider implements EmailProvider {
  readonly name = "brevo";

  async send(msg: OutboundEmail): Promise<{ providerMessageId: string }> {
    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is not configured");
    let res: Response;
    try {
      res = await fetch(BREVO_URL, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
        body: JSON.stringify({
          sender: msg.from,
          to: [{ email: msg.to }],
          ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
          subject: msg.subject,
          textContent: msg.text,
          headers: msg.headers,
          tags: ["acquisition"],
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      // Network failure/timeout: Brevo may or may not have accepted it. Not safe to retry.
      throw new Error(`Brevo request outcome unknown: ${(e as Error).message}`);
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
    if (!res.ok) {
      if (res.status >= 500) throw new Error(`Brevo server error ${res.status}: outcome unknown`);
      throw new ProviderRejectedError(data.message ?? `Brevo rejected the message (${res.status})`, res.status);
    }
    if (!data.messageId) throw new Error("Brevo accepted the message but returned no messageId");
    return { providerMessageId: data.messageId };
  }

  verifyAndParseWebhook(rawBody: string, headers: Headers, url?: string): InboundEmailEvent[] {
    const secret = webhookSecret();
    if (!secret) throw new WebhookAuthError("Webhook secret is not configured");
    const bearer = (headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const queryToken = url ? new URL(url).searchParams.get("token") ?? "" : "";
    if (!timingSafeEqualStr(bearer, secret) && !timingSafeEqualStr(queryToken, secret)) throw new WebhookAuthError();
    const parsed = JSON.parse(rawBody) as Record<string, unknown> | Record<string, unknown>[];
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map(mapBrevoEvent).filter((e): e is InboundEmailEvent => e !== null);
  }
}

export function getEmailProvider(): EmailProvider {
  const hasKey = Boolean(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY);
  return hasKey && brevoSenderEmail() ? new BrevoProvider() : new GenericWebhookProvider();
}
