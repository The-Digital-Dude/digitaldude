import { UNIQUE_VIOLATION, type Db } from "../db";
import { normalizeDomain } from "../normalize";
import { autoLimits } from "../env";
import { SearchNotConfiguredError, type SearchProvider, type SearchResult } from "../providers/search";
import { resolveSearchProvider } from "../secrets";
import { enqueueJob } from "../queue/enqueue";
import { logAudit } from "../audit";

export interface Market {
  id: string | null;
  name: string;
  industry: string;
  country: string;
  search_phrases: string[];
  places: string[];
  qualification_text: string;
  domain_suffixes: string[];
}

/** Used when no markets are configured (or the markets table does not exist yet): the original AU property-management behaviour. */
export const DEFAULT_MARKET: Market = {
  id: null,
  name: "Property management - Australia",
  industry: "Property management",
  country: "AU",
  search_phrases: ["property management company", "rental property managers", "real estate property management agency", "strata and property management"],
  places: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Gold Coast", "Newcastle", "Sunshine Coast", "Geelong", "Wollongong", "Townsville", "Cairns"],
  qualification_text: "Property management businesses that could benefit from custom software, workflow automation and owner/tenant reporting.",
  domain_suffixes: [".au"],
};

/** Portals, directories, social networks and aggregators are not the businesses we want. */
const DENY = [
  "realestate.com.au", "domain.com.au", "allhomes.com.au", "rent.com.au", "realestateview.com.au", "homely.com.au",
  "facebook.com", "linkedin.com", "instagram.com", "youtube.com", "twitter.com", "x.com", "tiktok.com", "reddit.com",
  "yellowpages.com.au", "truelocal.com.au", "hotfrog.com.au", "localsearch.com.au", "productreview.com.au", "oneflare.com.au",
  "airtasker.com", "gumtree.com.au", "seek.com.au", "indeed.com", "glassdoor.com.au", "wikipedia.org", "google.com", "bing.com",
  "reiv.com.au", "reinsw.com.au", "reiq.com", "gov.au", "edu.au", "abc.net.au", "news.com.au", "smh.com.au",
];

export interface Query {
  text: string;
}

/** Deterministic daily rotation so different days cover different phrase/place pairs of a market. */
export function queriesForDay(dayNumber: number, count: number, market: Market = DEFAULT_MARKET): Query[] {
  const places = market.places.length ? market.places : [""];
  const all: Query[] = [];
  for (const p of places) for (const t of market.search_phrases) all.push({ text: `${t} ${p}`.trim() });
  if (all.length === 0) return [];
  const out: Query[] = [];
  for (let i = 0; i < Math.min(count, all.length); i++) out.push(all[(dayNumber * count + i) % all.length]);
  return out;
}

export interface Candidate {
  name: string;
  website: string;
  domain: string;
  region: string | null;
}

export function isDeniedDomain(domain: string): boolean {
  return DENY.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function nameFromTitle(title: string, domain: string): string {
  const first = title.split(/\s+[|\-–—:·]\s+/)[0]?.trim();
  const clean = (first ?? "").replace(/\s+/g, " ");
  return clean.length >= 2 && clean.length <= 120 ? clean : domain;
}

/** Turns raw search hits into unique, plausible business candidates for a market. Never fetches anything. */
export function candidatesFromResults(results: SearchResult[], region: string | null = null, suffixes: string[] = [".au"]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const r of results) {
    const domain = normalizeDomain(r.url);
    if (!domain || seen.has(domain) || isDeniedDomain(domain)) continue;
    if (suffixes.length && !suffixes.some((s) => domain.endsWith(s))) continue;
    seen.add(domain);
    out.push({ name: nameFromTitle(r.title, domain), website: `https://${domain}`, domain, region });
  }
  return out;
}

async function loadMarkets(db: Db): Promise<Market[]> {
  const { data, error } = await db.from("acq_markets").select("id,name,industry,country,search_phrases,places,qualification_text,domain_suffixes").eq("enabled", true).order("created_at", { ascending: true });
  if (error || !data) return [DEFAULT_MARKET]; // markets table not migrated yet
  return data.length ? (data as Market[]) : [];
}

export async function runDiscovery(db: Db, deps: { search?: SearchProvider | null; now?: Date; markets?: Market[] } = {}) {
  const search = deps.search === undefined ? await resolveSearchProvider(db) : deps.search;
  if (!search) throw new SearchNotConfiguredError();
  const limits = autoLimits();
  const now = deps.now ?? new Date();
  const dayNumber = Math.floor(now.getTime() / 86_400_000);
  const day = now.toISOString().slice(0, 10);
  const markets = deps.markets ?? (await loadMarkets(db));
  if (markets.length === 0) return { queries: 0, candidates: 0, created: 0 };

  // Spread the daily search budget over the enabled markets.
  const perMarket = Math.max(1, Math.floor(limits.searchQueries / markets.length));
  const found = new Map<string, Candidate & { market: Market }>();
  for (const market of markets) {
    for (const q of queriesForDay(dayNumber, perMarket, market)) {
      const results = await search.search(q.text, 10, market.country);
      for (const c of candidatesFromResults(results, null, market.domain_suffixes)) if (!found.has(c.domain)) found.set(c.domain, { ...c, market });
    }
  }
  if (found.size === 0) return { queries: perMarket * markets.length, candidates: 0, created: 0 };

  const domains = [...found.keys()];
  const existing = new Set<string>();
  const { data: have, error: e1 } = await db.from("acq_companies").select("domain").in("domain", domains);
  if (e1) throw new Error(`discovery lookup: ${e1.message}`);
  for (const r of have ?? []) if (r.domain) existing.add(r.domain as string);
  // Never rediscover a domain that asked not to be contacted.
  const { data: sup, error: e2 } = await db.from("acq_suppressions").select("company_domain").in("company_domain", domains);
  if (e2) throw new Error(`discovery suppression lookup: ${e2.message}`);
  for (const r of sup ?? []) if (r.company_domain) existing.add(r.company_domain as string);

  let created = 0;
  for (const c of found.values()) {
    if (created >= limits.newCompanies) break;
    if (existing.has(c.domain)) continue;
    const { data, error } = await db
      .from("acq_companies")
      .insert({
        name: c.name, website: c.website, domain: c.domain, source: "ai_discovery",
        market_id: c.market.id, country: c.market.country, industry: c.market.industry,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) continue;
      throw new Error(`discovery insert: ${error.message}`);
    }
    created++;
    await enqueueJob(db, { type: "research", payload: { companyId: data.id }, idempotencyKey: `research:${data.id}:${day}` });
    await logAudit(db, "company.discovered", "company", data.id, { domain: c.domain, market: c.market.name }, "ai-discovery");
  }
  return { queries: perMarket * markets.length, candidates: found.size, created };
}
