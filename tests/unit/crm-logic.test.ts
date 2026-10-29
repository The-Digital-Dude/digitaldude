import { describe, it, expect } from "vitest";
import { engagementScore, fitScore, gradeFor, nextMove, priorityScore } from "@/lib/crm/scoring";
import { learnedWinRates, needsNextStep, staleness, weightedPipeline } from "@/lib/crm/health";
import { DEFAULT_CRM_SETTINGS, DEFAULT_PROBABILITIES, sanitizeCrmSettings } from "@/lib/crm/settings";
import { activityInputSchema, currencyFor, leadPatchSchema, taskInputSchema, viewInputSchema } from "@/lib/crm/model";
import { addWorkingDays, closeOpenTasks, createTask, recordBooking, recordEmailSent, recordReply, recordStageChange, safely } from "@/lib/crm/activity";
import { fakeDb } from "./helpers/fakedb";

describe("fit score", () => {
  const base = { email: "dan@plum.com.au", jobTitle: "Managing Director", countryAllowed: true, industryMatch: true, emailStatus: "safe" as const, hasPhone: true, hasCompany: true, companyFit: 80 };
  it("rewards a senior person at a good company on a business address, and explains each point", () => {
    const r = fitScore(base);
    expect(r.grade).toBe("A");
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.factors.map((f) => f.label)).toEqual(expect.arrayContaining(["Senior decision-maker title", "Business email address", "Country is enabled for outreach"]));
    expect(r.factors.reduce((s, f) => s + f.points, 0)).toBeGreaterThanOrEqual(r.score); // the breakdown adds up (before the 0-100 clamp)
    const mid = fitScore({ email: "dan@plum.com.au", jobTitle: "Manager" });
    expect(mid.factors.reduce((s, f) => s + f.points, 0)).toBe(mid.score);
  });
  it("penalises a free-mail address, a junior title, a disabled country and a dead address", () => {
    const poor = fitScore({ email: "dan@gmail.com", jobTitle: "Intern", countryAllowed: false, emailStatus: "invalid" });
    expect(poor.grade).toBe("D");
    expect(poor.score).toBe(0); // never below zero
    expect(fitScore({ email: "d@x.com" }).score).toBeLessThan(fitScore({ email: "d@x.com", jobTitle: "Founder" }).score);
  });
  it("grades by threshold", () => {
    expect([gradeFor(90), gradeFor(75), gradeFor(60), gradeFor(40), gradeFor(10)]).toEqual(["A", "A", "B", "C", "D"]);
  });
});

describe("engagement score", () => {
  const none = { replies: [], pageViews: 0, buttonClicks: 0, booked: false, bounced: false, optedOut: false, emailsSent: 1, daysSinceActivity: 1 };
  it("counts real signals and caps repeats; a booking is the strongest", () => {
    expect(engagementScore(none).score).toBe(0);
    expect(engagementScore({ ...none, replies: ["interested"] }).score).toBe(40);
    expect(engagementScore({ ...none, pageViews: 10 }).score).toBe(24); // capped at 3 views
    expect(engagementScore({ ...none, buttonClicks: 5 }).score).toBe(24);
    const booked = engagementScore({ ...none, replies: ["interested"], pageViews: 2, booked: true });
    expect(booked.label).toBe("hot");
    expect(booked.score).toBe(100); // clamped
  });
  it("an opt-out is zero, a decline and a bounce subtract, and long silence decays the score", () => {
    expect(engagementScore({ ...none, replies: ["opt_out"], optedOut: true, booked: true }).score).toBe(0);
    expect(engagementScore({ ...none, replies: ["not_interested"], pageViews: 3 }).score).toBe(4);
    expect(engagementScore({ ...none, bounced: true, pageViews: 3 }).score).toBe(0);
    const fresh = engagementScore({ ...none, replies: ["interested"], daysSinceActivity: 5 }).score;
    const stale = engagementScore({ ...none, replies: ["interested"], daysSinceActivity: 40 }).score;
    expect(stale).toBe(Math.round(fresh * 0.5));
  });
  it("many unanswered emails slowly lower it, but only when there has been no reply", () => {
    expect(engagementScore({ ...none, pageViews: 3, emailsSent: 9 }).score).toBeLessThan(engagementScore({ ...none, pageViews: 3, emailsSent: 2 }).score);
    expect(engagementScore({ ...none, replies: ["interested"], emailsSent: 9 }).score).toBe(40);
  });
});

describe("priority and next move", () => {
  it("fit counts a little more than engagement, and the advice follows the two together", () => {
    expect(priorityScore(80, 20)).toBeGreaterThan(priorityScore(30, 90) - 40);
    expect(nextMove("A", "hot")).toBe("Work now");
    expect(nextMove("A", "cold")).toMatch(/Next up/);
    expect(nextMove("D", "hot")).toMatch(/weak fit/);
    expect(nextMove("A", "hot", true)).toBe("Do not contact");
  });
});

describe("staleness and next steps", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const lead = (stage: string, daysAgo: number) => ({ stage, created_at: new Date(now.getTime() - 90 * 86_400_000).toISOString(), last_activity_at: new Date(now.getTime() - daysAgo * 86_400_000).toISOString() });
  it("uses the per-stage thresholds (new 2, contacted 5, meeting 3, negotiation 7)", () => {
    expect(staleness(lead("new", 1), now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness(lead("new", 2), now, DEFAULT_CRM_SETTINGS).stale).toBe(true);
    expect(staleness(lead("contacted", 4), now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness(lead("contacted", 5), now, DEFAULT_CRM_SETTINGS).stale).toBe(true);
    expect(staleness(lead("meeting_booked", 3), now, DEFAULT_CRM_SETTINGS).stale).toBe(true);
    expect(staleness(lead("negotiation", 6), now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness(lead("negotiation", 8), now, DEFAULT_CRM_SETTINGS)).toMatchObject({ stale: true, days: 8, threshold: 7 });
  });
  it("won, lost and erased leads are never stale; a brand new lead counts from its creation", () => {
    expect(staleness(lead("won", 99), now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness(lead("lost", 99), now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness({ ...lead("contacted", 99), anonymized_at: "2026-01-01" }, now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
    expect(staleness({ stage: "new", created_at: now.toISOString() }, now, DEFAULT_CRM_SETTINGS)).toMatchObject({ stale: false, days: 0 });
    // The latest of activity and last contact wins.
    expect(staleness({ ...lead("contacted", 9), last_contacted_at: new Date(now.getTime() - 86_400_000).toISOString() }, now, DEFAULT_CRM_SETTINGS).stale).toBe(false);
  });
  it("flags an open lead past 'new' that has no task scheduled", () => {
    expect(needsNextStep({ stage: "contacted" }, 0)).toBe(true);
    expect(needsNextStep({ stage: "contacted" }, 1)).toBe(false);
    expect(needsNextStep({ stage: "new" }, 0)).toBe(false);
    expect(needsNextStep({ stage: "won" }, 0)).toBe(false);
  });
});

describe("weighted pipeline", () => {
  it("weights open deals by stage probability (or the lead's own), keeps currencies apart, and reports won separately", () => {
    const f = weightedPipeline(
      [
        { stage: "negotiation", estimated_deal_value: 10_000, currency: "GBP" },
        { stage: "meeting_booked", estimated_deal_value: 10_000, currency: "GBP", probability: 50 },
        { stage: "won", estimated_deal_value: 5_000, currency: "GBP" },
        { stage: "lost", estimated_deal_value: 99_999, currency: "GBP" },
        { stage: "contacted", estimated_deal_value: 1_000, currency: "AUD" },
      ],
      DEFAULT_PROBABILITIES
    );
    const gbp = f.find((x) => x.currency === "GBP")!;
    expect(gbp).toMatchObject({ open: 20_000, weighted: 11_000, won: 5_000, openCount: 2 }); // 60% of 10k + 50% of 10k
    expect(f.find((x) => x.currency === "AUD")).toMatchObject({ open: 1_000, weighted: 100 });
  });
});

describe("learned win rates", () => {
  it("measures how far leads got and how many of those were won, and only suggests once there is enough data", () => {
    const current: Record<string, string> = {};
    const changes: { lead_id: string; from: string | null; to: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const id = `l${i}`;
      changes.push({ lead_id: id, from: "new", to: "contacted" }, { lead_id: id, from: "contacted", to: "meeting_booked" });
      current[id] = i < 3 ? "won" : "lost"; // 3 of 12 reached a meeting and won
    }
    const r = learnedWinRates(changes, current);
    const meeting = r.find((x) => x.stage === "meeting_booked")!;
    expect(meeting).toMatchObject({ reached: 12, won: 3, rate: 0.25, suggested: 25 });
    expect(r.find((x) => x.stage === "negotiation")).toMatchObject({ reached: 3, suggested: null }); // under 10 leads: no suggestion
    expect(learnedWinRates([], {}).every((x) => x.rate === null)).toBe(true);
  });
});

describe("settings", () => {
  it("repairs bad saved values field by field and falls back to the defaults", () => {
    expect(sanitizeCrmSettings(null)).toEqual(DEFAULT_CRM_SETTINGS);
    const s = sanitizeCrmSettings({ staleDays: { new: 0, contacted: 9 }, probabilities: { won: 55, negotiation: 70 }, retentionMonths: 2 });
    expect(s.staleDays).toEqual({ ...DEFAULT_CRM_SETTINGS.staleDays, contacted: 9 });
    expect(s.probabilities.negotiation).toBe(70);
    expect(s.probabilities.won).toBe(55);
    expect(s.retentionMonths).toBe(24); // under 6 months is refused
  });
});

describe("input validation (nothing outside the allowed fields gets through)", () => {
  it("lead edits are strict: ownership and scores cannot be set, tags are normalised, bad values are refused", () => {
    expect(leadPatchSchema.safeParse({ employee_id: "someone-else" }).success).toBe(false);
    expect(leadPatchSchema.safeParse({ fit_score: 100 }).success).toBe(false);
    expect(leadPatchSchema.safeParse({ anonymized_at: null }).success).toBe(false);
    expect(leadPatchSchema.safeParse({ stage: "flying" }).success).toBe(false);
    expect(leadPatchSchema.safeParse({ probability: 120 }).success).toBe(false);
    expect(leadPatchSchema.safeParse({ country: "Australia" }).success).toBe(false);
    expect(leadPatchSchema.parse({ tags: [" Hot ", "UK"] }).tags).toEqual(["hot", "uk"]);
    expect(leadPatchSchema.parse({ stage: "lost", lost_reason: "no_budget" })).toEqual({ stage: "lost", lost_reason: "no_budget" });
    expect(leadPatchSchema.safeParse({ tags: ["<script>"] }).success).toBe(false);
  });
  it("activities, tasks and views", () => {
    expect(activityInputSchema.safeParse({ type: "call", outcome: "connected", summary: "Spoke to Dan" }).success).toBe(true);
    expect(activityInputSchema.safeParse({ type: "email_sent", summary: "x" }).success).toBe(false); // system types cannot be forged
    expect(activityInputSchema.safeParse({ type: "note", summary: "" }).success).toBe(false);
    expect(taskInputSchema.safeParse({ leadId: "not-a-uuid", title: "x", dueAt: "2026-10-23T10:00:00Z" }).success).toBe(false);
    expect(viewInputSchema.safeParse({ name: "UK stale", filters: { country: "gb", stale: true } }).data?.filters.country).toBe("GB");
    expect(viewInputSchema.safeParse({ name: "x", filters: { sql: "drop" } }).success).toBe(false);
  });
  it("currency follows the country", () => {
    expect([currencyFor("AU"), currencyFor("gb"), currencyFor("US"), currencyFor("IE"), currencyFor("XX"), currencyFor(null, "AUD")]).toEqual(["AUD", "GBP", "USD", "EUR", "BDT", "AUD"]);
  });
});

describe("automatic activity and tasks", () => {
  const now = new Date("2026-10-23T10:00:00Z"); // a Friday
  const seed = (lead: Record<string, unknown> = {}) => ({
    rep_leads: [{ id: "l1", employee_id: "r1", full_name: "Dan Lee", email: "dan@plum.com.au", stage: "new", status: "new", anonymized_at: null, ...lead }],
    rep_lead_activities: [] as Record<string, unknown>[],
    rep_lead_tasks: [] as Record<string, unknown>[],
  });

  it("working-day arithmetic skips weekends", () => {
    expect(addWorkingDays(now, 1).toISOString().slice(0, 10)).toBe("2026-10-26"); // Fri + 1 = Mon
    expect(addWorkingDays(now, 3).toISOString().slice(0, 10)).toBe("2026-10-28"); // Fri + 3 = Wed
    expect(addWorkingDays(new Date("2026-10-24T10:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-10-26"); // Sat + 1 = Mon
  });

  it("a sent email is logged, moves a new lead to contacted/attempted, and schedules a follow-up 3 working days out", async () => {
    const { db, tables } = fakeDb(seed());
    expect(await recordEmailSent(db, { employeeId: "r1", email: "Dan@Plum.com.au", subject: "Hello Plum", stage: "cold", now })).toBe(true);
    expect(tables.rep_lead_activities[0]).toMatchObject({ lead_id: "l1", type: "email_sent", summary: "Hello Plum" });
    expect(tables.rep_leads[0]).toMatchObject({ stage: "contacted", status: "attempted" });
    expect(tables.rep_lead_tasks[0]).toMatchObject({ kind: "follow_up", auto: true, status: "open" });
    expect(String(tables.rep_lead_tasks[0].due_at).slice(0, 10)).toBe("2026-10-28");
  });

  it("a second email completes the old follow-up and schedules the next; a non-lead is ignored; another rep's lead is untouched", async () => {
    const { db, tables } = fakeDb(seed());
    await recordEmailSent(db, { employeeId: "r1", email: "dan@plum.com.au", subject: "One", stage: "cold", now });
    await recordEmailSent(db, { employeeId: "r1", email: "dan@plum.com.au", subject: "Two", stage: "follow_up", now });
    expect(tables.rep_lead_tasks.filter((t) => t.status === "open")).toHaveLength(1);
    expect(tables.rep_lead_tasks.filter((t) => t.status === "done")).toHaveLength(1);
    expect(await recordEmailSent(db, { employeeId: "r1", email: "stranger@x.com", subject: "x", stage: "cold", now })).toBe(false);
    expect(await recordEmailSent(db, { employeeId: "r2", email: "dan@plum.com.au", subject: "x", stage: "cold", now })).toBe(false);
  });

  it("an interested reply cancels the follow-up and records the reply for the team to answer", async () => {
    const { db, tables } = fakeDb(seed());
    await recordEmailSent(db, { employeeId: "r1", email: "dan@plum.com.au", subject: "Hi", stage: "cold", now });
    expect(await recordReply(db, { email: "dan@plum.com.au", classification: "interested", snippet: "Yes please", now })).toBe(1);
    const follow = tables.rep_lead_tasks.find((t) => t.kind === "follow_up")!;
    expect(follow).toMatchObject({ status: "cancelled", cancel_reason: "they replied" });
    const respond = tables.rep_lead_tasks.find((t) => t.kind === "respond")!;
    expect(respond).toMatchObject({ status: "open", auto: true });
    expect(Date.parse(String(respond.due_at)) - now.getTime()).toBe(3 * 86_400_000);
    expect(String(respond.title)).toMatch(/the team is answering/);
    expect(tables.rep_leads[0].status).toBe("interested");
  });

  it("an opt-out or a decline closes every task and marks the lead unqualified", async () => {
    for (const classification of ["opt_out", "not_interested"]) {
      const { db, tables } = fakeDb(seed());
      await createTask(db, { leadId: "l1", employeeId: "r1", title: "Call", dueAt: now });
      await recordReply(db, { email: "dan@plum.com.au", classification, snippet: "no", now });
      expect(tables.rep_lead_tasks.every((t) => t.status === "cancelled")).toBe(true);
      expect(tables.rep_leads[0].status).toBe("unqualified");
    }
  });

  it("a booking moves the lead to meeting booked and schedules preparation the day before the call", async () => {
    const { db, tables } = fakeDb(seed({ stage: "contacted" }));
    await createTask(db, { leadId: "l1", employeeId: "r1", title: "Follow up", dueAt: now, kind: "follow_up", auto: true });
    const slot = new Date("2026-10-30T09:00:00Z");
    expect(await recordBooking(db, { employeeId: "r1", email: "dan@plum.com.au", slotStart: slot, now })).toBe(true);
    expect(tables.rep_leads[0]).toMatchObject({ stage: "meeting_booked", status: "connected" });
    expect(tables.rep_lead_tasks.find((t) => t.kind === "follow_up")?.status).toBe("cancelled");
    expect(tables.rep_lead_tasks.find((t) => t.kind === "prepare_call")?.due_at).toBe("2026-10-29T09:00:00.000Z");
    // A call booked for tomorrow: the preparation is at least an hour from now, never in the past.
    const soon = fakeDb(seed({ stage: "contacted" }));
    await recordBooking(soon.db, { employeeId: "r1", email: "dan@plum.com.au", slotStart: new Date(now.getTime() + 6 * 3_600_000), now });
    expect(soon.tables.rep_lead_tasks[0].due_at).toBe(new Date(now.getTime() + 3_600_000).toISOString());
  });

  it("won and lost close all open tasks; a stage that did not change records nothing", async () => {
    const { db, tables } = fakeDb(seed());
    await createTask(db, { leadId: "l1", employeeId: "r1", title: "Call", dueAt: now });
    await recordStageChange(db, { leadId: "l1", from: "negotiation", to: "negotiation" });
    expect(tables.rep_lead_activities).toHaveLength(0);
    await recordStageChange(db, { leadId: "l1", from: "negotiation", to: "lost", reason: "no_budget" });
    expect(tables.rep_lead_activities[0]).toMatchObject({ type: "stage_change" });
    expect(tables.rep_lead_tasks[0].status).toBe("cancelled");
    await closeOpenTasks(db, "l1", "done", "x"); // nothing open: harmless
  });

  it("safely never throws", async () => {
    expect(await safely("boom", async () => { throw new Error("db down"); })).toBeNull();
    expect(await safely("fine", async () => 7)).toBe(7);
  });
});
