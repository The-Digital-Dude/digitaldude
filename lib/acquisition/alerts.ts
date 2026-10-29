import { must, UNIQUE_VIOLATION, type Db } from "./db";
import { sendBrevoEmail } from "@/lib/emailBrevo";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";

/**
 * Notifications are shown in the app (the admin bell, the rep dashboard). Only these kinds are also emailed, and only to reps:
 * everything else, including every admin alert, stays in the app so the inbox holds only the emails that need a reply.
 */
const EMAILED_KINDS = new Set(["assignment"]);

export interface NotificationInput {
  /** null/undefined = the admin. */
  employeeId?: string | null;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  /** Same key = same notification: never created (or emailed) twice. */
  dedupeKey?: string;
}

/** Creates an in-app notification (emailed on the next worker tick). Returns false when the dedupe key already exists. */
export async function createNotification(db: Db, n: NotificationInput): Promise<boolean> {
  const { error } = await db.from("acq_notifications").insert({
    recipient_employee_id: n.employeeId ?? null,
    kind: n.kind,
    title: n.title.slice(0, 200),
    body: (n.body ?? "").slice(0, 2000),
    link: n.link ?? null,
    dedupe_key: n.dedupeKey ?? null,
  });
  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`create notification: ${error.message}`);
}

/** Never throws: an alert must not be able to break the job that raised it. */
export async function alertAdmin(db: Db, n: Omit<NotificationInput, "employeeId">): Promise<void> {
  try {
    await createNotification(db, { ...n, employeeId: null, link: n.link ?? "/admin/acquisition" });
  } catch (e) {
    log("warn", { message: "could not record admin alert", error: e });
  }
}

export async function alertRep(db: Db, employeeId: string, n: Omit<NotificationInput, "employeeId">): Promise<void> {
  try {
    await createNotification(db, { ...n, employeeId, link: n.link ?? "/rep/dashboard" });
  } catch (e) {
    log("warn", { message: "could not record rep notification", error: e });
  }
}

export type MailSender = (m: { to: string; toName?: string; subject: string; html: string }) => Promise<{ ok: boolean; error?: string }>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const brevoMailSender: MailSender = (m) =>
  sendBrevoEmail({ to: [{ email: m.to, name: m.toName }], subject: m.subject, htmlContent: m.html });

function render(n: { title: string; body: string; link: string | null }): string {
  const href = n.link ? (n.link.startsWith("http") ? n.link : `${SITE_URL}${n.link}`) : null;
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px">
<h2 style="font-size:16px;margin:0 0 12px">${esc(n.title)}</h2>
${n.body ? `<p style="font-size:14px;line-height:1.5;white-space:pre-line;margin:0 0 16px">${esc(n.body)}</p>` : ""}
${href ? `<p style="margin:0"><a href="${esc(href)}" style="color:#7b61ff">Open</a></p>` : ""}
</div>`;
}

/**
 * Emails notifications that have not been emailed yet (admin -> the alert inbox, rep -> their own address).
 * A failed send is retried next tick; a notification with nowhere to go is marked done so it cannot loop.
 */
export async function emailPendingNotifications(db: Db, send: MailSender = brevoMailSender, limit = 20): Promise<{ sent: number; failed: number }> {
  const rows = must(
    await db
      .from("acq_notifications")
      .select("id,kind,title,body,link,recipient_employee_id, employees(email,full_name,status)")
      .is("email_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(limit),
    "load notifications"
  ) as unknown as { id: string; kind: string; title: string; body: string; link: string | null; recipient_employee_id: string | null; employees: { email: string | null; full_name: string | null; status: string } | null }[];

  let sent = 0;
  let failed = 0;
  for (const n of rows) {
    // Claim the row atomically; if another worker tick got there first, skip it.
    const claim = await db.from("acq_notifications").update({ email_sent_at: new Date().toISOString() }).eq("id", n.id).is("email_sent_at", null).select("id");
    if (claim.error || (claim.data ?? []).length === 0) continue;
    // In-app only: the row is already marked handled above, so it is never picked up again.
    if (!n.recipient_employee_id || !EMAILED_KINDS.has(n.kind)) continue;
    const to = n.employees && n.employees.status !== "offboarded" ? n.employees.email : null;
    if (!to) continue; // nowhere to send: stays marked as handled
    const res = await send({ to, toName: n.employees?.full_name ?? undefined, subject: n.title, html: render(n) });
    if (res.ok) {
      sent++;
    } else {
      failed++;
      await db.from("acq_notifications").update({ email_sent_at: null }).eq("id", n.id); // release it so the next tick retries
      log("warn", { message: "notification email failed", context: { id: n.id }, error: res.error });
    }
  }
  return { sent, failed };
}

/**
 * One digest per rep for newly assigned companies (admin assignment, auto rules). Claims by the rep themselves
 * are not announced to them. Every log row is marked handled so nothing is announced twice.
 */
export async function notifyAssignments(db: Db): Promise<number> {
  const logs = must(
    await db
      .from("acq_assignment_log")
      .select("id,to_employee_id,action, acq_companies(name)")
      .is("notified_at", null)
      .not("to_employee_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(500),
    "load assignment log"
  ) as unknown as { id: string; to_employee_id: string; action: string; acq_companies: { name: string } | null }[];
  if (logs.length === 0) return 0;

  const byRep = new Map<string, { names: string[]; lastId: string }>();
  for (const l of logs) {
    if (l.action !== "assign" && l.action !== "rule") continue;
    const e = byRep.get(l.to_employee_id) ?? { names: [], lastId: l.id };
    e.names.push(l.acq_companies?.name ?? "A company");
    e.lastId = l.id;
    byRep.set(l.to_employee_id, e);
  }
  let made = 0;
  for (const [employeeId, e] of byRep) {
    const shown = e.names.slice(0, 8).join("\n");
    const more = e.names.length > 8 ? `\n…and ${e.names.length - 8} more` : "";
    const created = await createNotification(db, {
      employeeId,
      kind: "assignment",
      title: `${e.names.length} new ${e.names.length === 1 ? "company" : "companies"} assigned to you`,
      body: `${shown}${more}\n\nOpen your Lead Pool to find contacts and start outreach.`,
      link: "/rep/dashboard",
      dedupeKey: `assign:${employeeId}:${e.lastId}`,
    });
    if (created) made++;
  }
  must(await db.from("acq_assignment_log").update({ notified_at: new Date().toISOString() }).in("id", logs.map((l) => l.id)).select("id"), "mark assignments notified");
  return made;
}
