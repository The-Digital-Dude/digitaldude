/** Canonical forms used for every comparison, so "A@B.com " and "a@b.com" are one identity. */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function emailDomain(email: string): string | null {
  const d = normalizeEmail(email).split("@")[1];
  return d ? d : null;
}

/** Accepts a URL or bare host; returns the lower-case host without "www.", or null. */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  try {
    const host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, "");
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/** Domain-wide suppression of these would block every customer of the provider. */
export const FREE_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "yahoo.com.au",
  "icloud.com", "me.com", "bigpond.com", "bigpond.net.au", "optusnet.com.au", "tpg.com.au", "iinet.net.au",
  "protonmail.com", "proton.me", "aol.com", "msn.com",
]);

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_DOMAINS.has(domain.trim().toLowerCase());
}
