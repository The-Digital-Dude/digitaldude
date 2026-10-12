import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { messageEditBody } from "@/lib/acquisition/validation";
import { draftComplianceIssues } from "@/lib/acquisition/compliance/templates";
import { unsubscribeUrlFor, unsubscribeSecret } from "@/lib/acquisition/env";
import { createUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** Reviewer edits a draft. The mandatory footer must survive; the database blocks edits after approval. */
export const PATCH = adminRoute<{ id: string }>("edit message", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, messageEditBody);
  if ("error" in body) return body.error;

  const { data: msg } = await db
    .from("acq_email_messages")
    .select("id,status,campaign_lead_id, acq_campaign_leads(campaign_id, acq_contacts(email), acq_campaigns(sender_name,sender_business,sender_postal_address,sender_email))")
    .eq("id", params.id)
    .maybeSingle();
  if (!msg) return jsonError("Message not found", 404);

  const lead = msg.acq_campaign_leads as unknown as { acq_contacts: { email: string }; acq_campaigns: { sender_name: string; sender_business: string; sender_postal_address: string; sender_email: string } };
  const issues = draftComplianceIssues(body.data, {
    unsubscribeUrl: unsubscribeUrlFor(createUnsubscribeToken(lead.acq_contacts.email, unsubscribeSecret())),
    sender: lead.acq_campaigns,
  });
  if (issues.length) return jsonError("Edit would remove required content", 422, { issues });

  must(await db.from("acq_email_messages").update({ subject: body.data.subject, body: body.data.body }).eq("id", params.id).select("id"), "edit message");
  return NextResponse.json({ ok: true });
});
