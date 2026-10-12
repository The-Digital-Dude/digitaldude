import { must, type Db } from "../db";
import { getAiProvider } from "../providers/ai";
import { getBookingUrl } from "../providers/calendar";
import { firstNameOf, generateObservation } from "./draft";
import { renderMessage } from "../compliance/templates";
import { createUnsubscribeToken } from "../compliance/unsubscribe-token";
import { unsubscribeSecret, unsubscribeUrlFor } from "../env";
import { logAudit } from "../audit";

interface CampaignRow {
  id: string;
  sender_name: string;
  sender_business: string;
  sender_postal_address: string;
  sender_email: string;
  subject_template: string;
  body_template: string;
}

/**
 * Creates one campaign lead and its personalised draft for a contact.
 * Order matters: everything that can fail without side effects (secret check,
 * AI, rendering) happens first; the lead is removed again if the draft insert fails.
 */
export async function buildLeadDraft(db: Db, campaign: CampaignRow, contactId: string): Promise<{ leadId: string; messageId: string }> {
  const secret = unsubscribeSecret(); // fail before touching anything if signing isn't configured

  const contact = must(
    await db.from("acq_contacts").select("id,name,email,company_id, acq_companies(name)").eq("id", contactId).single(),
    "load contact"
  );
  const companyName = (contact.acq_companies as unknown as { name: string } | null)?.name ?? "";

  let signals: { claim: string; evidence: string; sourceUrl: string }[] = [];
  if (contact.company_id) {
    const rows = must(
      await db.from("acq_research_records").select("observed_fact,evidence_excerpt,source_url,strength").eq("company_id", contact.company_id).order("strength", { ascending: false }).limit(4),
      "load research"
    );
    signals = rows.map((r: { observed_fact: string; evidence_excerpt: string; source_url: string }) => ({ claim: r.observed_fact, evidence: r.evidence_excerpt, sourceUrl: r.source_url }));
  }

  const observation = await generateObservation(getAiProvider(), companyName, signals);
  const unsubscribeUrl = unsubscribeUrlFor(createUnsubscribeToken(contact.email, secret));
  const { subject, body } = renderMessage(
    campaign,
    campaign.body_template,
    { first_name: firstNameOf(contact.name), company_name: companyName || "your business", observation, booking_url: getBookingUrl() ?? "" },
    unsubscribeUrl
  );

  // The database rejects ineligible/suppressed contacts and non-draft campaigns here.
  const lead = must(await db.from("acq_campaign_leads").insert({ campaign_id: campaign.id, contact_id: contactId }).select("id").single(), "add lead");
  const msg = await db.from("acq_email_messages").insert({ campaign_lead_id: lead.id, kind: "initial", subject, body }).select("id").single();
  if (msg.error) {
    await db.from("acq_campaign_leads").delete().eq("id", lead.id);
    throw new Error(`create draft: ${msg.error.message}`);
  }
  await logAudit(db, "draft.created", "campaign", campaign.id, { leadId: lead.id, messageId: msg.data.id, usedAiObservation: observation !== "" });
  return { leadId: lead.id, messageId: msg.data.id };
}
