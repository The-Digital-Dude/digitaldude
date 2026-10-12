import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "../normalize";

/**
 * Stateless, tamper-proof unsubscribe token: base64url(email) "." base64url(HMAC).
 * No expiry on purpose — an unsubscribe link in an old email must keep working.
 * The link identifies the recipient to themselves only; it grants no other access.
 */
function sign(email: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`unsubscribe:${email}`).digest();
}

export function createUnsubscribeToken(email: string, secret: string): string {
  const e = normalizeEmail(email);
  return `${Buffer.from(e, "utf8").toString("base64url")}.${sign(e, secret).toString("base64url")}`;
}

/** Returns the normalised email if the token is authentic, otherwise null. */
export function verifyUnsubscribeToken(token: string | null | undefined, secret: string): string | null {
  if (!token || token.length > 1024) return null;
  const [encoded, mac, extra] = token.split(".");
  if (!encoded || !mac || extra !== undefined) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email || email !== normalizeEmail(email) || !email.includes("@")) return null;
  const given = Buffer.from(mac, "base64url");
  const expected = sign(email, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return email;
}
