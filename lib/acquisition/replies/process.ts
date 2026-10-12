import { must, UNIQUE_VIOLATION, type Db } from "../db";
import { suppressEmail } from "../compliance/suppression";
import { classifyByRules, type Classification, type ReplyClass } from "./classify";
import { enqueueJob } from "../queue/enqueue";
import { notify } from "../providers/notifications";
import { logAudit } from "../audit";
import { normalizeEmail } from "../normalize";

const ACTIVE_LEAD = ["draft", "approved", "sent", "follow_up_due"];

/** Stops every sequence for a contact and cancels any follow-up that hasn't gone out. */
export async function stopOutreach(db: Db, contactId: string, status: "replied" | "bounced" | "stopped", reason: string) {
  const { data: leads } = await db
    .from("acq_campaign_leads")
    .update({ status, stop_reason: reason, next_action_at: null })
    .eq("contact_id", contactId)
    .in("status", ACTIVE_LEAD)
    .select("id");
  const ids = (leads ?? []).map((l: { id: string }) => l.id);
  if (ids.length) {
    await db.from("acq_email_messages").update({ status: "cancelled" }).in("campaign_lead_id", ids).eq("direction", "outbound").in("status", ["draft", "approved"]);
    await db.from("acq_jobs").update({ status: "cancelled", last_error: reason }).in("campaign_lead_id", ids).in("status", ["pending", "running"]);
  }
}

export async function applyClassification(db: Db, replyId: string, cls: Classification, humanBy?: string) {
  const reply = must(await db.from("acq_replies").select("id,contact_id,classification").eq("id", replyId).single(), "load reply");
  const contact = must(await db.from("acq_contacts").select("id,email,name").eq("id", reply.contact_id).single(), "load contact");

  const needsHuman = !humanBy && (cls.classification === "interested" || cls.classification === "uncertain");
  must(
    await db
      .from("acq_replies")
      .update({
        classification: cls.classification,
        confidence: cls.confidence,
        classified_by: humanBy ? "human" : cls.by,
        human_review_status: humanBy ? "reviewed" : needsHuman ? "pending" : "not_required",
      })
      .eq("id", replyId)
      .select("id"),
    "update reply"
  );

  switch (cls.classification) {
    case "opt_out":
      await suppressEmail(db, contact.email, "reply_opt_out", `reply:${replyId}`);
      break;
    case "out_of_office":
      break; // not a conversation; the sequence continues
    case "bounce":
      await stopOutreach(db, contact.id, "bounced", "bounce notice received");
      break;
    default:
      // Any real reply ends automation. There is no automatic sending after a reply.
      await stopOutreach(db, contact.id, "replied", `reply: ${cls.classification}`);
  }

  await logAudit(db, "reply.classified", "reply", replyId, { classification: cls.classification, confidence: cls.confidence, by: humanBy ? "human" : cls.by }, humanBy ?? "system");
  if (!humanBy && (cls.classification === "interested" || cls.classification === "uncertain") && reply.classification !== cls.classification) {
    await notify(`${cls.classification === "interested" ? "Positive reply" : "Reply needs review"} from ${contact.name || contact.email} — open the inbox.`);
  }
}

/** Stores an inbound reply (idempotent on provider event id) and applies instant rule-based handling. */
export async function recordInboundReply(
  db: Db,
  a: { email: string; body: string; providerEventId?: string; inReplyToProviderMessageId?: string; receivedAt?: string }
): Promise<{ replyId: string } | null> {
  const { data: contact } = await db.from("acq_contacts").select("id").eq("email_normalized", normalizeEmail(a.email)).maybeSingle();
  if (!contact) return null;

  let messageId: string | null = null;
  if (a.inReplyToProviderMessageId) {
    const { data: msg } = await db.from("acq_email_messages").select("id").eq("provider_message_id", a.inReplyToProviderMessageId).maybeSingle();
    messageId = msg?.id ?? null;
  }

  const { data: reply, error } = await db
    .from("acq_replies")
    .insert({
      contact_id: contact.id,
      email_message_id: messageId,
      provider_event_id: a.providerEventId ?? null,
      body: a.body.slice(0, 20_000),
      received_at: a.receivedAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return null; // redelivered webhook
    throw new Error(`save reply: ${error.message}`);
  }

  // Safest default first: an unclassified reply already halts automation.
  const instant = classifyByRules(a.body);
  const cls: Classification = instant ?? { classification: "uncertain", confidence: 0, by: "rules" };
  await applyClassification(db, reply.id, cls);
  if (!instant) {
    await enqueueJob(db, { type: "classify_reply", payload: { replyId: reply.id }, idempotencyKey: `classify:${reply.id}` });
  }
  return { replyId: reply.id };
}

export type { ReplyClass };
