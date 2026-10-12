import type { Db } from "./db";
import { parsePageParams } from "@/lib/adminPagination";

export const POOL_STATUSES = ["unassigned", "assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"] as const;
export type PoolStatus = (typeof POOL_STATUSES)[number];
/** Statuses an unowned company may hold (an owned company can be anything except 'unassigned'). */
export const UNOWNED_OK: PoolStatus[] = ["unassigned", "lost", "dead", "won"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (v: string | null) => (v ?? "").trim();

export interface PoolFilters {
  q: string;
  market: string;
  country: string;
  band: string;
  poolStatus: string;
  owner: string; // uuid | "none" | ""
  source: string;
  duplicate: boolean;
  contacts: "" | "yes" | "no";
  research: string; // acq_companies.status, default excludes archived
}

export function parsePoolFilters(sp: URLSearchParams): PoolFilters {
  const owner = clean(sp.get("owner"));
  const contacts = clean(sp.get("contacts"));
  return {
    q: clean(sp.get("q")).slice(0, 100),
    market: UUID.test(clean(sp.get("market"))) ? clean(sp.get("market")) : "",
    country: /^[A-Za-z]{2}$/.test(clean(sp.get("country"))) ? clean(sp.get("country")).toUpperCase() : "",
    band: ["prioritize_review", "gather_evidence", "deprioritize"].includes(clean(sp.get("band"))) ? clean(sp.get("band")) : "",
    poolStatus: (POOL_STATUSES as readonly string[]).includes(clean(sp.get("poolStatus"))) ? clean(sp.get("poolStatus")) : "",
    owner: owner === "none" || UUID.test(owner) ? owner : "",
    source: ["manual", "ai_discovery"].includes(clean(sp.get("source"))) ? clean(sp.get("source")) : "",
    duplicate: clean(sp.get("duplicate")) === "1",
    contacts: contacts === "yes" || contacts === "no" ? contacts : "",
    research: ["new", "researching", "researched", "qualified", "deprioritized", "archived"].includes(clean(sp.get("research"))) ? clean(sp.get("research")) : "",
  };
}

/** Strips characters that would break a PostgREST `or`/`ilike` expression. */
export const likeSafe = (s: string) => s.replace(/[%_,()\\*]/g, " ").trim();

// The builder is typed loosely: supabase's chained query types are not worth re-declaring here.
export function applyPoolFilters(query: any, f: PoolFilters) {
  if (f.q) {
    const t = likeSafe(f.q);
    if (t) query = query.or(`name.ilike.%${t}%,domain.ilike.%${t}%`);
  }
  if (f.market) query = query.eq("market_id", f.market);
  if (f.country) query = query.eq("country", f.country);
  if (f.band) query = query.eq("fit_band", f.band);
  if (f.poolStatus) query = query.eq("pool_status", f.poolStatus);
  if (f.owner === "none") query = query.is("owner_employee_id", null);
  else if (f.owner) query = query.eq("owner_employee_id", f.owner);
  if (f.source) query = query.eq("source", f.source);
  if (f.duplicate) query = query.not("possible_duplicate_of", "is", null);
  if (f.contacts === "yes") query = query.gt("contact_count", 0);
  if (f.contacts === "no") query = query.eq("contact_count", 0);
  query = f.research ? query.eq("status", f.research) : query.neq("status", "archived");
  return query;
}

const COLUMNS =
  "id,name,website,domain,country,region,industry,market_id,source,status,pool_status,owner_employee_id,assigned_at,assignment_source,fit_score,fit_band,contact_count,possible_duplicate_of,linkedin_url,created_at, acq_markets(name)";

export async function queryPool(db: Db, sp: URLSearchParams) {
  const f = parsePoolFilters(sp);
  const { page, pageSize, from, to } = parsePageParams(sp, { defaultPageSize: 25, maxPageSize: 100 });
  const base = () =>
    applyPoolFilters(db.from("acq_companies").select(COLUMNS, { count: "exact" }), f)
      .order("fit_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  let q = base().range(from, to);
  let { data, error, count } = await q;
  if (error && /range not satisfiable/i.test(error.message)) {
    // Page is past the end (e.g. a filter just narrowed the list): report an empty page with the real total.
    q = base().range(0, 0);
    ({ count } = await q);
    data = [];
    error = null;
  }
  if (error) throw new Error(`pool query: ${error.message}`);
  return { companies: data ?? [], totalCount: count ?? 0, page, pageSize, filters: f };
}

/** Spreadsheet formula injection guard: cells starting with = + - @ are prefixed so they stay text. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export const CSV_HEADERS = ["Company", "Website", "Country", "Region", "Industry", "Market", "Fit score", "Pool status", "Owner", "Contacts", "Source", "LinkedIn", "Added"];
