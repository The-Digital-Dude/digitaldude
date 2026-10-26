import { describe, it, expect } from "vitest";
import { runWorkerTick, QUIET_FAILURE_TYPES } from "@/lib/acquisition/queue/worker";
import { fakeDb } from "./helpers/fakedb";

/** A job that has used its last attempt and then fails. */
const lastAttempt = (id: string, type: string) => ({ id, type, payload: {}, attempts: 3, max_attempts: 3 });

async function runFailing(type: string) {
  const job = lastAttempt(`job-${type}`, type);
  const { db, tables } = fakeDb({ acq_jobs: [{ id: job.id, status: "running" }], acq_notifications: [] }, { rpc: { acq_claim_jobs: () => [job] } });
  const summary = await runWorkerTick({ db, handlers: { [type]: async () => { throw new Error("Website returned HTTP 403"); } } });
  return { summary, tables };
}

describe("permanent job failures", () => {
  it("research and discovery failures are recorded but never announced", async () => {
    expect([...QUIET_FAILURE_TYPES].sort()).toEqual(["discover", "research"]);
    for (const type of ["research", "discover"]) {
      const { summary, tables } = await runFailing(type);
      expect(summary.failed).toBe(1);
      expect(tables.acq_jobs[0]).toMatchObject({ status: "failed" });
      expect(tables.acq_notifications).toHaveLength(0); // no admin alert, so no email
    }
  });

  it("failures of delivery jobs still raise an admin alert", async () => {
    const { summary, tables } = await runFailing("send_email");
    expect(summary.failed).toBe(1);
    expect(tables.acq_notifications).toHaveLength(1);
    expect(tables.acq_notifications[0]).toMatchObject({ kind: "job_failed", title: "Background job failed: send_email" });
  });
});
