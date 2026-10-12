import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

/**
 * Safe page fetching for research. The URL is supplied by an operator but the
 * *content* is untrusted, and a malicious/compromised domain could redirect to
 * internal addresses (SSRF). Defences: http(s) only, standard ports, every hop's
 * resolved address is validated at connect time (no DNS-rebinding window),
 * redirects are followed manually and revalidated, size/time are capped.
 */

export const RESEARCH_USER_AGENT = "DigitalDudeResearchBot/1.0 (+https://www.digitaldude.co.uk)";
const MAX_BYTES = 600_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

function ipv4ToBytes(ip: string): number[] | null {
  const p = ip.split(".").map(Number);
  return p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? p : null;
}

function ipv6ToBytes(ip: string): number[] | null {
  let s = ip.split("%")[0].toLowerCase();
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const b = ipv4ToBytes(v4[1]);
    if (!b) return null;
    s = s.slice(0, s.length - v4[1].length) + ((b[0] << 8) | b[1]).toString(16) + ":" + ((b[2] << 8) | b[3]).toString(16);
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...tail];
  const bytes: number[] = [];
  for (const g of groups) {
    const n = Number.parseInt(g || "0", 16);
    if (!Number.isInteger(n) || n < 0 || n > 0xffff) return null;
    bytes.push(n >> 8, n & 0xff);
  }
  return bytes.length === 16 ? bytes : null;
}

function publicV4(b: number[]): boolean {
  const [a, c] = b;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false; // this-net, private, loopback, multicast/reserved
  if (a === 100 && c >= 64 && c <= 127) return false; // CGNAT
  if (a === 169 && c === 254) return false; // link-local incl. cloud metadata
  if (a === 172 && c >= 16 && c <= 31) return false;
  if (a === 192 && c === 168) return false;
  if (a === 192 && c === 0 && b[2] === 0) return false; // IETF protocol assignments
  if (a === 192 && c === 0 && b[2] === 2) return false; // TEST-NET-1
  if (a === 198 && (c === 18 || c === 19)) return false; // benchmarking
  if (a === 198 && c === 51 && b[2] === 100) return false;
  if (a === 203 && c === 0 && b[2] === 113) return false;
  return true;
}

export function isPublicIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const b = ipv4ToBytes(ip);
    return !!b && publicV4(b);
  }
  if (kind === 6) {
    const b = ipv6ToBytes(ip);
    if (!b) return false;
    if (b.every((x, i) => (i < 15 ? x === 0 : x <= 1))) return false; // :: and ::1
    if ((b[0] & 0xfe) === 0xfc) return false; // fc00::/7 unique local
    if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return false; // fe80::/10 link-local
    if (b[0] === 0xff) return false; // multicast
    if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return false; // documentation
    const mapped = b.slice(0, 10).every((x) => x === 0) && b[10] === 0xff && b[11] === 0xff; // ::ffff:a.b.c.d
    const nat64 = b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && b.slice(4, 12).every((x) => x === 0);
    if (mapped || nat64) return publicV4(b.slice(12));
    return true;
  }
  return false;
}

/** DNS lookup that refuses to hand back any non-public address. */
const guardedLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return (callback as (e: Error | null) => void)(err);
    const list = addresses as dns.LookupAddress[];
    const ok = list.filter((a) => isPublicIp(a.address));
    if (list.length === 0 || ok.length !== list.length) {
      return (callback as (e: Error | null) => void)(new Error(`Blocked: ${hostname} resolves to a non-public address`));
    }
    if ((options as { all?: boolean }).all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, ok);
    (callback as unknown as (e: null, a: string, f: number) => void)(null, ok[0].address, ok[0].family);
  });
};

export interface FetchedPage {
  url: string;
  status: number;
  contentType: string;
  body: string;
}

export function validateFetchUrl(raw: string): URL {
  const u = new URL(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs may be fetched");
  if (u.username || u.password) throw new Error("URLs with credentials are not allowed");
  if (u.port && !["80", "443"].includes(u.port)) throw new Error("Non-standard ports are not allowed");
  if (net.isIP(u.hostname.replace(/^\[|\]$/g, "")) && !isPublicIp(u.hostname.replace(/^\[|\]$/g, ""))) {
    throw new Error("Blocked: non-public address");
  }
  return u;
}

function requestOnce(u: URL): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      u,
      {
        method: "GET",
        lookup: guardedLookup,
        timeout: TIMEOUT_MS,
        headers: { "user-agent": RESEARCH_USER_AGENT, accept: "text/html,text/plain;q=0.9,*/*;q=0.1" },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_BYTES) {
            req.destroy(new Error("Response too large"));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.end();
  });
}

export async function safeFetchPage(rawUrl: string): Promise<FetchedPage> {
  let u = validateFetchUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestOnce(u);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      u = validateFetchUrl(new URL(res.headers.location, u).toString());
      continue;
    }
    const contentType = String(res.headers["content-type"] ?? "");
    if (res.status >= 200 && res.status < 300 && !/text\/(html|plain)|application\/xhtml/i.test(contentType)) {
      throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
    }
    return { url: u.toString(), status: res.status, contentType, body: res.body };
  }
  throw new Error("Too many redirects");
}

/** Minimal robots.txt evaluation for our user agent (falls back to `*`). */
export function isAllowedByRobots(robotsTxt: string, path: string, agent = "digitaldude"): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && cur) {
      cur.rules.push({ allow: key === "allow", path: val });
      lastWasAgent = false;
    } else lastWasAgent = false;
  }
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && agent.includes(a)));
  const applicable = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  let best: { allow: boolean; len: number } | null = null;
  for (const g of applicable) {
    for (const r of g.rules) {
      if (!r.path) continue; // "Disallow:" with empty value allows everything
      if (path.startsWith(r.path) && (!best || r.path.length > best.len || (r.path.length === best.len && r.allow))) {
        best = { allow: r.allow, len: r.path.length };
      }
    }
  }
  return best ? best.allow : true;
}

export function htmlToText(html: string, maxChars = 20_000): string {
  const text = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  return text.slice(0, maxChars);
}

/** Same-host links worth reading (about/services/portfolio pages), most relevant first. */
export function candidateLinks(html: string, baseUrl: string, max = 2): string[] {
  const base = new URL(baseUrl);
  const scored = new Map<string, number>();
  for (const m of html.matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) {
    let u: URL;
    try {
      u = new URL(m[1], base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (!/^https?:$/.test(u.protocol) || u.pathname === "/" || u.pathname === base.pathname) continue;
    const p = u.pathname.toLowerCase();
    const score =
      (/about|who-we-are|our-team|team/.test(p) ? 3 : 0) +
      (/service|manage|rental|landlord|owner|portfolio|propert/.test(p) ? 2 : 0);
    if (score > 0 && !/\.(pdf|jpg|png|zip)$/.test(p)) scored.set(u.origin + u.pathname, Math.max(score, scored.get(u.origin + u.pathname) ?? 0));
  }
  return [...scored.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([url]) => url);
}
