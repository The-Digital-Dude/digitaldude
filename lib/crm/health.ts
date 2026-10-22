import { OPEN_STAGES, STAGES, type Stage } from "./model";
import type { CrmSettings } from "./settings";

/** Pure lead-health logic: staleness, missing next steps, the weighted pipeline, and win rates learned from your own history. */

export interface HealthLead {
  stage: string;
  last_activity_at?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  anonymized_at?: string | null;
}

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : 0);

/** The most recent sign of life: an activity, a contact, or (for a brand-new lead) its creation. */
export function lastTouch(l: HealthLead): Date {
  return new Date(Math.max(ms(l.last_activity_at), ms(l.last_contacted_at), ms(l.created_at)));
}

export function staleness(l: HealthLead, now: Date, settings: Pick<CrmSettings, "staleDays">): { stale: boolean; days: number; threshold: number | null } {
  const days = Math.floor((now.getTime() - lastTouch(l).getTime()) / 86_400_000);
  const threshold = l.anonymized_at || !(OPEN_STAGES as string[]).includes(l.stage) ? null : (settings.staleDays as Record<string, number>)[l.stage] ?? null;
  return { stale: threshold !== null && days >= threshold, days, threshold };
}

/** An open lead past "new" with no task scheduled: nobody has decided what happens next. */
export const needsNextStep = (l: Pick<HealthLead, "stage" | "anonymized_at">, openTasks: number) =>
  !l.anonymized_at && ["contacted", "meeting_booked", "negotiation"].includes(l.stage) && openTasks === 0;

// ------------------------------------------------------------------------------------------------------------- forecast
export interface ForecastLead {
  stage: string;
  estimated_deal_value: number | null;
  currency: string | null;
  probability?: number | null;
}

export interface CurrencyForecast { currency: string; open: number; weighted: number; won: number; openCount: number }

/** Weighted pipeline per currency (values in different currencies are never added together). */
export function weightedPipeline(leads: ForecastLead[], probabilities: Record<Stage, number>): CurrencyForecast[] {
  const out = new Map<string, CurrencyForecast>();
  for (const l of leads) {
    const cur = l.currency || "BDT";
    const v = Number(l.estimated_deal_value) || 0;
    const row = out.get(cur) ?? { currency: cur, open: 0, weighted: 0, won: 0, openCount: 0 };
    if (l.stage === "won") row.won += v;
    else if ((OPEN_STAGES as string[]).includes(l.stage)) {
      const p = l.probability ?? probabilities[l.stage as Stage] ?? 0;
      row.open += v;
      row.weighted += (v * p) / 100;
      row.openCount++;
    }
    out.set(cur, row);
  }
  return [...out.values()].map((r) => ({ ...r, weighted: Math.round(r.weighted) })).sort((a, b) => b.weighted - a.weighted);
}

// ------------------------------------------------------------------------------------------------------------- learning
export interface StageChange { lead_id: string; from: string | null; to: string }

const FORWARD: Stage[] = ["new", "contacted", "meeting_booked", "negotiation", "won"];

/**
 * From real stage-change history: for each stage, how many leads got that far, how many of those were won, and the win rate. A suggested
 * probability is only offered once there are at least `minSample` leads, because small samples mislead.
 */
export function learnedWinRates(changes: StageChange[], currentStage: Record<string, string>, minSample = 10): { stage: Stage; reached: number; won: number; rate: number | null; suggested: number | null }[] {
  const furthest = new Map<string, number>();
  const bump = (lead: string, stage: string) => {
    const i = FORWARD.indexOf(stage as Stage);
    if (i >= 0) furthest.set(lead, Math.max(furthest.get(lead) ?? -1, i));
  };
  for (const [lead, stage] of Object.entries(currentStage)) bump(lead, stage);
  for (const c of changes) {
    if (c.from) bump(c.lead_id, c.from);
    bump(c.lead_id, c.to);
  }
  const won = new Set(Object.entries(currentStage).filter(([, s]) => s === "won").map(([id]) => id));
  return FORWARD.slice(0, 4).map((stage, idx) => {
    const reachedIds = [...furthest.entries()].filter(([, f]) => f >= idx).map(([id]) => id);
    const w = reachedIds.filter((id) => won.has(id)).length;
    const rate = reachedIds.length > 0 ? w / reachedIds.length : null;
    return { stage, reached: reachedIds.length, won: w, rate, suggested: rate !== null && reachedIds.length >= minSample ? Math.round(rate * 100) : null };
  });
}

export const isStage = (s: string): s is Stage => (STAGES as readonly string[]).includes(s);
