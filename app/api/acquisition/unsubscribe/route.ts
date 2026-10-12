import { getDb } from "@/lib/acquisition/db";
import { suppressEmail } from "@/lib/acquisition/compliance/suppression";
import { verifyUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { unsubscribeSecret } from "@/lib/acquisition/env";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>` +
      `<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#1a1a2e}button{font:inherit;padding:.7rem 1.4rem;border:0;border-radius:.5rem;background:#5b2bd6;color:#fff;cursor:pointer}</style>` +
      `</head><body><h1>${esc(title)}</h1>${body}</body></html>`,
    { status, headers: HEADERS }
  );
}

const mask = (email: string) => email.replace(/^(.).*(@.*)$/, "$1***$2");

function secretOrNull() {
  try {
    return unsubscribeSecret();
  } catch {
    return null;
  }
}

/** Safe confirmation page. A GET never changes anything (mail scanners prefetch links). */
export async function GET(request: Request) {
  const secret = secretOrNull();
  const token = new URL(request.url).searchParams.get("t");
  const email = secret ? verifyUnsubscribeToken(token, secret) : null;
  if (!email) return page("Link not valid", "<p>This unsubscribe link is invalid or incomplete. Please reply to the email and ask to be removed, or contact info@digitaldude.co.uk.</p>", 400);
  return page(
    "Unsubscribe",
    `<p>Stop all marketing emails from The Digital Dude to <strong>${esc(mask(email))}</strong>?</p>` +
      `<form method="post" action="?t=${encodeURIComponent(token!)}"><button type="submit">Yes, unsubscribe me</button></form>`
  );
}

/** Applies the opt-out. Also the RFC 8058 one-click target (`List-Unsubscribe=One-Click`). */
export async function POST(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  const limited = rateLimit(`acq-unsub:${ip}`, 30, 60_000);
  if (!limited.ok) return page("Too many requests", "<p>Please try again in a minute.</p>", 429);

  const secret = secretOrNull();
  let token = new URL(request.url).searchParams.get("t");
  if (!token) {
    try {
      token = String((await request.formData()).get("t") ?? "") || null;
    } catch {
      /* no form body */
    }
  }
  const email = secret ? verifyUnsubscribeToken(token, secret) : null;
  if (!email) return page("Link not valid", "<p>This unsubscribe link is invalid. Please reply to the email and ask to be removed.</p>", 400);

  try {
    await suppressEmail(getDb(), email, "unsubscribe", "unsubscribe-link");
  } catch (e) {
    log("error", { message: "unsubscribe failed", error: e });
    // Never claim success when the opt-out was not recorded.
    return page("Something went wrong", "<p>We couldn't record your request. Please reply to the email to opt out and we will remove you promptly.</p>", 500);
  }
  return page("You're unsubscribed", "<p>We won't send you any more marketing emails. This can take effect immediately; if you receive another, please reply and let us know.</p>");
}
