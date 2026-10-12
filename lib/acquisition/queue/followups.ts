import { must, type Db } from "../db";
import { renderMessage } from "../compliance/templates";
import { createUnsubscribeToken } from "../compliance/unsubscribe-token";
import { unsubscribeSecret, unsubscribeUrlFor } from "../env";
import { getBookingUrl } from "../providers/calendar";
import { firstNameOf } from "../drafting/draft";
import { logAudit } from "../audit";
import { log } from "@/lib/logger";

interface CampaignRow {
  sender_name: string;
  sender_business: string;
  sender_postal_address: string;
  sender_email: string;
  subject_template: string;
  followup_body_template: string | null;
}

/**
 * Turns due leads into approved follow-up messages. The database decides who is due (delivered first email,
 * active campaign, enough business days, no real reply) and creates the row atomically; this only renders the
 * already-approved follow-up template with a fresh signed unsubscribe link. Sending still goes through
 * acq_reserve_send, so a reply, opt-out or pause that happens in between still stops it.
 */
export async function scheduleFollowUps(db: Db, opts: { now?: Date; limit?: number } = {}): Promise<number> {
  const due = must(await db.rpc("acq_due_followups", { p_now: (opts.now ?? new Date()).toISOString(), p_limit: opts.limit ?? 20 }), "find due follow-ups") as {
    lead_id: string;
    campaign_id: string;
    contact_id: string;
    initial_subject: string;
  }[];
  if (due.length === 0) return 0;

  const secret = unsubscribeSecret(); // fail before touching anything if signing isn't configured
  let created = 0;
  for (const d of due) {
    try {
      // A follow-up written by the AI at draft time was reviewed and approved with the first email (it is in the approval
      // hash): use it as is. Otherwise render the approved campaign template as before.
      const stored = await db.from("acq_campaign_leads").select("followup_subject,followup_body").eq("id", d.lead_id).maybeSingle();
      const pre = stored.data as { followup_subject: string | null; followup_body: string | null } | null;
      if (pre?.followup_body) {
        const ok = must(await db.rpc("acq_create_followup", { p_lead_id: d.lead_id, p_subject: pre.followup_subject || `Following up: ${d.initial_subject}`.slice(0, 200), p_body: pre.followup_body }), "create follow-up");
        if (ok === true) {
          created++;
          await logAudit(db, "followup.scheduled", "campaign", d.campaign_id, { leadId: d.lead_id, aiComposed: true });
        }
        continue;
      }
      const campaign = must(
        await db.from("acq_campaigns").select("sender_name,sender_business,sender_postal_address,sender_email,subject_template,followup_body_template").eq("id", d.campaign_id).single(),
        "load campaign"
      ) as CampaignRow;
      const contact = must(await db.from("acq_contacts").select("id,name,email, acq_companies(name)").eq("id", d.contact_id).single(), "load contact");
      const companyName = (contact.acq_companies as unknown as { name: string } | null)?.name ?? "";
      const unsubscribeUrl = unsubscribeUrlFor(createUnsubscribeToken(contact.email, secret));
      const { body } = renderMessage(
        campaign,
        campaign.followup_body_template ?? "",
        { first_name: firstNameOf(contact.name), company_name: companyName || "your business", observation: "", booking_url: getBookingUrl() ?? "" },
        unsubscribeUrl
      );
      const subject = `Following up: ${d.initial_subject}`.slice(0, 200);
      const ok = must(await db.rpc("acq_create_followup", { p_lead_id: d.lead_id, p_subject: subject, p_body: body }), "create follow-up");
      if (ok === true) {
        created++;
        await logAudit(db, "followup.scheduled", "campaign", d.campaign_id, { leadId: d.lead_id });
      }
    } catch (e) {
      // One bad lead must not block the others; it will be picked up again next tick.
      log("error", { message: "schedule follow-up failed", context: { leadId: d.lead_id }, error: e });
    }
  }
  return created;
}
