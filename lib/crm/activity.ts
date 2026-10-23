import type { SupabaseClient } from "@supabase/supabase-js";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { log } from "@/lib/logger";
import type { ActivityType, TaskKind } from "./model";
import { DEFAULT_CRM_SETTINGS } from "./settings";

type Db = SupabaseClient;

/**
 * Writing to the lead timeline and the task list. Everything the system does (email sent, reply, booking, stage change) goes through
 * here so the timeline is complete. Callers wrap these in try/catch: logging a CRM event must never stop an email or a booking.
 */

/** Adds N working days (Mon-Fri) to a date, at the same time of day (UTC). */
export function addWorkingDays(from: Date, n: number): Date {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

export interface NewActivity {
  leadId: string;
  employeeId?: string | null;
  type: ActivityType;
  outcome?: string | null;
  summary: string;
  details?: Record<string, unknown>;
  occurredAt?: string;
}

export async function logActivity(db: Db, a: NewActivity): Promise<void> {
  const { error } = await db.from("rep_lead_activities").insert({
    lead_id: a.leadId,
    employee_id: a.employeeId ?? null,
    type: a.type,
    outcome: a.outcome ?? null,
    summary: a.summary.slice(0, 1000),
    details: a.details ?? {},
    occurred_at: a.occurredAt ?? new Date().toISOString(),
  });
  if (error) throw new Error(`log activity: ${error.message}`);
}

export interface NewTask {
  leadId: string;
  employeeId: string;
  title: string;
  dueAt: Date;
  kind?: TaskKind;
  auto?: boolean;
}

/** Creates a task. An automatic one that already exists open for that lead and kind is simply left alone. */
export async function createTask(db: Db, t: NewTask): Promise<boolean> {
  const { error } = await db.from("rep_lead_tasks").insert({ lead_id: t.leadId, employee_id: t.employeeId, title: t.title.slice(0, 200), due_at: t.dueAt.toISOString(), kind: t.kind ?? "manual", auto: !!t.auto, status: "open" });
  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`create task: ${error.message}`);
}

/** Closes open tasks of the given kinds (all kinds if none given). */
export async function closeOpenTasks(db: Db, leadId: string, status: "done" | "cancelled", reason: string, kinds?: TaskKind[]): Promise<void> {
  let q = db.from("rep_lead_tasks").update({ status, cancel_reason: status === "cancelled" ? reason : null, completed_at: status === "done" ? new Date().toISOString() : null }).eq("lead_id", leadId).eq("status", "open");
  if (kinds?.length) q = q.in("kind", kinds);
  const { error } = await q.select("id");
  if (error) throw new Error(`close tasks: ${error.message}`);
}

interface LeadRef {
  id: string;
  employee_id: string;
  full_name: string;
  stage: string;
  status: string;
}

async function leadsByEmail(db: Db, email: string, employeeId?: string | null): Promise<LeadRef[]> {
  let q = db.from("rep_leads").select("id,employee_id,full_name,stage,status").eq("email", email.trim().toLowerCase()).is("anonymized_at", null);
  if (employeeId) q = q.eq("employee_id", employeeId);
  const { data } = await q;
  return (data ?? []) as LeadRef[];
}

// ------------------------------------------------------------------------------------------------------------- events
/** A rep sent this person an email. Logs it, moves a new lead forward, and schedules the follow-up. */
export async function recordEmailSent(db: Db, a: { employeeId: string; email: string; subject: string; stage: "cold" | "follow_up"; followUpDays?: number; now?: Date }): Promise<boolean> {
  const now = a.now ?? new Date();
  const [lead] = await leadsByEmail(db, a.email, a.employeeId);
  if (!lead) return false; // a one-off prospect that is not a lead: nothing to record
  await logActivity(db, { leadId: lead.id, employeeId: a.employeeId, type: "email_sent", summary: a.subject, details: { stage: a.stage } });
  const patch: Record<string, unknown> = { last_contacted_at: now.toISOString(), updated_at: now.toISOString() };
  if (lead.stage === "new") patch.stage = "contacted";
  if (lead.status === "new") patch.status = "attempted";
  await db.from("rep_leads").update(patch).eq("id", lead.id);
  // The email satisfied the old follow-up; schedule the next one.
  await closeOpenTasks(db, lead.id, "done", "email sent", ["follow_up"]);
  await createTask(db, { leadId: lead.id, employeeId: a.employeeId, title: `Follow up with ${lead.full_name}`, dueAt: addWorkingDays(now, a.followUpDays ?? DEFAULT_CRM_SETTINGS.followUpBusinessDays), kind: "follow_up", auto: true });
  return true;
}

/** This person replied. Logs it, stops follow-ups, and asks the rep to respond. An opt-out or a decline closes everything. */
export async function recordReply(db: Db, a: { email: string; classification: string; snippet: string; replyId?: string; now?: Date }): Promise<number> {
  const now = a.now ?? new Date();
  if (a.classification === "out_of_office") return 0; // an auto-reply is not a conversation
  const leads = await leadsByEmail(db, a.email);
  /** One timeline entry per reply: a reply classified twice (rules, then AI or a human) updates its entry instead of adding another. */
  const logReply = async (leadId: string, summary: string, classification: string) => {
    if (a.replyId) {
      const { data: existing } = await db.from("rep_lead_activities").select("id").eq("lead_id", leadId).eq("type", "email_reply").eq("details->>reply_id", a.replyId).maybeSingle();
      if (existing) {
        await db.from("rep_lead_activities").update({ summary: summary.slice(0, 1000), details: { classification, reply_id: a.replyId } }).eq("id", existing.id);
        return;
      }
    }
    await logActivity(db, { leadId, type: "email_reply", summary, details: { classification, ...(a.replyId ? { reply_id: a.replyId } : {}) } });
  };
  for (const lead of leads) {
    if (a.classification === "bounce") {
      // The address did not work: note it (it lowers the score) and stop chasing it, but nobody needs to "reply".
      await logReply(lead.id, "Email bounced: the address did not receive it", "bounce");
      await closeOpenTasks(db, lead.id, "cancelled", "email bounced", ["follow_up"]);
      continue;
    }
    await logReply(lead.id, a.snippet.slice(0, 300), a.classification);
    await closeOpenTasks(db, lead.id, "cancelled", "they replied", ["follow_up"]);
    const patch: Record<string, unknown> = { updated_at: now.toISOString() };
    if (a.classification === "opt_out") {
      await closeOpenTasks(db, lead.id, "cancelled", "asked not to be contacted");
      patch.status = "unqualified";
    } else if (a.classification === "not_interested") {
      await closeOpenTasks(db, lead.id, "cancelled", "not interested");
      patch.status = "unqualified";
    } else {
      patch.status = a.classification === "interested" ? "interested" : "connected";
      if (lead.stage === "new") patch.stage = "contacted";
      await createTask(db, { leadId: lead.id, employeeId: lead.employee_id, title: `Reply to ${lead.full_name}`, dueAt: new Date(now.getTime() + 4 * 3_600_000), kind: "respond", auto: true });
    }
    await db.from("rep_leads").update(patch).eq("id", lead.id);
  }
  return leads.length;
}

/** This person booked a call (credited to this rep). Moves the lead to "meeting booked" and schedules the preparation. */
export async function recordBooking(db: Db, a: { employeeId: string; email: string; slotStart: Date; now?: Date }): Promise<boolean> {
  const now = a.now ?? new Date();
  const [lead] = await leadsByEmail(db, a.email, a.employeeId);
  if (!lead) return false;
  await logActivity(db, { leadId: lead.id, type: "booking", summary: "Booked a 30-minute call", details: { slotStart: a.slotStart.toISOString() } });
  const patch: Record<string, unknown> = { status: "connected", updated_at: now.toISOString() };
  if (["new", "contacted"].includes(lead.stage)) patch.stage = "meeting_booked";
  await db.from("rep_leads").update(patch).eq("id", lead.id);
  await closeOpenTasks(db, lead.id, "cancelled", "they booked", ["follow_up", "respond"]);
  const prep = new Date(Math.max(now.getTime() + 3_600_000, a.slotStart.getTime() - 24 * 3_600_000));
  await createTask(db, { leadId: lead.id, employeeId: lead.employee_id, title: `Prepare for the call with ${lead.full_name}`, dueAt: prep, kind: "prepare_call", auto: true });
  return true;
}

/** A stage change made by a rep or an admin. Won and lost close the open tasks. */
export async function recordStageChange(db: Db, a: { leadId: string; from: string; to: string; actorId?: string | null; reason?: string | null }): Promise<void> {
  if (a.from === a.to) return;
  await logActivity(db, { leadId: a.leadId, employeeId: a.actorId ?? null, type: "stage_change", summary: `Stage: ${a.from} → ${a.to}${a.reason ? ` (${a.reason})` : ""}`, details: { from: a.from, to: a.to, reason: a.reason ?? null } });
  if (a.to === "won" || a.to === "lost") await closeOpenTasks(db, a.leadId, "cancelled", `lead ${a.to}`);
}

export async function recordStatusChange(db: Db, a: { leadId: string; from: string; to: string; actorId?: string | null; reason?: string | null }): Promise<void> {
  if (a.from === a.to) return;
  const summary = `Status: ${a.from} → ${a.to}${a.reason ? ` (${a.reason})` : ""}`;
  await logActivity(db, { leadId: a.leadId, employeeId: a.actorId ?? null, type: "status_change", outcome: a.to === "unqualified" ? "unqualified" : undefined, summary, details: { from: a.from, to: a.to, reason: a.reason ?? null } });
}

/** Run a CRM event without ever letting it break the caller (sending an email, saving a booking). */
export async function safely<T>(what: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    log("warn", { message: `CRM: ${what} failed`, error: e });
    return null;
  }
}
