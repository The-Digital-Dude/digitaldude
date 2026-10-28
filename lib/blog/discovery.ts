import { extractJson, type AiProvider } from "@/lib/acquisition/providers/ai";
import { authorForCategory } from "@/lib/content/authors";
import { allowedLinks } from "./facts";
import type { BlogTopic } from "./topics";
import type { GscRow } from "./gsc";

/**
 * Finding new blog topics automatically. Real search queries from Search Console (and a few search suggestions) are filtered for
 * relevance, compared with what the site already covers, and turned into briefs by the AI. The AI may only choose from the phrases it is
 * given, so it cannot invent a keyword; everything it returns is validated before it reaches the queue.
 */
export interface Candidate {
  keyword: string;
  impressions: number;
  position: number;
  source: "search-console" | "autocomplete";
  evidence: string;
}

const BRAND = /digital\s*-?\s*dude|digitaldude/i;
/** Search operators, URLs and junk that appear in scraped queries. */
const OPERATORS = /(?:site:|intitle:|inurl:|filetype:|related:|cache:|https?:|www\.|\.com|\.co\.uk|["()=<>|\\])|(?:^|\s)-\S/i;
/** A query must be about something we write about. */
const TOPICAL = /\b(?:crm|saas|marketplace|software|app development|web app|custom|bespoke|erp|hrm|portal|automation|workflow|spreadsheet|excel|booking|chatbot|multi[- ]?tenant|stripe|gdpr|agency|mvp|development cost|seo|google ads|ppc|e-?commerce|shopify|airtable|salesforce|hubspot|zoho|pipedrive|ai (?:agent|receptionist|phone|ordering|chatbot)|dispatch|logistics|recruitment|property management|client portal|integration|api|build(?:ing)? an? )\b/i;

export function isCandidateQuery(raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (q.length < 6 || q.length > 80) return false;
  const words = q.split(/\s+/);
  if (words.length < 2 || words.length > 9) return false;
  if (!/^[a-z0-9 &'/+.,?-]+$/.test(q)) return false; // plain English only
  if (BRAND.test(q) || OPERATORS.test(q)) return false;
  return TOPICAL.test(q);
}

const STOP = new Set(["a", "an", "the", "for", "of", "to", "in", "on", "and", "or", "vs", "versus", "with", "how", "what", "is", "are", "do", "does", "i", "my", "your", "can", "should", "best", "uk"]);

export function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/** Does the site already cover this phrase (an existing post or topic about the same thing)? */
export function isCovered(keyword: string, existing: { keyword: string; title: string }[]): boolean {
  const k = new Set(tokens(keyword));
  if (k.size === 0) return true;
  for (const e of existing) {
    for (const text of [e.keyword, e.title]) {
      const t = new Set(tokens(text));
      if (t.size === 0) continue;
      const inter = [...k].filter((x) => t.has(x)).length;
      const union = new Set([...k, ...t]).size;
      if (inter / union >= 0.6) return true;
      if ([...k].every((x) => t.has(x)) && k.size >= 2) return true; // every word of the phrase is already in an existing title
    }
  }
  return false;
}

/** Search Console rows -> candidate topics, best opportunity first. */
export function candidatesFromGsc(rows: GscRow[], opts: { minImpressions?: number } = {}): Candidate[] {
  const min = opts.minImpressions ?? 2;
  const out: Candidate[] = [];
  for (const r of rows) {
    if (!isCandidateQuery(r.key) || r.impressions < min) continue;
    out.push({ keyword: r.key.trim().toLowerCase(), impressions: r.impressions, position: r.position, source: "search-console", evidence: `Search Console: ${r.impressions} impressions, average position ${r.position.toFixed(0)}` });
  }
  const score = (c: Candidate) => c.impressions * (1 + (30 - Math.min(c.position, 30)) / 30);
  return out.sort((a, b) => score(b) - score(a));
}

export const CATEGORIES = ["CRM Development", "Custom Software", "SaaS Development", "Marketplace Development", "AI Engineering", "Working With Us", "SEO & Performance", "Google Ads & PPC", "E-Commerce Growth"] as const;

const SYSTEM = `You turn real search phrases into blog topic briefs for The Digital Dude, a custom software studio (custom CRMs, SaaS, marketplaces, operations systems, client portals, e-commerce, AI features, technical SEO).

RULES
- You may ONLY use phrases from the CANDIDATES list as a topic's "keyword", copied exactly. Never invent a keyword.
- Skip (omit) any phrase that is not clearly something a business buyer or builder would search to learn about our field: skip login/support queries for other companies, jobs, courses, free-download or personal-use queries, and anything outside software, CRM, SaaS, marketplaces, automation, e-commerce, AI for business or search marketing.
- One topic per distinct search intent: if two phrases mean the same, use the better one.
- Do not propose a topic that duplicates anything in ALREADY COVERED.
- Write helpful, honest, non-promotional topics (guides, comparisons, checklists, cost explainers).

For each topic return: "keyword", "title" (40-70 characters, contains the keyword naturally), "slug" (lower-case words and hyphens, max 70 characters), "category" (exactly one of: ${CATEGORIES.join(" | ")}), "angle" (3 to 5 short points the article must cover), "links" (exactly 3 paths chosen from ALLOWED PAGES).
Return ONLY a JSON object: {"topics":[...]}.`;

export interface Existing {
  keyword: string;
  title: string;
  slug: string;
}

export function buildDiscoveryPrompt(cands: Candidate[], existing: Existing[], extraLinks: string[], max: number): string {
  return `Choose up to ${max} of the best topics.

CANDIDATES (real search phrases; impressions are searches where our site already appeared)
${cands.map((c) => `- ${c.keyword} (${c.evidence})`).join("\n")}

ALREADY COVERED (do not duplicate)
${existing.map((e) => `- ${e.title} [${e.keyword}]`).join("\n")}

ALLOWED PAGES
${[...allowedLinks(extraLinks)].sort().join("\n")}`;
}

/** Validates what the AI returned and turns it into queue-ready topics. Anything that does not check out is dropped. */
export function topicsFromAi(raw: unknown, cands: Candidate[], existing: Existing[], extraLinks: string[], max: number): { topics: (BlogTopic & { evidence: string; source: Candidate["source"] })[]; dropped: string[] } {
  const dropped: string[] = [];
  const list = Array.isArray((raw as { topics?: unknown })?.topics) ? ((raw as { topics: unknown[] }).topics as Record<string, unknown>[]) : [];
  const byKw = new Map(cands.map((c) => [c.keyword.toLowerCase(), c]));
  const links = allowedLinks(extraLinks);
  const usedSlugs = new Set(existing.map((e) => e.slug));
  const kept: { keyword: string; title: string }[] = [...existing];
  const topics: (BlogTopic & { evidence: string; source: Candidate["source"] })[] = [];

  for (const t of list) {
    if (topics.length >= max) break;
    const keyword = String(t.keyword ?? "").trim().toLowerCase();
    const cand = byKw.get(keyword);
    if (!cand) { dropped.push(`"${keyword}" was not one of the candidates`); continue; }
    const title = String(t.title ?? "").trim();
    const slug = String(t.slug ?? "").trim().toLowerCase();
    const category = String(t.category ?? "").trim();
    const angle = (Array.isArray(t.angle) ? t.angle : []).map((a) => String(a).trim()).filter((a) => a.length >= 5 && a.length <= 300).slice(0, 6);
    const picked = (Array.isArray(t.links) ? t.links : []).map((l) => String(l).trim()).filter((l) => links.has(l));
    if (title.length < 25 || title.length > 80) { dropped.push(`"${keyword}": title length`); continue; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) { dropped.push(`"${keyword}": bad slug`); continue; }
    if (usedSlugs.has(slug)) { dropped.push(`"${keyword}": slug already used`); continue; }
    if (!(CATEGORIES as readonly string[]).includes(category)) { dropped.push(`"${keyword}": unknown category`); continue; }
    if (angle.length < 2) { dropped.push(`"${keyword}": no brief`); continue; }
    if (isCovered(keyword, kept)) { dropped.push(`"${keyword}": already covered`); continue; }
    const finalLinks = [...new Set([...picked, "/contact"])].slice(0, 4);
    usedSlugs.add(slug);
    kept.push({ keyword, title });
    topics.push({ slug, title, keyword, secondary: [], category, author: authorForCategory(category) as BlogTopic["author"], angle, links: finalLinks, evidence: cand.evidence, source: cand.source });
  }
  return { topics, dropped };
}

/** Asks the AI to choose and brief the best topics. Never throws: on failure it returns nothing and says why. */
export async function proposeTopics(provider: AiProvider, cands: Candidate[], existing: Existing[], extraLinks: string[], max: number): Promise<{ topics: ReturnType<typeof topicsFromAi>["topics"]; dropped: string[]; error?: string }> {
  if (cands.length === 0 || max <= 0) return { topics: [], dropped: [] };
  try {
    const raw = await provider.completeJson({ system: SYSTEM, user: buildDiscoveryPrompt(cands.slice(0, 40), existing, extraLinks, max) });
    return topicsFromAi(extractJson(raw), cands, existing, extraLinks, max);
  } catch (e) {
    return { topics: [], dropped: [], error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------------------------------------------------------------------------------------------------------- search suggestions
export type Fetcher = typeof fetch;

/**
 * Real search suggestions for a seed phrase from KeywordTool.io's free guest endpoint (autocomplete text only; no volumes). Used sparingly
 * (a few seeds a week, well inside its guest limits) and best-effort: any failure returns nothing.
 */
export async function fetchSuggestions(seed: string, f: Fetcher = fetch): Promise<string[]> {
  const url = "https://mcp.keywordtool.io/guest";
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json,text/event-stream" };
  try {
    const init = await f(url, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "digitaldude-blog-autopilot", version: "1" } } }), signal: AbortSignal.timeout(15_000) });
    const sid = init.headers.get("mcp-session-id");
    if (!init.ok || !sid) return [];
    const h2 = { ...headers, "mcp-session-id": sid };
    await f(url, { method: "POST", headers: h2, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }), signal: AbortSignal.timeout(10_000) });
    const r = await f(url, { method: "POST", headers: h2, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "keywordtool-suggestions-guest", arguments: { keyword: seed, country: "United Kingdom", limit: 25 } } }), signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return [];
    const j = (await r.json()) as { result?: { structuredContent?: { data?: { string?: string }[] } } };
    return (j.result?.structuredContent?.data ?? []).map((d) => String(d.string ?? "").trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export function candidatesFromSuggestions(list: string[], seed: string): Candidate[] {
  return list.filter((q) => q !== seed.toLowerCase() && isCandidateQuery(q)).map((q) => ({ keyword: q, impressions: 0, position: 0, source: "autocomplete" as const, evidence: `Search suggestion for "${seed}" (people type this)` }));
}
