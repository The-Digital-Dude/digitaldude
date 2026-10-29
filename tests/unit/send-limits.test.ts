import { describe, it, expect } from "vitest";
import { DEFAULT_LIMIT_SETTINGS, effectiveLimits, limitRowFrom, repCapacity, sentLast24h } from "@/lib/crm/sendLimits";
import { nextWorkingMorning, rolloverFollowUps } from "@/lib/crm/rollover";
import { fakeDb } from "./helpers/fakedb";

const now = new Date("2026-11-02T08:00:00Z"); // a Monday
const daysAgo = (n: number, hours = 0) => new Date(now.getTime() - n * 86_400_000 - hours * 3_600_000).toISOString();
const settings = { ...DEFAULT_LIMIT_SETTINGS, startCold: 10, startFollowUp: 8, stepPerWeek: 5 };

describe("a rep's limits today", () => {
  it("gives the maximums when warm-up is off", () => {
    expect(effectiveLimits({ coldMax: 50, followUpMax: 30, warmup: false, startedAt: daysAgo(1) }, settings, now)).toMatchObject({ cold: 50, followUp: 30, ramping: false });
  });

  it("starts low and rises each week up to the maximums during warm-up", () => {
    const row = (startedDaysAgo: number) => ({ coldMax: 30, followUpMax: 20, warmup: true, startedAt: daysAgo(startedDaysAgo) });
    expect(effectiveLimits(row(0), settings, now)).toMatchObject({ cold: 10, followUp: 8, week: 0, ramping: true });
    expect(effectiveLimits(row(8), settings, now)).toMatchObject({ cold: 15, followUp: 13, week: 1 });
    expect(effectiveLimits(row(22), settings, now)).toMatchObject({ cold: 25, followUp: 20, week: 3, ramping: true }); // follow-ups hit their max first
    expect(effectiveLimits(row(60), settings, now)).toMatchObject({ cold: 30, followUp: 20, ramping: false });
  });

  it("never exceeds the maximum even if the start is set higher", () => {
    expect(effectiveLimits({ coldMax: 5, followUpMax: 5, warmup: true, startedAt: daysAgo(0) }, settings, now)).toMatchObject({ cold: 5, followUp: 5, ramping: false });
  });

  it("reads an employee from before migration 0043 as the old single limit with warm-up off", () => {
    expect(limitRowFrom({ daily_outreach_limit: 40 })).toEqual({ coldMax: 40, followUpMax: 30, warmup: false, startedAt: null });
    expect(limitRowFrom({})).toMatchObject({ coldMax: 50, warmup: false });
    expect(limitRowFrom({ daily_outreach_limit: 20, followup_daily_limit: 12, limit_warmup: true, limit_started_at: "2026-10-01T00:00:00Z" })).toEqual({ coldMax: 20, followUpMax: 12, warmup: true, startedAt: "2026-10-01T00:00:00Z" });
  });
});

describe("counting what a rep has sent", () => {
  const logs = [
    { employee_id: "r1", stage: "cold", sent_at: daysAgo(0, 2) },
    { employee_id: "r1", stage: "cold", sent_at: daysAgo(0, 5) },
    { employee_id: "r1", stage: "follow_up", sent_at: daysAgo(0, 3) },
    { employee_id: "r1", stage: "follow_up", sent_at: daysAgo(2) }, // older than 24h: not counted
    { employee_id: "r2", stage: "follow_up", sent_at: daysAgo(0, 1) },
  ];

  it("counts cold and follow-ups separately over the last 24 hours", async () => {
    const { db } = fakeDb({ rep_outreach_logs: logs });
    const usage = await sentLast24h(db, now);
    expect(usage.get("r1")).toEqual({ cold: 2, followUp: 1 });
    expect(usage.get("r2")).toEqual({ cold: 0, followUp: 1 });
  });

  it("reports the remaining capacity per kind, so cold sends cannot use up the follow-up quota", async () => {
    const { db } = fakeDb({
      rep_outreach_logs: logs,
      employees: [{ id: "r1", daily_outreach_limit: 3, followup_daily_limit: 5, limit_warmup: false, limit_started_at: daysAgo(30) }],
      acq_settings: [],
    });
    const cap = await repCapacity(db, "r1", now);
    expect(cap.cold).toMatchObject({ limit: 3, used: 2, remaining: 1 });
    expect(cap.followUp).toMatchObject({ limit: 5, used: 1, remaining: 4 });
  });
});

describe("moving follow-ups a rep cannot send today", () => {
  it("picks 07:00 UTC on the next working day, skipping the weekend", () => {
    expect(nextWorkingMorning(new Date("2026-11-02T08:00:00Z")).toISOString()).toBe("2026-11-03T07:00:00.000Z");
    expect(nextWorkingMorning(new Date("2026-11-06T23:00:00Z")).toISOString()).toBe("2026-11-09T07:00:00.000Z"); // Friday -> Monday
  });

  const task = (id: string, employee_id: string, due_at: string, over: Record<string, unknown> = {}) => ({ id, employee_id, due_at, status: "open", kind: "follow_up", ...over });

  it("keeps the oldest due follow-ups up to the limit, moves the rest, and tells the rep and the admin", async () => {
    const { db, tables } = fakeDb(
      {
        employees: [
          { id: "r1", full_name: "Rita", status: "active", daily_outreach_limit: 50, followup_daily_limit: 2, limit_warmup: false },
          { id: "r2", full_name: "Sam", status: "active", daily_outreach_limit: 50, followup_daily_limit: 10, limit_warmup: false },
        ],
        rep_lead_tasks: [
          task("t1", "r1", daysAgo(3)),
          task("t2", "r1", daysAgo(2)),
          task("t3", "r1", daysAgo(1)),
          task("t4", "r1", daysAgo(0, 1)),
          task("t5", "r1", new Date(now.getTime() + 86_400_000).toISOString()), // not due yet
          task("t6", "r1", daysAgo(5), { kind: "respond" }), // not a follow-up
          task("s1", "r2", daysAgo(1)),
        ],
        acq_settings: [],
      },
      { unique: { acq_notifications: "dedupe_key" } }
    );

    expect(await rolloverFollowUps(db, now)).toEqual({ reps: 1, moved: 2 });
    const due = (id: string) => String(tables.rep_lead_tasks.find((t) => t.id === id)!.due_at);
    expect(due("t1")).toBe(daysAgo(3));
    expect(due("t2")).toBe(daysAgo(2));
    expect(due("t3")).toBe("2026-11-03T07:00:00.000Z");
    expect(due("t4")).toBe("2026-11-03T07:00:00.000Z");
    expect(due("t5")).toBe(new Date(now.getTime() + 86_400_000).toISOString());
    expect(due("t6")).toBe(daysAgo(5));
    expect(due("s1")).toBe(daysAgo(1)); // Sam is within his limit

    const notes = tables.acq_notifications;
    expect(notes.find((n) => n.recipient_employee_id === "r1")).toMatchObject({ kind: "followups_rolled" });
    expect(notes.find((n) => n.recipient_employee_id === null)).toMatchObject({ kind: "rep_behind", link: "/admin/acquisition/limits?rep=r1" });
    expect(notes).toHaveLength(2);
  });

  it("does nothing when everyone is within their limits, and uses the warm-up limit for a new rep", async () => {
    const calm = fakeDb({ employees: [{ id: "r1", full_name: "Rita", status: "active", daily_outreach_limit: 50, followup_daily_limit: 10, limit_warmup: false }], rep_lead_tasks: [task("t1", "r1", daysAgo(1))], acq_settings: [] });
    expect(await rolloverFollowUps(calm.db, now)).toEqual({ reps: 0, moved: 0 });

    // a brand-new rep ramping up (default start: 10 follow-ups) with 12 due
    const many = Array.from({ length: 12 }, (_, i) => task(`n${i}`, "r1", daysAgo(1, i)));
    const ramp = fakeDb({ employees: [{ id: "r1", full_name: "Rita", status: "active", daily_outreach_limit: 50, followup_daily_limit: 30, limit_warmup: true, limit_started_at: daysAgo(0, 1) }], rep_lead_tasks: many, acq_settings: [] });
    expect(await rolloverFollowUps(ramp.db, now)).toEqual({ reps: 1, moved: 2 });
  });
});
