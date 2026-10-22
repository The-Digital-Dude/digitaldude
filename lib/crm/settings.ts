import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OPEN_STAGES, STAGES, type Stage } from "./model";

type Db = SupabaseClient;

export const CRM_SETTINGS_KEY = "crm_settings";

/** Days of silence before a lead in each open stage counts as stale (from the research on speed-to-lead and 2-to-3-day cadence spacing). */
export const DEFAULT_STALE_DAYS: Record<string, number> = { new: 2, contacted: 5, meeting_booked: 3, negotiation: 7 };

/** Starting win probabilities by stage. Vendor defaults are guesses: these are replaced by your own results over time (see the report). */
export const DEFAULT_PROBABILITIES: Record<Stage, number> = { new: 5, contacted: 10, meeting_booked: 30, negotiation: 60, won: 100, lost: 0 };

export const crmSettingsSchema = z.object({
  staleDays: z.object({ new: z.number().int().min(1).max(60), contacted: z.number().int().min(1).max(60), meeting_booked: z.number().int().min(1).max(60), negotiation: z.number().int().min(1).max(90) }),
  probabilities: z.object(Object.fromEntries(STAGES.map((s) => [s, z.number().int().min(0).max(100)])) as Record<Stage, z.ZodNumber>),
  retentionMonths: z.number().int().min(6).max(120),
  followUpBusinessDays: z.number().int().min(1).max(14),
});
export type CrmSettings = z.infer<typeof crmSettingsSchema>;

export const DEFAULT_CRM_SETTINGS: CrmSettings = {
  staleDays: { new: 2, contacted: 5, meeting_booked: 3, negotiation: 7 },
  probabilities: { ...DEFAULT_PROBABILITIES },
  retentionMonths: 24,
  followUpBusinessDays: 3,
};

/** Saved settings repaired field by field: one bad value never breaks the CRM. */
export function sanitizeCrmSettings(raw: unknown): CrmSettings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <T,>(schema: z.ZodType<T>, value: unknown, fallback: T): T => {
    const r = schema.safeParse(value);
    return r.success ? r.data : fallback;
  };
  const stale = (o.staleDays && typeof o.staleDays === "object" ? o.staleDays : {}) as Record<string, unknown>;
  const probs = (o.probabilities && typeof o.probabilities === "object" ? o.probabilities : {}) as Record<string, unknown>;
  const day = (k: keyof CrmSettings["staleDays"]) => pick(crmSettingsSchema.shape.staleDays.shape[k], stale[k], DEFAULT_CRM_SETTINGS.staleDays[k]);
  return {
    staleDays: { new: day("new"), contacted: day("contacted"), meeting_booked: day("meeting_booked"), negotiation: day("negotiation") },
    probabilities: Object.fromEntries(STAGES.map((s) => [s, pick(z.number().int().min(0).max(100), probs[s], DEFAULT_PROBABILITIES[s])])) as Record<Stage, number>,
    retentionMonths: pick(crmSettingsSchema.shape.retentionMonths, o.retentionMonths, DEFAULT_CRM_SETTINGS.retentionMonths),
    followUpBusinessDays: pick(crmSettingsSchema.shape.followUpBusinessDays, o.followUpBusinessDays, DEFAULT_CRM_SETTINGS.followUpBusinessDays),
  };
}

export async function loadCrmSettings(db: Db): Promise<CrmSettings> {
  try {
    const { data } = await db.from("acq_settings").select("value").eq("key", CRM_SETTINGS_KEY).maybeSingle();
    return data?.value ? sanitizeCrmSettings(data.value) : DEFAULT_CRM_SETTINGS;
  } catch {
    return DEFAULT_CRM_SETTINGS;
  }
}

export const isOpenStage = (s: string): s is Stage => (OPEN_STAGES as string[]).includes(s);
