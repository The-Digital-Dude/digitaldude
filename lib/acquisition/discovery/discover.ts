import { UNIQUE_VIOLATION, type Db } from "../db";
import { normalizeDomain } from "../normalize";
import { autoLimits } from "../env";
import { getSearchProvider, SearchNotConfiguredError, type SearchProvider, type SearchResult } from "../providers/search";
import { enqueueJob } from "../queue/enqueue";
import { logAudit } from "../audit";

const TERMS = ["property management company", "rental property managers", "real estate property management agency", "strata and property management"];
const PLACES: { place: string; state: string }[] = [
  { place: "Sydney", state: "NSW" }, { place: "Melbourne", state: "VIC" }, { place: "Brisbane", state: "QLD" },
  { place: "Perth", state: "WA" }, { place: "Adelaide", state: "SA" }, { place: "Canberra", state: "ACT" },
  { place: "Hobart", state: "TAS" }, { place: "Darwin", state: "NT" }, { place: "Gold Coast", state: "QLD" },
  { place: "Newcastle", state: "NSW" }, { place: "Sunshine Coast", state: "QLD" }, { place: "Geelong", state: "VIC" },
  { place: "Wollongong", state: "NSW" }, { place: "Townsville", state: "QLD" }, { place: "Cairns", state: "QLD" },
];

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
  state: string;
}

/** Deterministic daily rotation so different days cover different term/place pairs. */
export function queriesForDay(dayNumber: number, count: number): Query[] {
  const all: Query[] = [];
  for (const p of PLACES) for (const t of TERMS) all.push({ text: `${t} ${p.place}`, state: p.state });
  const out: Query[] = [];
  for (let i = 0; i < Math.min(count, all.length); i++) out.push(all[(dayNumber * count + i) % all.length]);
  return out;
}

export interface Candidate {
  name: string;
  website: string;
  domain: string;
  state: string;
}

export function isDeniedDomain(domain: string): boolean {
  return DENY.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function nameFromTitle(title: string, domain: string): string {
  const first = title.split(/\s+[|\-–—:·]\s+/)[0]?.trim();
  const clean = (first ?? "").replace(/\s+/g, " ");
  return clean.length >= 2 && clean.length <= 120 ? clean : domain;
}

/** Turns raw search hits into unique, plausible .au business candidates. Never fetches anything. */
export function candidatesFromResults(results: SearchResult[], state: string): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const r of results) {
    const domain = normalizeDomain(r.url);
    if (!domain || seen.has(domain) || !domain.endsWith(".au") || isDeniedDomain(domain)) continue;
    seen.add(domain);
    out.push({ name: nameFromTitle(r.title, domain), website: `https://${domain}`, domain, state });
  }
  return out;
}

export async function runDiscovery(db: Db, deps: { search?: SearchProvider | null; now?: Date } = {}) {
  const search = deps.search === undefined ? getSearchProvider() : deps.search;
  if (!search) throw new SearchNotConfiguredError();
  const limits = autoLimits();
  const now = deps.now ?? new Date();
  const dayNumber = Math.floor(now.getTime() / 86_400_000);
  const day = now.toISOString().slice(0, 10);

  const found = new Map<string, Candidate>();
  for (const q of queriesForDay(dayNumber, limits.searchQueries)) {
    const results = await search.search(q.text, 10);
    for (const c of candidatesFromResults(results, q.state)) if (!found.has(c.domain)) found.set(c.domain, c);
  }
  if (found.size === 0) return { queries: limits.searchQueries, candidates: 0, created: 0 };

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
      .insert({ name: c.name, website: c.website, domain: c.domain, state: c.state, source: "ai_discovery" })
      .select("id")
      .single();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) continue;
      throw new Error(`discovery insert: ${error.message}`);
    }
    created++;
    await enqueueJob(db, { type: "research", payload: { companyId: data.id }, idempotencyKey: `research:${data.id}:${day}` });
    await logAudit(db, "company.discovered", "company", data.id, { domain: c.domain }, "ai-discovery");
  }
  return { queries: limits.searchQueries, candidates: found.size, created };
}
