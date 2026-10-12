import type { Db } from "./db";
import { alertAdmin } from "./alerts";
import { sydneyDayKey } from "./queue/send";

export const HEARTBEAT_KEY = "worker_heartbeat";
const STALE_AFTER_MIN = 30;

/** Written by every acquisition worker tick; the OTHER cron job watches it so a dead worker can't hide itself. */
export async function recordHeartbeat(db: Db, now = new Date()): Promise<void> {
  await db.from("acq_settings").upsert({ key: HEARTBEAT_KEY, value: { at: now.toISOString() } });
}

export async function heartbeatAgeMinutes(db: Db, now = new Date()): Promise<number | null> {
  const { data } = await db.from("acq_settings").select("value").eq("key", HEARTBEAT_KEY).maybeSingle();
  const at = (data?.value as { at?: string } | null)?.at;
  if (!at) return null;
  return Math.max(0, Math.round((now.getTime() - Date.parse(at)) / 60_000));
}

/**
 * Raises (at most one per day per problem) an admin alert when the acquisition worker has stopped running,
 * or when background jobs keep failing (broken AI key, search quota, bad config).
 */
export async function runHealthChecks(db: Db, now = new Date()): Promise<string[]> {
  const day = sydneyDayKey(now);
  const raised: string[] = [];

  const age = await heartbeatAgeMinutes(db, now);
  if (age !== null && age > STALE_AFTER_MIN) {
    raised.push("worker_stale");
    await alertAdmin(db, {
      kind: "health",
      title: "The acquisition worker has stopped running",
      body: `No worker tick for ${age} minutes (it should run every 10). Check the Supabase cron job "acquisition-worker" (select * from net._http_response order by created desc limit 5) and that CRON_SECRET still matches in Vercel.`,
      link: "/admin/acquisition/settings",
      dedupeKey: `health:worker_stale:${day}`,
    });
  }

  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const failed = await db.from("acq_jobs").select("type,last_error").eq("status", "failed").gte("run_at", since).limit(50);
  const rows = (failed.data ?? []) as { type: string; last_error: string | null }[];
  if (rows.length >= 3) {
    raised.push("jobs_failing");
    const sample = [...new Set(rows.map((r) => `${r.type}: ${(r.last_error ?? "").slice(0, 120)}`))].slice(0, 4).join("\n");
    await alertAdmin(db, {
      kind: "health",
      title: `${rows.length} background jobs failed in the last 24 hours`,
      body: `${sample}\n\nCommon causes: an expired or wrong AI/search API key, a quota limit, or an unreachable website.`,
      link: "/admin/acquisition/settings",
      dedupeKey: `health:jobs_failing:${day}`,
    });
  }
  return raised;
}
