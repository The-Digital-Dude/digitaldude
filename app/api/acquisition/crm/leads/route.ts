import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { must } from "@/lib/acquisition/db";
import { loadCrmSettings } from "@/lib/crm/settings";
import { staleness } from "@/lib/crm/health";
import { OPEN_STAGES, STAGES, STATUSES } from "@/lib/crm/model";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const COLUMNS = "id,employee_id,full_name,email,company_name,job_title,stage,status,country,tags,estimated_deal_value,currency,fit_score,engagement_score,last_activity_at,last_contacted_at,created_at,anonymized_at, employees(full_name)";

/** All reps' leads, searchable and filterable (admin only). */
export const GET = adminRoute("list crm leads", async (request, { db }) => {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const stage = sp.get("stage") ?? "";
  const status = sp.get("status") ?? "";
  const rep = sp.get("rep") ?? "";
  const staleOnly = sp.get("stale") === "1";
  // Anything that could change the meaning of the search expression is dropped.
  const q = (sp.get("q") ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

  let query = db.from("rep_leads").select(COLUMNS, { count: "exact" }).is("anonymized_at", null);
  if ((STAGES as readonly string[]).includes(stage)) query = query.eq("stage", stage);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (/^[0-9a-f-]{36}$/i.test(rep)) query = query.eq("employee_id", rep);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%`);
  const settings = await loadCrmSettings(db);
  const now = new Date();

  type Row = { stage: string; last_activity_at: string | null; last_contacted_at: string | null; created_at: string; anonymized_at: string | null; employees: { full_name: string } | null; employee_id: string };
  let rows: Row[];
  let total: number;
  if (staleOnly) {
    // Quietness depends on the stage, so it is worked out here: take the open leads and keep the quiet ones.
    const r = must(await query.in("stage", OPEN_STAGES).order("last_activity_at", { ascending: true, nullsFirst: true }).limit(3000), "list stale leads") as unknown as Row[];
    const quiet = r.filter((l) => staleness(l, now, settings).stale);
    total = quiet.length;
    rows = quiet.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    const res = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (res.error) throw new Error(`list leads: ${res.error.message}`);
    rows = (res.data ?? []) as unknown as Row[];
    total = res.count ?? rows.length;
  }

  const leads = rows.map((l) => {
    const s = staleness(l, now, settings);
    return { ...l, owner: l.employees?.full_name ?? "Unknown", stale: s.stale, days_quiet: s.days };
  });
  return NextResponse.json({ ok: true, leads, total, page, pageSize: PAGE_SIZE });
});
