import type { Db } from "../db";
import { autoLimits } from "../env";
import { resolveAiProvider } from "../ai-config";
import { resolveSearchProvider } from "../secrets";
import { runDiscovery } from "../discovery/discover";
import { enqueueJob } from "./enqueue";
import { sydneyDayKey } from "./send";
import type { Job } from "./worker";

export async function discoverJob(_job: Job, db: Db): Promise<void> {
  await runDiscovery(db);
}

/**
 * Once per Sydney day (idempotency keys), when the owner has switched auto-research on and both
 * the AI and search providers are configured: enqueue discovery, and research for companies that
 * are new or whose research is older than 30 days (capped by ACQ_DAILY_RESEARCH_LIMIT).
 */
export async function enqueueDailyAuto(db: Db, now = new Date()): Promise<{ discover: boolean; research: number }> {
  const flag = await db.from("acq_settings").select("value").eq("key", "auto_research_enabled").maybeSingle();
  if (flag.error) throw new Error(`read auto-research flag: ${flag.error.message}`);
  if (flag.data?.value !== true) return { discover: false, research: 0 };
  if (!(await resolveAiProvider(db))) return { discover: false, research: 0 };

  const sydneyDay = sydneyDayKey(now);
  const limits = autoLimits();
  let discover = false;
  if ((await resolveSearchProvider(db)) && limits.searchQueries > 0 && limits.newCompanies > 0) {
    discover = (await enqueueJob(db, { type: "discover", payload: {}, idempotencyKey: `discover:${sydneyDay}`, maxAttempts: 2 })).created;
  }

  const stale = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const { data, error } = await db
    .from("acq_companies")
    .select("id")
    .not("website", "is", null)
    .or(`status.eq.new,and(status.eq.researched,last_researched_at.lt.${stale})`)
    .order("created_at", { ascending: true })
    .limit(limits.research);
  if (error) throw new Error(`select companies to research: ${error.message}`);
  let research = 0;
  for (const c of (data ?? []) as { id: string }[]) {
    const r = await enqueueJob(db, { type: "research", payload: { companyId: c.id }, idempotencyKey: `research:${c.id}:${now.toISOString().slice(0, 10)}` });
    if (r.created) research++;
  }
  return { discover, research };
}
