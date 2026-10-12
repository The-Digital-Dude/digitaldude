import { createHmac, timingSafeEqual } from "node:crypto";
import { webhookSecret } from "../env";

/**
 * Email provider boundary. Sending is intentionally NOT implemented yet: the
 * blueprint requires the approval + suppression vertical slice to be proven
 * before any automated sender exists. When a provider is chosen, implement
 * `send` and route every call through `acq_reserve_send()` first.
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
}

export interface EmailProvider {
  readonly name: string;
  send(msg: OutboundEmail): Promise<{ providerMessageId: string }>;
  /** Verify authenticity first; throw WebhookAuthError if it can't be verified. */
  verifyAndParseWebhook(rawBody: string, headers: Headers): InboundEmailEvent[];
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

export function getEmailProvider(): EmailProvider {
  return new GenericWebhookProvider();
}
