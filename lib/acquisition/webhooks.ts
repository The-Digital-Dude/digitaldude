import { must, type Db } from "./db";
import { suppressEmail } from "./compliance/suppression";
import { recordInboundReply, stopOutreach } from "./replies/process";
import type { InboundEmailEvent } from "./providers/email";
import { normalizeEmail } from "./normalize";

/**
 * Applies one provider event. Handlers are idempotent, and the event ledger makes
 * redelivery a no-op once processed (but retries one that crashed mid-way).
 */
export async function processEmailEvent(db: Db, provider: string, ev: InboundEmailEvent): Promise<"processed" | "duplicate"> {
  const ins = await db.from("acq_webhook_events").insert({ provider, event_id: ev.id, event_type: ev.type, payload: ev });
  if (ins.error) {
    if (ins.error.code !== "23505") throw new Error(`record webhook event: ${ins.error.message}`);
    const { data: seen } = await db.from("acq_webhook_events").select("processed_at").eq("provider", provider).eq("event_id", ev.id).single();
    if (seen?.processed_at) return "duplicate";
  }

  const email = normalizeEmail(ev.email);
  const { data: contact } = await db.from("acq_contacts").select("id").eq("email_normalized", email).maybeSingle();

  switch (ev.type) {
    case "delivered":
      if (ev.providerMessageId) {
        await db.from("acq_email_messages").update({ status: "delivered", delivered_at: ev.occurredAt ?? new Date().toISOString() }).eq("provider_message_id", ev.providerMessageId).in("status", ["sending", "sent"]);
      }
      break;
    case "bounced":
      if (ev.providerMessageId) {
        await db.from("acq_email_messages").update({ status: "bounced" }).eq("provider_message_id", ev.providerMessageId);
      }
      if (ev.bounceType === "hard") await suppressEmail(db, email, "hard_bounce", `webhook:${provider}:${ev.id}`);
      else if (contact) await stopOutreach(db, contact.id, "bounced", "soft bounce");
      break;
    case "complained":
      await suppressEmail(db, email, "spam_complaint", `webhook:${provider}:${ev.id}`);
      break;
    case "unsubscribed":
      await suppressEmail(db, email, "unsubscribe", `webhook:${provider}:${ev.id}`);
      break;
    case "replied":
      await recordInboundReply(db, { email, body: ev.body ?? "", providerEventId: `${provider}:${ev.id}`, inReplyToProviderMessageId: ev.providerMessageId, receivedAt: ev.occurredAt });
      break;
  }

  must(await db.from("acq_webhook_events").update({ processed_at: new Date().toISOString() }).eq("provider", provider).eq("event_id", ev.id).select("id"), "mark event processed");
  return "processed";
}
