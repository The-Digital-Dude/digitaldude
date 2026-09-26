import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendBrevoEmail, EMAIL_TEMPLATES } from "@/lib/emailBrevo";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    toEmail,
    toName,
    companyName = "Client",
    templateId = "custom",
    customSubject,
    customMessage,
    proposalSlug,
    proposalId,
    bookingId,
    projectTitle,
    scopeSummary,
    budgetRange,
    targetTimeline,
  } = body || {};

  if (!toEmail) {
    return NextResponse.json({ ok: false, error: "Recipient email address is required." }, { status: 400 });
  }

  const template = EMAIL_TEMPLATES.find((t) => t.id === templateId) || EMAIL_TEMPLATES[0];

  // Interpolate subject
  let subject = customSubject || template.defaultSubject;
  subject = subject
    .replace(/{{company_name}}/g, companyName)
    .replace(/{{client_name}}/g, toName || "Client")
    .replace(/{{first_name}}/g, (toName || "Client").split(" ")[0]);

  // Build HTML
  let htmlContent = "";
  if (templateId === "proposal_delivery") {
    htmlContent = template.buildHtml({
      clientName: toName || "Client",
      companyName,
      projectTitle,
      proposalSlug,
      scopeSummary,
      budgetRange,
      targetTimeline,
    });
  } else if (templateId === "discovery_followup") {
    htmlContent = template.buildHtml({
      clientName: toName || "Client",
      companyName,
      customNotes: customMessage,
    });
  } else if (templateId === "proposal_checkin") {
    htmlContent = template.buildHtml({
      clientName: toName || "Client",
      companyName,
      proposalSlug,
    });
  } else {
    htmlContent = template.buildHtml({
      clientName: toName || "Client",
      companyName,
      customMessage,
    });
  }

  // Send via Brevo
  const result = await sendBrevoEmail({
    to: [{ email: toEmail, name: toName || companyName }],
    subject,
    htmlContent,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Failed to send email via Brevo." }, { status: 500 });
  }

  // Automatic CRM & Proposal status transition
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      // If proposal was sent, update proposal status to 'sent'
      if (proposalId || proposalSlug) {
        const query = proposalId
          ? supabase.from("proposals").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", proposalId)
          : supabase.from("proposals").update({ status: "sent", updated_at: new Date().toISOString() }).eq("slug", proposalSlug);
        await query;
      }

      // If booking was connected, update booking stage to 'proposal_sent'
      if (bookingId && (templateId === "proposal_delivery" || templateId === "proposal_checkin")) {
        await supabase
          .from("bookings")
          .update({
            stage: "proposal_sent",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      }
    } catch (err) {
      log("warn", { message: "CRM post-email update notice", error: err });
    }
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    subject,
  });
}
