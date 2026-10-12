import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { approvalBody } from "@/lib/acquisition/validation";
import { checkCampaignCompliance, draftComplianceIssues } from "@/lib/acquisition/compliance/templates";
import { createUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { acqEnv, unsubscribeSecret, unsubscribeUrlFor } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/**
 * Approve (freeze) or reject a campaign. Authorization is the admin session,
 * checked server-side here; the approver is taken from the session's operator
 * identity, never from the request body. Approval is bound to the content hash
 * the reviewer saw, so editing a draft after the preview invalidates it.
 */
export const POST = adminRoute("approval", async (request, { db }) => {
  const body = await parseBody(request, approvalBody);
  if ("error" in body) return body.error;
  const actor = acqEnv().operatorName;
  const d = body.data;

  if (d.decision === "reject") {
    must(await db.rpc("acq_set_campaign_status", { p_campaign_id: d.campaignId, p_status: "rejected", p_actor: actor, p_reason: d.reason }), "reject");
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const { data: campaign } = await db.from("acq_campaigns").select("*").eq("id", d.campaignId).maybeSingle();
  if (!campaign) return jsonError("Campaign not found", 404);

  const issues: string[] = checkCampaignCompliance(campaign).map((i) => i.message);
  const secret = unsubscribeSecret();
  const leads = must(
    await db.from("acq_campaign_leads").select("id, acq_contacts(email), acq_email_messages(subject,body,kind,direction)").eq("campaign_id", d.campaignId),
    "load drafts"
  ) as unknown as { id: string; acq_contacts: { email: string }; acq_email_messages: { subject: string; body: string; kind: string; direction: string }[] }[];
  for (const lead of leads) {
    for (const m of lead.acq_email_messages.filter((x) => x.kind === "initial" && x.direction === "outbound")) {
      for (const msg of draftComplianceIssues(m, { unsubscribeUrl: unsubscribeUrlFor(createUnsubscribeToken(lead.acq_contacts.email, secret)), sender: campaign })) {
        issues.push(`${lead.acq_contacts.email}: ${msg}`);
      }
    }
  }
  if (issues.length) return jsonError("Campaign failed compliance checks", 422, { issues });

  must(await db.rpc("acq_approve_campaign", { p_campaign_id: d.campaignId, p_seen_hash: d.contentHash, p_actor: actor }), "approve");
  return NextResponse.json({ ok: true, status: "approved" });
});
