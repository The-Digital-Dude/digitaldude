import { must, type Db } from "../db";
import { resolveAiProvider } from "../ai-config";
import { getBookingUrl } from "../providers/calendar";
import { firstNameOf, generateObservation } from "./draft";
import { buildFooter, renderMessage } from "../compliance/templates";
import { composeEmail, loadComposeContext, type ComposedEmail } from "./compose";
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
  /** Write each email with the AI from the verified research (a person still reviews and approves every draft). */
  ai_compose?: boolean;
  followup_enabled?: boolean;
}

/**
 * Creates one campaign lead and its personalised draft for a contact.
 * Order matters: everything that can fail without side effects (secret check,
 * AI, rendering) happens first; the lead is removed again if the draft insert fails.
 */
export async function buildLeadDraft(db: Db, campaign: CampaignRow, contactId: string): Promise<{ leadId: string; messageId: string }> {
  const secret = unsubscribeSecret(); // fail before touching anything if signing isn't configured

  const contact = must(
    await db.from("acq_contacts").select("id,name,email,company_id, acq_companies(name,industry,country)").eq("id", contactId).single(),
    "load contact"
  );
  const companyInfo = contact.acq_companies as unknown as { name: string; industry: string | null; country: string | null } | null;
  const companyName = companyInfo?.name ?? "";

  let signals: { claim: string; evidence: string; sourceUrl: string }[] = [];
  if (contact.company_id) {
    const rows = must(
      await db.from("acq_research_records").select("observed_fact,evidence_excerpt,source_url,strength").eq("company_id", contact.company_id).order("strength", { ascending: false }).limit(4),
      "load research"
    );
    signals = rows.map((r: { observed_fact: string; evidence_excerpt: string; source_url: string }) => ({ claim: r.observed_fact, evidence: r.evidence_excerpt, sourceUrl: r.source_url }));
  }

  const observation = await generateObservation(await resolveAiProvider(db), companyName, signals, { industry: companyInfo?.industry, country: companyInfo?.country });
  const unsubscribeUrl = unsubscribeUrlFor(createUnsubscribeToken(contact.email, secret));
  const rendered = renderMessage(
    campaign,
    campaign.body_template,
    { first_name: firstNameOf(contact.name), company_name: companyName || "your business", observation, booking_url: getBookingUrl() ?? "" },
    unsubscribeUrl
  );
  let { subject, body } = rendered;

  // AI-written email (and follow-up) from the contact's verified research. If the AI is off, fails, or breaks a rule, the
  // normal template above is used, so a draft always exists. The system footer and signed unsubscribe link are appended here.
  let composed: ComposedEmail | null = null;
  if (campaign.ai_compose) {
    const ai = await resolveAiProvider(db);
    const ctx = await loadComposeContext(db, contactId);
    composed = ai && ctx ? await composeEmail(ai, ctx, { senderName: campaign.sender_name, withFollowUp: !!campaign.followup_enabled }) : null;
    if (composed) {
      subject = composed.subject;
      body = `${composed.body}\n\nRegards,\n${campaign.sender_name}\n\n${buildFooter(campaign, unsubscribeUrl)}`;
    }
  }

  // The database rejects ineligible/suppressed contacts and non-draft campaigns here.
  const lead = must(
    await db
      .from("acq_campaign_leads")
      .insert({
        campaign_id: campaign.id,
        contact_id: contactId,
        // Reviewed and approved together with the first email (it is part of the campaign approval hash).
        ...(composed?.followupBody ? { followup_subject: `Following up: ${composed.subject}`.slice(0, 200), followup_body: `${composed.followupBody}\n\nRegards,\n${campaign.sender_name}\n\n${buildFooter(campaign, unsubscribeUrl)}` } : {}),
      })
      .select("id")
      .single(),
    "add lead"
  );
  const msg = await db.from("acq_email_messages").insert({ campaign_lead_id: lead.id, kind: "initial", subject, body }).select("id").single();
  if (msg.error) {
    await db.from("acq_campaign_leads").delete().eq("id", lead.id);
    throw new Error(`create draft: ${msg.error.message}`);
  }
  await logAudit(db, "draft.created", "campaign", campaign.id, { leadId: lead.id, messageId: msg.data.id, usedAiObservation: observation !== "", aiComposed: !!composed, aiFollowUp: !!composed?.followupBody });
  return { leadId: lead.id, messageId: msg.data.id };
}
