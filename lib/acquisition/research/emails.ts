import { isFreeMailDomain, normalizeEmail, normalizeDomain } from "../normalize";

export interface ExtractedEmail {
  email: string;
  excerpt: string;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
const JUNK_LOCAL = /^(noreply|no-reply|donotreply|do-not-reply|example|test|yourname|name|email|user|sentry|privacy|abuse|postmaster|webmaster|mailer-daemon)$/i;
const JUNK_DOMAIN = /(^|\.)(example\.|sentry\.|wixpress\.com$|godaddy\.com$)/i;
const FILE_TAIL = /\.(png|jpe?g|gif|svg|webp|css|js|pdf)$/i;

/**
 * Emails literally published on a fetched page of the company's OWN domain.
 * Suggestions only: nothing here is a contact, and nothing here may be emailed.
 * Free-mail, placeholder and tool addresses are excluded.
 */
export function extractOwnDomainEmails(rawHtml: string, visibleText: string, companyWebsite: string): ExtractedEmail[] {
  const companyDomain = normalizeDomain(companyWebsite);
  if (!companyDomain) return [];
  const found = new Set<string>();
  for (const m of rawHtml.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    try {
      found.add(normalizeEmail(decodeURIComponent(m[1])));
    } catch {
      /* ignore malformed */
    }
  }
  for (const m of visibleText.matchAll(EMAIL_RE)) found.add(normalizeEmail(m[0]));

  const out: ExtractedEmail[] = [];
  for (const email of found) {
    const [local, domain] = email.split("@");
    if (!local || !domain || FILE_TAIL.test(email) || JUNK_LOCAL.test(local) || JUNK_DOMAIN.test(domain) || isFreeMailDomain(domain)) continue;
    if (domain !== companyDomain && !domain.endsWith(`.${companyDomain}`)) continue;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    out.push({ email, excerpt: excerptAround(visibleText, email) });
  }
  return out;
}

function excerptAround(text: string, email: string): string {
  const i = text.toLowerCase().indexOf(email);
  if (i < 0) return `Published as a mailto link on the page (${email})`;
  const start = Math.max(0, i - 80);
  return text.slice(start, Math.min(text.length, i + email.length + 80)).replace(/\s+/g, " ").trim();
}
