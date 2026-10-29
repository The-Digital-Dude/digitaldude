import type { SupabaseClient } from "@supabase/supabase-js";

type Db = SupabaseClient;

const DAY_MS = 86_400_000;

/**
 * "Today" and the streak follow the rep's own day, not the server's. The browser sends its offset from UTC in minutes
 * (JavaScript's getTimezoneOffset: positive when behind UTC), and these helpers shift by it.
 */
export function cleanOffset(raw: unknown): number {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
}

/** The rep's local calendar date for an instant, as YYYY-MM-DD. */
export function localDateKey(at: Date | string, offsetMin: number): string {
  return new Date(new Date(at).getTime() - offsetMin * 60_000).toISOString().slice(0, 10);
}

/** The instant the rep's current local day began. */
export function localDayStart(now: Date, offsetMin: number): Date {
  const shifted = new Date(now.getTime() - offsetMin * 60_000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() + offsetMin * 60_000);
}

export interface OutreachStats {
  all: number;
  today: number;
  d7: number;
  d30: number;
  d90: number;
  /** Local dates (YYYY-MM-DD) with at least one send in the last 60 days, for the daily streak. */
  activeDays: string[];
}

/** Real totals from the database, so the Overview stays correct however many emails a rep sends. */
export async function loadOutreachStats(db: Db, employeeId: string, now: Date, offsetMin: number): Promise<OutreachStats> {
  const count = async (since?: Date) => {
    let q = db.from("rep_outreach_logs").select("id", { count: "exact", head: true }).eq("employee_id", employeeId);
    if (since) q = q.gte("sent_at", since.toISOString());
    const { count: c } = await q;
    return c ?? 0;
  };
  const [all, today, d7, d30, d90, recent] = await Promise.all([
    count(),
    count(localDayStart(now, offsetMin)),
    count(new Date(now.getTime() - 7 * DAY_MS)),
    count(new Date(now.getTime() - 30 * DAY_MS)),
    count(new Date(now.getTime() - 90 * DAY_MS)),
    db.from("rep_outreach_logs").select("sent_at").eq("employee_id", employeeId).gte("sent_at", new Date(now.getTime() - 62 * DAY_MS).toISOString()).order("sent_at", { ascending: false }).limit(20000),
  ]);
  const days = new Set(((recent.data ?? []) as { sent_at: string }[]).map((r) => localDateKey(r.sent_at, offsetMin)));
  return { all, today, d7, d30, d90, activeDays: [...days] };
}

/** Consecutive local days with a send, counting back from today (today may still be empty without breaking the streak). */
export function streakFromDays(activeDays: string[], now: Date, offsetMin: number, horizon = 60): number {
  const set = new Set(activeDays);
  let streak = 0;
  for (let i = 0; i < horizon; i++) {
    const key = localDateKey(new Date(now.getTime() - i * DAY_MS), offsetMin);
    if (set.has(key)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
