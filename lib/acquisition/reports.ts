import type { Db } from "./db";
import { sydneyDayStart } from "./queue/send";

export const POOL_ORDER = ["unassigned", "assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"] as const;

export interface CompanyRow {
  id: string;
  market_id: string | null;
  pool_status: string;
  owner_employee_id: string | null;
  source: string;
  status: string;
  fit_band: string | null;
  contact_count: number;
  created_at: string;
}

const inc = (m: Record<string, number>, k: string, by = 1) => {
  m[k] = (m[k] ?? 0) + by;
};

/** Companies per pool status for each market (archived companies excluded). */
export function funnelByMarket(companies: CompanyRow[], markets: { id: string; name: string }[]) {
  const names = new Map(markets.map((m) => [m.id, m.name]));
  const out = new Map<string, { market: string; total: number; byStatus: Record<string, number> }>();
  for (const c of companies) {
    if (c.status === "archived") continue;
    const key = c.market_id ?? "none";
    const row = out.get(key) ?? { market: c.market_id ? names.get(c.market_id) ?? "Unknown market" : "No market", total: 0, byStatus: {} };
    row.total++;
    inc(row.byStatus, c.pool_status);
    out.set(key, row);
  }
  return [...out.values()].sort((a, b) => b.total - a.total);
}

export interface RepStatsInput {
  companies: CompanyRow[];
  reps: { id: string; full_name: string; status: string }[];
  eligibleByCompany: Record<string, number>;
  emails30d: Record<string, number>;
  bookings: { employeeId: string; viaPool: boolean }[];
}

/** One row per rep: what they own, how far they've taken it, and what it produced. */
export function repLeaderboard(input: RepStatsInput) {
  const rows = new Map<string, { id: string; name: string; status: string; owned: number; open: number; needsContact: number; contacted: number; meetings: number; won: number; eligibleContacts: number; emails30d: number; bookings: number; poolBookings: number }>();
  for (const r of input.reps) rows.set(r.id, { id: r.id, name: r.full_name, status: r.status, owned: 0, open: 0, needsContact: 0, contacted: 0, meetings: 0, won: 0, eligibleContacts: 0, emails30d: input.emails30d[r.id] ?? 0, bookings: 0, poolBookings: 0 });
  for (const c of input.companies) {
    if (c.status === "archived" || !c.owner_employee_id) continue;
    const row = rows.get(c.owner_employee_id);
    if (!row) continue;
    row.owned++;
    if (["assigned", "needs_contact", "contacted"].includes(c.pool_status)) row.open++;
    if (c.contact_count === 0 && !["won", "lost", "dead"].includes(c.pool_status)) row.needsContact++;
    if (["contacted", "replied", "meeting", "won"].includes(c.pool_status)) row.contacted++;
    if (c.pool_status === "meeting") row.meetings++;
    if (c.pool_status === "won") row.won++;
    row.eligibleContacts += input.eligibleByCompany[c.id] ?? 0;
  }
  for (const b of input.bookings) {
    const row = rows.get(b.employeeId);
    if (!row) continue;
    row.bookings++;
    if (b.viaPool) row.poolBookings++;
  }
  return [...rows.values()].filter((r) => r.status !== "offboarded" || r.owned > 0 || r.bookings > 0).sort((a, b) => b.bookings - a.bookings || b.owned - a.owned);
}

/** For AI-discovered companies added in the window: how many were researched, scored well, and got a contact. */
export function discoveryYield(companies: CompanyRow[], markets: { id: string; name: string }[], sinceIso: string) {
  const names = new Map(markets.map((m) => [m.id, m.name]));
  const out = new Map<string, { market: string; discovered: number; researched: number; goodFit: number; withContact: number; deprioritized: number }>();
  for (const c of companies) {
    if (c.source !== "ai_discovery" || c.created_at < sinceIso) continue;
    const key = c.market_id ?? "none";
    const row = out.get(key) ?? { market: c.market_id ? names.get(c.market_id) ?? "Unknown market" : "No market", discovered: 0, researched: 0, goodFit: 0, withContact: 0, deprioritized: 0 };
    row.discovered++;
    if (["researched", "qualified", "deprioritized"].includes(c.status)) row.researched++;
    if (c.fit_band === "prioritize_review" || c.fit_band === "gather_evidence") row.goodFit++;
    if (c.contact_count > 0) row.withContact++;
    if (c.status === "deprioritized") row.deprioritized++;
    out.set(key, row);
  }
  return [...out.values()].sort((a, b) => b.discovered - a.discovered);
}

export interface LinkRow {
  employee_id: string | null;
  industry: string | null;
  stage: string;
  template_used: string | null;
  design: string | null;
  views: number;
  cta_clicks: number;
  booking_id: string | null;
}

export interface LinkGroup {
  key: string;
  sent: number;
  views: number;
  opened: number;
  clicks: number;
  bookings: number;
}

/** Performance of the private booking links, grouped by one field. "opened" = links viewed at least once; rates are per sent link. */
export function summariseLinks(rows: LinkRow[], by: (r: LinkRow) => string): LinkGroup[] {
  const out = new Map<string, LinkGroup>();
  for (const r of rows) {
    const key = by(r) || "(none)";
    const g = out.get(key) ?? { key, sent: 0, views: 0, opened: 0, clicks: 0, bookings: 0 };
    g.sent++;
    g.views += r.views;
    if (r.views > 0) g.opened++;
    g.clicks += r.cta_clicks;
    if (r.booking_id) g.bookings++;
    out.set(key, g);
  }
  return [...out.values()].sort((a, b) => b.bookings - a.bookings || b.opened - a.opened || b.sent - a.sent);
}

export async function loadLinkReport(db: Db, now = new Date()) {
  const since = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const [links, reps] = await Promise.all([
    db.from("rep_book_links").select("employee_id,industry,stage,template_used,design,views,cta_clicks,booking_id").gte("created_at", since).limit(20000),
    db.from("employees").select("id,full_name"),
  ]);
  if (links.error) return null; // the table is created by migration 0040; until then the report is simply absent
  const rows = (links.data ?? []) as LinkRow[];
  const names = new Map(((reps.data ?? []) as { id: string; full_name: string }[]).map((r) => [r.id, r.full_name]));
  return {
    total: rows.length,
    byRep: summariseLinks(rows, (r) => (r.employee_id ? names.get(r.employee_id) ?? "Unknown rep" : "Admin campaigns")),
    byIndustry: summariseLinks(rows, (r) => r.industry ?? ""),
    byStage: summariseLinks(rows, (r) => (r.stage === "follow_up" ? "Follow-up" : "Cold outreach")),
    byTemplate: summariseLinks(rows, (r) => r.template_used ?? ""),
    byDesign: summariseLinks(rows, (r) => r.design ?? ""),
  };
}

export async function loadReports(db: Db, now = new Date()) {
  const since30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const since90 = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const must = <T>(r: { data: T | null; error: { message: string } | null }, what: string): T => {
    if (r.error) throw new Error(`${what}: ${r.error.message}`);
    return (r.data ?? []) as T;
  };

  const [companies, markets, reps, eligible, bookings, audit30, auditToday, jobs] = await Promise.all([
    db.from("acq_companies").select("id,market_id,pool_status,owner_employee_id,source,status,fit_band,contact_count,created_at").limit(20000),
    db.from("acq_markets").select("id,name").order("created_at"),
    db.from("employees").select("id,full_name,status"),
    db.from("acq_contacts").select("company_id").eq("status", "eligible").limit(20000),
    db.from("bookings").select("sourced_by_employee_id,referral_source,created_at").not("sourced_by_employee_id", "is", null).gte("created_at", since90).limit(5000),
    db.from("acq_audit_logs").select("id", { count: "exact", head: true }).eq("action", "contacts.lookup").gte("created_at", since30),
    db.from("acq_audit_logs").select("id", { count: "exact", head: true }).eq("action", "contacts.lookup").gte("created_at", sydneyDayStart(now).toISOString()),
    db.from("acq_jobs").select("type,status").in("type", ["research", "discover"]).gte("run_at", since30).limit(20000),
  ]);

  const companyRows = must(companies, "companies") as unknown as CompanyRow[];
  const eligibleByCompany: Record<string, number> = {};
  for (const r of must(eligible, "contacts") as { company_id: string | null }[]) if (r.company_id) inc(eligibleByCompany, r.company_id);

  // Outreach logs live in the rep tables; absent or unreadable simply means "no data" for that column.
  const emails30d: Record<string, number> = {};
  const logs = await db.from("rep_outreach_logs").select("employee_id").gte("sent_at", since30).limit(20000);
  if (!logs.error) for (const l of (logs.data ?? []) as { employee_id: string }[]) inc(emails30d, l.employee_id);

  const marketRows = must(markets, "markets") as { id: string; name: string }[];
  const jobRows = must(jobs, "jobs") as { type: string; status: string }[];
  const jobCount = (type: string, status: string) => jobRows.filter((j) => j.type === type && j.status === status).length;

  return {
    funnel: funnelByMarket(companyRows, marketRows),
    leaderboard: repLeaderboard({
      companies: companyRows,
      reps: must(reps, "reps") as { id: string; full_name: string; status: string }[],
      eligibleByCompany,
      emails30d,
      bookings: (must(bookings, "bookings") as { sourced_by_employee_id: string; referral_source: string | null }[]).map((b) => ({ employeeId: b.sourced_by_employee_id, viaPool: b.referral_source === "lead_pool" })),
    }),
    yield: discoveryYield(companyRows, marketRows, since30),
    usage: {
      contactLookups30d: audit30.count ?? 0,
      contactLookupsToday: auditToday.count ?? 0,
      researchOk30d: jobCount("research", "succeeded"),
      researchFailed30d: jobCount("research", "failed"),
      discoveryRuns30d: jobCount("discover", "succeeded"),
    },
    totals: { companies: companyRows.filter((c) => c.status !== "archived").length, unowned: companyRows.filter((c) => c.status !== "archived" && !c.owner_employee_id).length },
  };
}
