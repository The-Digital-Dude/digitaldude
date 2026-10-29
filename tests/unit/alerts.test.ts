import { describe, it, expect, vi } from "vitest";
import { createNotification, emailPendingNotifications, notifyAssignments, type MailSender } from "@/lib/acquisition/alerts";
import { runHealthChecks, recordHeartbeat } from "@/lib/acquisition/health";
import { fakeDb } from "./helpers/fakedb";

const unique = { acq_notifications: "dedupe_key" };

describe("notifications", () => {
  it("creates a notification once per dedupe key", async () => {
    const { db, tables } = fakeDb({}, { unique });
    expect(await createNotification(db, { kind: "reply", title: "Hi", dedupeKey: "k1" })).toBe(true);
    expect(await createNotification(db, { kind: "reply", title: "Hi again", dedupeKey: "k1" })).toBe(false);
    expect(tables.acq_notifications).toHaveLength(1);
  });

  it("never emails admin alerts; emails only rep assignment digests, skipping offboarded or address-less reps", async () => {
    const { db, tables } = fakeDb({
      acq_notifications: [
        { id: "a", kind: "reply", title: "Admin item", body: "x", link: "/admin/acquisition", recipient_employee_id: null, email_sent_at: null, created_at: "1" },
        { id: "b", kind: "assignment", title: "Rep item", body: "y", link: "/rep/dashboard", recipient_employee_id: "r1", email_sent_at: null, created_at: "2", employees: { email: "rep@x.com", full_name: "Rita", status: "active" } },
        { id: "c", kind: "assignment", title: "Gone rep", body: "z", link: null, recipient_employee_id: "r2", email_sent_at: null, created_at: "3", employees: { email: "gone@x.com", full_name: "Gone", status: "offboarded" } },
        { id: "d", kind: "assignment", title: "No email", body: "", link: null, recipient_employee_id: "r3", email_sent_at: null, created_at: "4", employees: { email: null, full_name: "N", status: "active" } },
      ],
    });
    const send = vi.fn<MailSender>(async () => ({ ok: true }));
    expect(await emailPendingNotifications(db, send)).toEqual({ sent: 1, failed: 0 });
    expect(send.mock.calls.map((c) => c[0].to)).toEqual(["rep@x.com"]);
    expect(tables.acq_notifications.every((n) => n.email_sent_at)).toBe(true); // nowhere-to-send ones are closed out too
  });

  it("keeps every other rep notification (tasks, cold leads, proposal views) in the app", async () => {
    const { db, tables } = fakeDb({ acq_notifications: [{ id: "a", kind: "task_due", title: "Task due", body: "", link: null, recipient_employee_id: "r1", email_sent_at: null, created_at: "1", employees: { email: "rep@x.com", full_name: "Rita", status: "active" } }] });
    const send = vi.fn<MailSender>(async () => ({ ok: true }));
    expect(await emailPendingNotifications(db, send)).toEqual({ sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
    expect(tables.acq_notifications[0].email_sent_at).toBeTruthy(); // closed out, not left to retry
  });

  it("leaves a notification unsent when the email fails, so it is retried", async () => {
    const { db, tables } = fakeDb({ acq_notifications: [{ id: "a", kind: "assignment", title: "T", body: "", link: null, recipient_employee_id: "r1", employees: { email: "rep@x.com", full_name: "R", status: "active" }, email_sent_at: null, created_at: "1" }] });
    expect(await emailPendingNotifications(db, async () => ({ ok: false, error: "boom" }))).toEqual({ sent: 0, failed: 1 });
    expect(tables.acq_notifications[0].email_sent_at).toBeNull();
  });

  it("escapes HTML in alert text", async () => {
    const { db } = fakeDb({ acq_notifications: [{ id: "a", title: "<b>x</b>", body: "<script>1</script>", link: null, recipient_employee_id: "r1", kind: "assignment", employees: { email: "rep@x.com", full_name: "R", status: "active" }, email_sent_at: null, created_at: "1" }] });
    const send = vi.fn<MailSender>(async () => ({ ok: true }));
    await emailPendingNotifications(db, send);
    expect(send.mock.calls[0][0].html).not.toContain("<script>");
  });
});

describe("assignment digest", () => {
  it("sends one digest per rep for admin/rule assignments, never for the rep's own claims, and marks everything handled", async () => {
    const { db, tables } = fakeDb(
      {
        acq_assignment_log: [
          { id: "1", to_employee_id: "r1", action: "assign", notified_at: null, created_at: "1", acq_companies: { name: "Acme" } },
          { id: "2", to_employee_id: "r1", action: "rule", notified_at: null, created_at: "2", acq_companies: { name: "Beta" } },
          { id: "3", to_employee_id: "r2", action: "claim", notified_at: null, created_at: "3", acq_companies: { name: "Gamma" } },
          { id: "4", to_employee_id: "r3", action: "assign", notified_at: "done", created_at: "4", acq_companies: { name: "Old" } },
        ],
      },
      { unique }
    );
    expect(await notifyAssignments(db)).toBe(1);
    const n = tables.acq_notifications;
    expect(n).toHaveLength(1);
    expect(n[0]).toMatchObject({ recipient_employee_id: "r1", kind: "assignment", title: "2 new companies assigned to you" });
    expect(String(n[0].body)).toContain("Acme");
    expect(tables.acq_assignment_log.filter((l) => l.notified_at === null)).toHaveLength(0);
    expect(await notifyAssignments(db)).toBe(0); // nothing is announced twice
  });
});

describe("health checks", () => {
  const now = new Date("2026-10-12T10:00:00Z");
  it("alerts once a day when the worker has stopped, and not when it is healthy or has never run", async () => {
    const { db, tables } = fakeDb({}, { unique });
    expect(await runHealthChecks(db, now)).toEqual([]); // no heartbeat yet: nothing to compare
    await recordHeartbeat(db, new Date(now.getTime() - 10 * 60_000));
    expect(await runHealthChecks(db, now)).toEqual([]);
    await recordHeartbeat(db, new Date(now.getTime() - 50 * 60_000));
    expect(await runHealthChecks(db, now)).toEqual(["worker_stale"]);
    await runHealthChecks(db, now); // same day again
    expect(tables.acq_notifications).toHaveLength(1);
    expect(tables.acq_notifications[0].title).toMatch(/stopped/);
  });

  it("alerts when three or more jobs failed in the last day", async () => {
    const recent = new Date(now.getTime() - 3600_000).toISOString();
    const { db, tables } = fakeDb({ acq_jobs: ["a", "b", "c"].map((t) => ({ type: "research", status: "failed", last_error: `err ${t}`, run_at: recent })) }, { unique });
    expect(await runHealthChecks(db, now)).toEqual(["jobs_failing"]);
    expect(tables.acq_notifications[0].title).toMatch(/3 background jobs failed/);
  });
});

describe("notification emails are sent once", () => {
  it("two overlapping ticks never email the same notification twice", async () => {
    const { db } = fakeDb({ acq_notifications: [{ id: "a", title: "T", body: "", link: null, recipient_employee_id: "r1", kind: "assignment", employees: { email: "rep@x.com", full_name: "R", status: "active" }, email_sent_at: null, created_at: "1" }] });
    const send = vi.fn<MailSender>(async () => ({ ok: true }));
    await Promise.all([emailPendingNotifications(db, send), emailPendingNotifications(db, send)]);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("releases a notification whose email failed so it is retried", async () => {
    const { db, tables } = fakeDb({ acq_notifications: [{ id: "a", title: "T", body: "", link: null, recipient_employee_id: "r1", kind: "assignment", employees: { email: "rep@x.com", full_name: "R", status: "active" }, email_sent_at: null, created_at: "1" }] });
    await emailPendingNotifications(db, async () => ({ ok: false, error: "boom" }));
    expect(tables.acq_notifications[0].email_sent_at).toBeNull();
    const send = vi.fn<MailSender>(async () => ({ ok: true }));
    await emailPendingNotifications(db, send);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
