import { getDb, type Db } from "../db";
import { runResearch } from "../research/pipeline";
import { classifyReply } from "../replies/classify";
import { applyClassification } from "../replies/process";
import { resolveAiProvider } from "../ai-config";
import { notify } from "../providers/notifications";
import { enqueueDueSends, sendEmailJob } from "./send";
import { scheduleFollowUps } from "./followups";
import { alertAdmin, emailPendingNotifications, notifyAssignments } from "../alerts";
import { recordHeartbeat, runHealthChecks } from "../health";
import { GmailReader, pollReplies } from "../replies/gmail";
import { discoverJob, enqueueDailyAuto } from "./daily";
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
 * Registered job types. Follow-ups are not a job type: they are scheduled each tick by scheduleFollowUps().
 * An unknown type fails loudly instead of being silently dropped.
 */
export const handlers: Record<string, JobHandler> = {
  send_email: sendEmailJob,
  discover: discoverJob,
  async research(job, db) {
    await runResearch(String(job.payload.companyId), undefined, db);
  },
  async classify_reply(job, db) {
    const replyId = String(job.payload.replyId);
    const { data: reply } = await db.from("acq_replies").select("body,classification,classified_by").eq("id", replyId).single();
    if (!reply || reply.classified_by === "human") return; // a person already decided
    const cls = await classifyReply(reply.body ?? "", await resolveAiProvider(db));
    await applyClassification(db, replyId, cls);
  },
};

export const backoffSeconds = (attempts: number) => Math.min(3600, 60 * 2 ** Math.max(0, attempts - 1));

export async function runWorkerTick(opts: { limit?: number; db?: Db; handlers?: Record<string, JobHandler> } = {}) {
  const db = opts.db ?? getDb();
  const table = opts.handlers ?? handlers;
  // Real ticks (not handler-injected test ticks) also schedule due sends.
  if (!opts.handlers) {
    try {
      await scheduleFollowUps(db);
    } catch (e) {
      log("error", { message: "acquisition scheduleFollowUps failed", error: e });
    }
    try {
      await enqueueDueSends(db);
    } catch (e) {
      log("error", { message: "acquisition enqueueDueSends failed", error: e });
    }
    try {
      await enqueueDailyAuto(db);
    } catch (e) {
      log("error", { message: "acquisition enqueueDailyAuto failed", error: e });
    }
  }
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
        await alertAdmin(db, { kind: "job_failed", title: `Background job failed: ${job.type}`, body: message.slice(0, 500), link: "/admin/acquisition/settings", dedupeKey: `job_failed:${job.id}` });
        summary.failed++;
      } else {
        const runAt = new Date(Date.now() + backoffSeconds(job.attempts) * 1000).toISOString();
        await db.from("acq_jobs").update({ status: "pending", run_at: runAt, last_error: message.slice(0, 1000) }).eq("id", job.id).eq("status", "running");
        summary.retried++;
      }
    }
  }
  if (!opts.handlers) await housekeeping(db);
  return summary;
}

/** After the jobs: read replies, announce assignments, check health, email whatever is pending. Each step is isolated. */
async function housekeeping(db: Db) {
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      log("error", { message: `acquisition housekeeping: ${name} failed`, error: e });
    }
  };
  await step("heartbeat", () => recordHeartbeat(db));
  if (GmailReader.configured()) await step("poll replies", () => pollReplies(db, new GmailReader()));
  await step("assignment digest", () => notifyAssignments(db));
  await step("crm", async () => (await import("@/lib/crm/jobs")).runCrmHousekeeping(db));
  await step("health checks", () => runHealthChecks(db));
  await step("email notifications", () => emailPendingNotifications(db));
}
