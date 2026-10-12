import { must, type Db } from "../db";
import { getEmailProvider, listUnsubscribeHeaders, ProviderRejectedError, type EmailProvider } from "../providers/email";
import { reserveSend } from "../compliance/suppression";
import { createUnsubscribeToken } from "../compliance/unsubscribe-token";
import { brevoSenderEmail, isAllowedRecipient, unsubscribeSecret, unsubscribeUrlFor } from "../env";
import { logAudit } from "../audit";
import { notify } from "../providers/notifications";
import { enqueueJob } from "./enqueue";
import { log } from "@/lib/logger";
import type { Job } from "./worker";

type Reserve = (db: Db, messageId: string) => Promise<{ ok: true } | { ok: false; reason: string }>;

export interface SendDeps {
  provider?: EmailProvider;
  reserve?: Reserve;
  allowlist?: string[] | null;
  senderEmail?: string | null;
}

export type SendOutcome =
  | { status: "sent"; providerMessageId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string }
  | { status: "unknown"; reason: string };

/** Sydney calendar-day key (matches the day boundary used by acq_reserve_send's daily cap). */
export function sydneyDayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** UTC instant of the start of the current Sydney day. */
export function sydneyDayStart(now = new Date()): Date {
  const key = sydneyDayKey(now);
  const part = new Intl.DateTimeFormat("en-US", { timeZone: "Australia/Sydney", timeZoneName: "longOffset" })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT+10:00";
  const m = part.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMin = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 600;
  return new Date(Date.parse(`${key}T00:00:00Z`) - offsetMin * 60_000);
}

/**
 * Sends one approved message. The ONLY path to the provider: every call is gated by
 * reserveSend() (pause, approval hash, eligibility, suppression, consent, daily cap).
 * Never retries an ambiguous provider outcome — a duplicate cold email is worse than a missed one.
 */
export async function sendMessage(db: Db, messageId: string, deps: SendDeps = {}): Promise<SendOutcome> {
  const provider = deps.provider ?? getEmailProvider();
  const reserve = deps.reserve ?? reserveSend;
  const senderEmail = deps.senderEmail === undefined ? brevoSenderEmail() : deps.senderEmail;

  const msg = must(
    await db
      .from("acq_email_messages")
      .select("id,subject,body,kind,direction,status,campaign_lead_id, acq_campaign_leads(id,campaign_id,contact_id, acq_campaigns(sender_name,sender_email), acq_contacts(email))")
      .eq("id", messageId)
      .single(),
    "load message"
  );
  type Lead = { id: string; campaign_id: string; contact_id: string; acq_campaigns: { sender_name: string; sender_email: string }; acq_contacts: { email: string } };
  const lead = msg.acq_campaign_leads as unknown as Lead;
  const to = lead.acq_contacts.email;

  if (msg.kind !== "initial") return { status: "skipped", reason: "follow_ups_not_enabled" };
  if (!senderEmail) return { status: "skipped", reason: "sender_not_configured" };
  if (!isAllowedRecipient(to, deps.allowlist)) {
    await logAudit(db, "send.blocked_by_allowlist", "message", messageId, {});
    return { status: "skipped", reason: "not_in_allowlist" };
  }

  const gate = await reserve(db, messageId);
  if (!gate.ok) {
    await logAudit(db, "send.not_reserved", "message", messageId, { reason: gate.reason });
    return { status: "skipped", reason: gate.reason };
  }

  // From here the message is `sending`; every exit below must leave a definite state.
  try {
    const unsubscribeUrl = unsubscribeUrlFor(createUnsubscribeToken(to, unsubscribeSecret()));
    const { providerMessageId } = await provider.send({
      to,
      from: { name: lead.acq_campaigns.sender_name, email: senderEmail },
      replyTo: { name: lead.acq_campaigns.sender_name, email: lead.acq_campaigns.sender_email },
      subject: msg.subject,
      text: msg.body,
      headers: listUnsubscribeHeaders(unsubscribeUrl),
    });
    const now = new Date().toISOString();
    must(await db.from("acq_email_messages").update({ status: "sent", provider_message_id: providerMessageId, sent_at: now }).eq("id", messageId).select("id"), "mark sent");
    must(await db.from("acq_campaign_leads").update({ status: "sent", sequence_step: 1, last_message_at: now, next_action_at: null }).eq("id", lead.id).select("id"), "mark lead sent");
    await logAudit(db, "send.sent", "message", messageId, { providerMessageId });
    return { status: "sent", providerMessageId };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    if (e instanceof ProviderRejectedError) {
      await db.from("acq_email_messages").update({ status: "failed" }).eq("id", messageId);
      await logAudit(db, "send.failed", "message", messageId, { reason });
      await notify(`Acquisition send rejected by provider: ${reason.slice(0, 200)}`);
      return { status: "failed", reason };
    }
    // Ambiguous: leave `sending` (blocks any re-send) and ask a human to check the provider log.
    await logAudit(db, "send.outcome_unknown", "message", messageId, { reason });
    await notify(`Acquisition send outcome UNKNOWN for message ${messageId} (left in 'sending', not retried): ${reason.slice(0, 200)}`);
    return { status: "unknown", reason };
  }
}

/** Job handler: payload { messageId }. Non-sends are not errors, so they are not retried. */
export async function sendEmailJob(job: Job, db: Db): Promise<void> {
  const outcome = await sendMessage(db, String(job.payload.messageId));
  log("info", { message: "acquisition send_email", context: { jobId: job.id, outcome: outcome.status, reason: "reason" in outcome ? outcome.reason : undefined } });
}

/**
 * Called each worker tick: turns approved initial messages of ACTIVE campaigns into
 * send_email jobs, staggered a few minutes apart and capped by the campaign's remaining
 * daily allowance. acq_reserve_send() still enforces the real cap/rules at send time.
 */
export async function enqueueDueSends(db: Db, opts: { perTick?: number; now?: Date } = {}): Promise<number> {
  const now = opts.now ?? new Date();
  const paused = await db.from("acq_settings").select("value").eq("key", "sending_paused").maybeSingle();
  if (paused.error) throw new Error(`read pause flag: ${paused.error.message}`);
  if (paused.data?.value !== false) return 0; // fail closed: only an explicit `false` allows sending

  const campaigns = must(await db.from("acq_campaigns").select("id,daily_limit").eq("status", "active"), "load active campaigns");
  const dayStart = sydneyDayStart(now).toISOString();
  const dayKey = sydneyDayKey(now);
  let enqueued = 0;

  for (const c of campaigns as { id: string; daily_limit: number }[]) {
    const used = must(
      await db
        .from("acq_email_messages")
        .select("id, acq_campaign_leads!inner(campaign_id)")
        .eq("acq_campaign_leads.campaign_id", c.id)
        .eq("direction", "outbound")
        .gte("reserved_at", dayStart)
        .in("status", ["sending", "sent", "delivered", "bounced"]),
      "count today's sends"
    ).length;
    const room = Math.min(opts.perTick ?? 5, Math.max(0, c.daily_limit - used));
    if (room === 0) continue;

    const due = must(
      await db
        .from("acq_email_messages")
        .select("id, acq_campaign_leads!inner(campaign_id,status)")
        .eq("acq_campaign_leads.campaign_id", c.id)
        .eq("acq_campaign_leads.status", "approved")
        .eq("direction", "outbound")
        .eq("kind", "initial")
        .eq("status", "approved")
        .order("created_at", { ascending: true })
        .limit(room),
      "load due messages"
    ) as { id: string }[];

    let offsetMin = 0;
    for (const m of due) {
      offsetMin += 2 + Math.floor(Math.random() * 9); // 2-10 minutes between sends
      const r = await enqueueJob(db, {
        type: "send_email",
        payload: { messageId: m.id },
        idempotencyKey: `send:${m.id}:${dayKey}`,
        runAt: new Date(now.getTime() + offsetMin * 60_000),
        maxAttempts: 1,
      });
      if (r.created) enqueued++;
    }
  }
  return enqueued;
}
