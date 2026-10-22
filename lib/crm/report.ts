import type { SupabaseClient } from "@supabase/supabase-js";
import { LOST_REASONS, OPEN_STAGES, STAGES, type LostReason, type Stage } from "./model";
import { loadCrmSettings } from "./settings";
import { learnedWinRates, staleness, weightedPipeline, type CurrencyForecast } from "./health";

type Db = SupabaseClient;

export interface RepRow { id: string; name: string; open: number; stale: number; overdueTasks: number; won: number; lost: number }

export interface CrmReport {
  totals: { leads: number; open: number; stale: number; overdueTasks: number; won: number; lost: number };
  byStage: Record<Stage, number>;
  forecast: CurrencyForecast[];
  lostReasons: { reason: LostReason; count: number }[];
  perRep: RepRow[];
  learned: ReturnType<typeof learnedWinRates>;
  probabilities: Record<Stage, number>;
}

/** The numbers behind the admin CRM report. */
export async function loadCrmReport(db: Db, now = new Date()): Promise<CrmReport> {
  const settings = await loadCrmSettings(db);
  const { data: leadRows } = await db
    .from("rep_leads")
    .select("id,employee_id,stage,estimated_deal_value,currency,probability,lost_reason,last_activity_at,last_contacted_at,created_at,anonymized_at")
    .is("anonymized_at", null)
    .limit(20_000);
  const leads = (leadRows ?? []) as { id: string; employee_id: string; stage: Stage; estimated_deal_value: number | null; currency: string | null; probability: number | null; lost_reason: LostReason | null; last_activity_at: string | null; last_contacted_at: string | null; created_at: string; anonymized_at: string | null }[];

  const { data: taskRows } = await db.from("rep_lead_tasks").select("employee_id").eq("status", "open").lt("due_at", now.toISOString()).limit(20_000);
  const overdueBy = new Map<string, number>();
  for (const t of (taskRows ?? []) as { employee_id: string }[]) overdueBy.set(t.employee_id, (overdueBy.get(t.employee_id) ?? 0) + 1);

  const { data: changeRows } = await db.from("rep_lead_activities").select("lead_id,details").eq("type", "stage_change").limit(50_000);
  const changes = ((changeRows ?? []) as { lead_id: string; details: { from?: string | null; to?: string } | null }[])
    .filter((c) => c.details?.to)
    .map((c) => ({ lead_id: c.lead_id, from: c.details?.from ?? null, to: String(c.details?.to) }));

  const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  const reasons = new Map<LostReason, number>();
  const reps = new Map<string, RepRow>();
  let stale = 0;
  for (const l of leads) {
    byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
    const row = reps.get(l.employee_id) ?? { id: l.employee_id, name: "", open: 0, stale: 0, overdueTasks: overdueBy.get(l.employee_id) ?? 0, won: 0, lost: 0 };
    if ((OPEN_STAGES as string[]).includes(l.stage)) {
      row.open++;
      if (staleness(l, now, settings).stale) { row.stale++; stale++; }
    }
    if (l.stage === "won") row.won++;
    if (l.stage === "lost") {
      row.lost++;
      if (l.lost_reason) reasons.set(l.lost_reason, (reasons.get(l.lost_reason) ?? 0) + 1);
    }
    reps.set(l.employee_id, row);
  }
  const ids = [...reps.keys()];
  if (ids.length) {
    const { data: emps } = await db.from("employees").select("id,full_name").in("id", ids);
    for (const e of (emps ?? []) as { id: string; full_name: string }[]) { const r = reps.get(e.id); if (r) r.name = e.full_name; }
  }
  const open = OPEN_STAGES.reduce((s, st) => s + byStage[st], 0);
  return {
    totals: { leads: leads.length, open, stale, overdueTasks: [...overdueBy.values()].reduce((a, b) => a + b, 0), won: byStage.won, lost: byStage.lost },
    byStage,
    forecast: weightedPipeline(leads, settings.probabilities),
    lostReasons: LOST_REASONS.map((reason) => ({ reason, count: reasons.get(reason) ?? 0 })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count),
    perRep: [...reps.values()].map((r) => ({ ...r, name: r.name || "Unknown" })).sort((a, b) => b.open - a.open),
    learned: learnedWinRates(changes, Object.fromEntries(leads.map((l) => [l.id, l.stage]))),
    probabilities: settings.probabilities,
  };
}
