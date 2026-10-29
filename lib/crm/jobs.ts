import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/acquisition/alerts";
import { log } from "@/lib/logger";
import { OPEN_STAGES } from "./model";
import { loadCrmSettings, type CrmSettings } from "./settings";
import { staleness, type HealthLead } from "./health";
import { computeScores, type ScoredLead } from "./refresh";
import { rolloverFollowUps } from "./rollover";

type Db = SupabaseClient;

export interface StaleLead extends HealthLead {
  id: string;
  employee_id: string;
  full_name: string;
}

export interface StaleDigest {
  employeeId: string;
  leads: { id: string; name: string; stage: string; days: number }[];
  /** Leads quiet for at least twice their threshold: these also go to the admin. */
  severe: number;
}

/** Groups quiet leads by rep. Pure: no database. */
export function buildStaleDigests(leads: StaleLead[], now: Date, settings: Pick<CrmSettings, "staleDays">): StaleDigest[] {
  const by = new Map<string, StaleDigest>();
  for (const l of leads) {
    const s = staleness(l, now, settings);
    if (!s.stale) continue;
    const d = by.get(l.employee_id) ?? { employeeId: l.employee_id, leads: [], severe: 0 };
    d.leads.push({ id: l.id, name: l.full_name, stage: l.stage, days: s.days });
    if (s.threshold !== null && s.days >= s.threshold * 2) d.severe++;
    by.set(l.employee_id, d);
  }
  for (const d of by.values()) d.leads.sort((a, b) => b.days - a.days);
  return [...by.values()];
}

/** Runs a daily step once per UTC day (the marker lives in acq_settings so two worker ticks cannot both do it). */
async function claimDaily(db: Db, key: string, now: Date): Promise<boolean> {
  const today = now.toISOString().slice(0, 10);
  const { data } = await db.from("acq_settings").select("value").eq("key", key).maybeSingle();
  if ((data?.value as { date?: string } | null)?.date === today) return false;
  const { error } = await db.from("acq_settings").upsert({ key, value: { date: today } });
  return !error;
}

const DUE_WINDOW_MS = 2 * 86_400_000;

/** A notification for every task that has just come due (once each: the key is the task). */
export async function notifyDueTasks(db: Db, now = new Date()): Promise<number> {
  const { data } = await db
    .from("rep_lead_tasks")
    .select("id,employee_id,title,due_at, rep_leads(full_name)")
    .eq("status", "open")
    .neq("kind", "respond") // the team answers replies; the rep is not chased for them
    .lte("due_at", now.toISOString())
    .gte("due_at", new Date(now.getTime() - DUE_WINDOW_MS).toISOString())
    .order("due_at", { ascending: true })
    .limit(200);
  let made = 0;
  for (const t of (data ?? []) as unknown as { id: string; employee_id: string; title: string; rep_leads: { full_name: string } | null }[]) {
    const created = await createNotification(db, { employeeId: t.employee_id, kind: "task_due", title: `Task due: ${t.title}`, body: t.rep_leads?.full_name ? `Lead: ${t.rep_leads.full_name}` : undefined, link: "/rep/dashboard", dedupeKey: `task-due:${t.id}` });
    if (created) made++;
  }
  return made;
}

/** Once a day: tells each rep which of their leads have gone quiet, and tells the admin about the ones quiet for twice as long. */
export async function notifyStaleLeads(db: Db, now = new Date()): Promise<number> {
  const settings = await loadCrmSettings(db);
  const { data } = await db.from("rep_leads").select("id,employee_id,full_name,stage,last_activity_at,last_contacted_at,created_at,anonymized_at").in("stage", OPEN_STAGES).is("anonymized_at", null).limit(10_000);
  const digests = buildStaleDigests((data ?? []) as StaleLead[], now, settings);
  const today = now.toISOString().slice(0, 10);
  let made = 0;
  for (const d of digests) {
    const shown = d.leads.slice(0, 8).map((l) => `${l.name} (${l.stage.replace("_", " ")}, ${l.days} days quiet)`).join("\n");
    const more = d.leads.length > 8 ? `\n…and ${d.leads.length - 8} more` : "";
    if (await createNotification(db, { employeeId: d.employeeId, kind: "stale_leads", title: `${d.leads.length} ${d.leads.length === 1 ? "lead has" : "leads have"} gone quiet`, body: `${shown}${more}\n\nOpen your leads and pick the next step.`, link: "/rep/dashboard", dedupeKey: `stale:${d.employeeId}:${today}` })) made++;
  }
  const severe = digests.filter((d) => d.severe > 0);
  if (severe.length > 0) {
    const ids = severe.map((d) => d.employeeId);
    const { data: reps } = await db.from("employees").select("id,full_name").in("id", ids);
    const names = new Map(((reps ?? []) as { id: string; full_name: string }[]).map((r) => [r.id, r.full_name]));
    const body = severe.map((d) => `${names.get(d.employeeId) ?? "A rep"}: ${d.severe} ${d.severe === 1 ? "lead" : "leads"} quiet for twice the usual time`).join("\n");
    if (await createNotification(db, { employeeId: null, kind: "stale_leads", title: "Leads are going cold", body, link: "/admin/acquisition/crm", dedupeKey: `stale-admin:${today}` })) made++;
  }
  return made;
}

/** Recomputes the oldest saved scores (engagement decays with silence even when nothing new happens). */
export async function refreshOldScores(db: Db, now = new Date(), limit = 100): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const { data } = await db
    .from("rep_leads")
    .select("id,employee_id,email,phone,company_name,job_title,country,acq_contact_id,last_activity_at,last_contacted_at,created_at,anonymized_at,fit_score,engagement_score,score_updated_at")
    .is("anonymized_at", null)
    .or(`score_updated_at.is.null,score_updated_at.lt.${cutoff}`)
    .order("score_updated_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  const rows = (data ?? []) as ScoredLead[];
  if (rows.length) await computeScores(db, rows, now);
  return rows.length;
}

/** Anonymises leads that have had no activity for the retention period (admin setting, at least six months). Won deals are kept. */
export async function sweepRetention(db: Db, now = new Date()): Promise<number> {
  const settings = await loadCrmSettings(db);
  const { data, error } = await db.rpc("rep_retention_sweep", { p_months: settings.retentionMonths });
  if (error) throw new Error(`retention sweep: ${error.message}`);
  const n = Number(data ?? 0);
  if (n > 0) {
    await createNotification(db, { employeeId: null, kind: "retention", title: `${n} old ${n === 1 ? "lead was" : "leads were"} anonymised`, body: `Leads with no activity for ${settings.retentionMonths} months (and not won) had their personal details removed, as your retention setting says.`, link: "/admin/acquisition/crm", dedupeKey: `retention:${now.toISOString().slice(0, 10)}` });
  }
  return n;
}

/** Everything the CRM does in the background. Called from the worker tick; each step is isolated so one failure never stops the rest. */
export async function runCrmHousekeeping(db: Db, now = new Date()): Promise<void> {
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      log("error", { message: `crm housekeeping: ${name} failed`, error: e });
    }
  };
  await step("due tasks", () => notifyDueTasks(db, now));
  await step("old scores", () => refreshOldScores(db, now));
  if (await claimDaily(db, "crm_daily_rollover", now).catch(() => false)) await step("follow-up rollover", () => rolloverFollowUps(db, now));
  if (await claimDaily(db, "crm_daily_stale", now).catch(() => false)) await step("stale leads", () => notifyStaleLeads(db, now));
  if (await claimDaily(db, "crm_daily_retention", now).catch(() => false)) await step("retention", () => sweepRetention(db, now));
}
