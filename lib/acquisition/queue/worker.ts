import { getDb, type Db } from "../db";
import { runResearch } from "../research/pipeline";
import { classifyReply } from "../replies/classify";
import { applyClassification } from "../replies/process";
import { getAiProvider } from "../providers/ai";
import { notify } from "../providers/notifications";
import { log } from "@/lib/logger";

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

export type JobHandler = (job: Job, db: Db) => Promise<void>;

/**
 * Registered job types. `send_email` and `schedule_follow_up` are deliberately
 * absent until the sender is built (Phase 4); an unknown type fails loudly
 * instead of being silently dropped.
 */
export const handlers: Record<string, JobHandler> = {
  async research(job, db) {
    await runResearch(String(job.payload.companyId), undefined, db);
  },
  async classify_reply(job, db) {
    const replyId = String(job.payload.replyId);
    const { data: reply } = await db.from("acq_replies").select("body,classification,classified_by").eq("id", replyId).single();
    if (!reply || reply.classified_by === "human") return; // a person already decided
    const cls = await classifyReply(reply.body ?? "", getAiProvider());
    await applyClassification(db, replyId, cls);
  },
};

export const backoffSeconds = (attempts: number) => Math.min(3600, 60 * 2 ** Math.max(0, attempts - 1));

export async function runWorkerTick(opts: { limit?: number; db?: Db; handlers?: Record<string, JobHandler> } = {}) {
  const db = opts.db ?? getDb();
  const table = opts.handlers ?? handlers;
  const { data, error } = await db.rpc("acq_claim_jobs", { p_limit: opts.limit ?? 5 });
  if (error) throw new Error(`claim jobs: ${error.message}`);

  const summary = { claimed: 0, succeeded: 0, retried: 0, failed: 0 };
  for (const job of (data ?? []) as Job[]) {
    summary.claimed++;
    try {
      const handler = table[job.type];
      if (!handler) throw new Error(`No handler for job type "${job.type}"`);
      await handler(job, db);
      // Don't resurrect a job that was cancelled while it ran (e.g. recipient suppressed).
      await db.from("acq_jobs").update({ status: "succeeded", last_error: null }).eq("id", job.id).eq("status", "running");
      summary.succeeded++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log("error", { message: "acquisition job failed", context: { jobId: job.id, type: job.type, attempts: job.attempts }, error: e });
      if (job.attempts >= job.max_attempts) {
        await db.from("acq_jobs").update({ status: "failed", last_error: message.slice(0, 1000) }).eq("id", job.id).eq("status", "running");
        await notify(`Acquisition job failed permanently: ${job.type} — ${message.slice(0, 200)}`);
        summary.failed++;
      } else {
        const runAt = new Date(Date.now() + backoffSeconds(job.attempts) * 1000).toISOString();
        await db.from("acq_jobs").update({ status: "pending", run_at: runAt, last_error: message.slice(0, 1000) }).eq("id", job.id).eq("status", "running");
        summary.retried++;
      }
    }
  }
  return summary;
}
