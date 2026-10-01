/**
 * Simple in-memory sliding-window rate limiter for Next.js Route Handlers.
 *
 * Works correctly for single-instance/single-region deployments (e.g. a
 * standard Vercel function per region). For multi-region or high-traffic
 * scenarios, replace `store` with an Upstash Redis adapter.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

/** Clean up expired entries to prevent unbounded memory growth. */
function prune() {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}

/**
 * Check whether the given key has exceeded `limit` requests within
 * `windowMs` milliseconds.
 *
 * @returns `{ ok: true }` when the request is allowed,
 *          `{ ok: false, retryAfter: number }` when the limit is exceeded.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfter: number } {
  prune();

  const now = Date.now();
  const win = store.get(key);

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (win.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { ok: true };
}

/** Extract a best-effort client IP from a Next.js request. */
export function getClientIp(request: Request): string | undefined {
  const headers = request.headers;
  const cf = headers.get("cf-connecting-ip");
  if (cf && cf.trim()) return cf.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  const fastly = headers.get("fastly-client-ip");
  if (fastly && fastly.trim()) return fastly.trim();

  const trueClient = headers.get("true-client-ip");
  if (trueClient && trueClient.trim()) return trueClient.trim();

  return undefined;
}
