import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

/** Rep sending limits: cold and follow-up are separate, each per rolling 24 hours, with an optional weekly warm-up ramp. */

export const SEND_LIMITS_KEY = "send_limits";
export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

export const limitSettingsSchema = z.object({
  /** The most emails the whole team should send in a day (Brevo's free plan allows about 300 including system mail). */
  teamCeiling: z.number().int().min(1).max(5000),
  startCold: z.number().int().min(0).max(500),
  startFollowUp: z.number().int().min(0).max(500),
  /** How much both limits rise each week during warm-up. */
  stepPerWeek: z.number().int().min(0).max(200),
});
export type LimitSettings = z.infer<typeof limitSettingsSchema>;

export const DEFAULT_LIMIT_SETTINGS: LimitSettings = { teamCeiling: 250, startCold: 10, startFollowUp: 10, stepPerWeek: 5 };

export interface RepLimitRow {
  coldMax: number;
  followUpMax: number;
  warmup: boolean;
  startedAt: string | null;
}

export interface EffectiveLimits {
  cold: number;
  followUp: number;
  /** Whole weeks since warm-up began. */
  week: number;
  /** Still climbing: today's limit is below the rep's maximum. */
  ramping: boolean;
}

/** Today's limits for a rep. Pure. With warm-up off the rep simply gets their maximums. */
export function effectiveLimits(row: RepLimitRow, settings: LimitSettings, now: Date): EffectiveLimits {
  const started = row.startedAt ? Date.parse(row.startedAt) : now.getTime();
  const week = Math.max(0, Math.floor((now.getTime() - started) / WEEK_MS));
  if (!row.warmup) return { cold: row.coldMax, followUp: row.followUpMax, week, ramping: false };
  const cold = Math.min(row.coldMax, settings.startCold + week * settings.stepPerWeek);
  const followUp = Math.min(row.followUpMax, settings.startFollowUp + week * settings.stepPerWeek);
  return { cold, followUp, week, ramping: cold < row.coldMax || followUp < row.followUpMax };
}

/** Repairs saved settings field by field: one bad value never breaks sending. */
export async function loadLimitSettings(db: Db): Promise<LimitSettings> {
  const { data } = await db.from("acq_settings").select("value").eq("key", SEND_LIMITS_KEY).maybeSingle();
  const saved = (data?.value ?? {}) as Partial<Record<keyof LimitSettings, unknown>>;
  const out = { ...DEFAULT_LIMIT_SETTINGS };
  for (const k of Object.keys(out) as (keyof LimitSettings)[]) {
    const field = limitSettingsSchema.shape[k].safeParse(saved[k]);
    if (field.success) out[k] = field.data;
  }
  return out;
}

interface EmployeeLimitFields {
  id?: string;
  daily_outreach_limit?: number | null;
  followup_daily_limit?: number | null;
  limit_warmup?: boolean | null;
  limit_started_at?: string | null;
}

/** A rep's limit row from an employees row. Works before migration 0043 (the new columns read as defaults, warm-up off). */
export function limitRowFrom(e: EmployeeLimitFields): RepLimitRow {
  const hasWarmup = typeof e.limit_warmup === "boolean";
  return {
    coldMax: Number(e.daily_outreach_limit) || 50,
    followUpMax: Number(e.followup_daily_limit) || 30,
    warmup: hasWarmup ? e.limit_warmup === true : false,
    startedAt: e.limit_started_at ?? null,
  };
}

export interface Sent { cold: number; followUp: number }

/**
 * Emails sent in the last 24 hours, per rep, split by stage. Before migration 0043 there is no stage column,
 * so everything counts as cold (the old behaviour) rather than failing.
 */
export async function sentLast24h(db: Db, now: Date, employeeId?: string): Promise<Map<string, Sent>> {
  const since = new Date(now.getTime() - DAY_MS).toISOString();
  const base = (cols: string) => {
    let q = db.from("rep_outreach_logs").select(cols).gte("sent_at", since).limit(20000);
    if (employeeId) q = q.eq("employee_id", employeeId);
    return q;
  };
  let rows: { employee_id: string; stage?: string }[] = [];
  const first = await base("employee_id,stage");
  if (!first.error) rows = (first.data ?? []) as unknown as typeof rows;
  else {
    const second = await base("employee_id");
    rows = (second.data ?? []) as unknown as typeof rows;
  }
  const out = new Map<string, Sent>();
  for (const r of rows) {
    const cur = out.get(r.employee_id) ?? { cold: 0, followUp: 0 };
    if (r.stage === "follow_up") cur.followUp++;
    else cur.cold++;
    out.set(r.employee_id, cur);
  }
  return out;
}

export interface Capacity {
  cold: { limit: number; max: number; used: number; remaining: number };
  followUp: { limit: number; max: number; used: number; remaining: number };
  week: number;
  ramping: boolean;
}

/** One rep's limits today and how much of each they have used. */
export async function repCapacity(db: Db, employeeId: string, now = new Date()): Promise<Capacity> {
  const [settings, empRes, usage] = await Promise.all([
    loadLimitSettings(db),
    db.from("employees").select("*").eq("id", employeeId).maybeSingle(),
    sentLast24h(db, now, employeeId),
  ]);
  const row = limitRowFrom((empRes.data ?? {}) as EmployeeLimitFields);
  const eff = effectiveLimits(row, settings, now);
  const used = usage.get(employeeId) ?? { cold: 0, followUp: 0 };
  return {
    cold: { limit: eff.cold, max: row.coldMax, used: used.cold, remaining: Math.max(0, eff.cold - used.cold) },
    followUp: { limit: eff.followUp, max: row.followUpMax, used: used.followUp, remaining: Math.max(0, eff.followUp - used.followUp) },
    week: eff.week,
    ramping: eff.ramping,
  };
}
