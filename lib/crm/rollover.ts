import type { SupabaseClient } from "@supabase/supabase-js";
import { alertAdmin, createNotification } from "@/lib/acquisition/alerts";
import { addWorkingDays } from "./activity";
import { effectiveLimits, limitRowFrom, loadLimitSettings } from "./sendLimits";

type Db = SupabaseClient;

/** 07:00 UTC on the next working day (Monday to Friday). */
export function nextWorkingMorning(now: Date): Date {
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7));
  return addWorkingDays(base, 1);
}

export interface RolloverResult { reps: number; moved: number }

/**
 * Once a day: a rep can only send so many follow-ups a day. Any due follow-ups beyond today's limit are moved to the next working
 * day instead of piling up overdue; the rep is told, and the admin gets an alert (linked to that rep's limit) so the limit can be
 * raised or leads reassigned. Oldest due tasks stay put, so the most overdue are done first.
 */
export async function rolloverFollowUps(db: Db, now = new Date()): Promise<RolloverResult> {
  const settings = await loadLimitSettings(db);
  const [emps, tasks] = await Promise.all([
    db.from("employees").select("*").eq("status", "active"),
    db.from("rep_lead_tasks").select("id,employee_id,due_at").eq("status", "open").eq("kind", "follow_up").order("due_at", { ascending: true }).limit(5000),
  ]);
  const nowIso = now.toISOString();
  const due = new Map<string, string[]>();
  for (const t of (tasks.data ?? []) as { id: string; employee_id: string; due_at: string }[]) {
    if (t.due_at > nowIso) continue;
    due.set(t.employee_id, [...(due.get(t.employee_id) ?? []), t.id]);
  }

  const next = nextWorkingMorning(now).toISOString();
  const day = nowIso.slice(0, 10);
  let reps = 0;
  let moved = 0;
  for (const e of (emps.data ?? []) as { id: string; full_name: string }[]) {
    const ids = due.get(e.id) ?? [];
    const row = limitRowFrom(e as never);
    const eff = effectiveLimits(row, settings, now);
    const surplus = ids.slice(eff.followUp);
    if (surplus.length === 0) continue;
    const { error } = await db.from("rep_lead_tasks").update({ due_at: next }).in("id", surplus);
    if (error) continue;
    reps++;
    moved += surplus.length;
    const plural = surplus.length === 1 ? "" : "s";
    await createNotification(db, {
      employeeId: e.id,
      kind: "followups_rolled",
      title: `${surplus.length} follow-up${plural} moved to the next working day`,
      body: `You can send ${eff.followUp} follow-ups a day right now${eff.ramping ? ` (it rises each week up to ${row.followUpMax})` : ""}, and ${ids.length} were due. The rest are rescheduled so they do not pile up overdue. Your admin has been told.`,
      link: "/rep/dashboard",
      dedupeKey: `rollover:${e.id}:${day}`,
    });
    await alertAdmin(db, {
      kind: "rep_behind",
      title: `${e.full_name} cannot keep up with follow-ups`,
      body: `${ids.length} follow-ups are due but their limit is ${eff.followUp} a day${eff.ramping ? ` (warm-up week ${eff.week + 1}, maximum ${row.followUpMax})` : ` (maximum ${row.followUpMax})`}. ${surplus.length} moved to the next working day. Raise their limit or reassign some leads.`,
      link: `/admin/acquisition/limits?rep=${e.id}`,
      dedupeKey: `rep-behind:${e.id}:${day}`,
    });
  }
  return { reps, moved };
}
