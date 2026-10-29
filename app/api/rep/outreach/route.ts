import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep, getOnboardedRep, repAccessDenial } from "@/lib/repAuth";
import { assertCanEmail, assertEmailDeliverable, assertPoolContactAllowed, OutreachBlockedError, repUnsubscribeApiUrl, repUnsubscribeUrl } from "@/lib/outreachGate";
import { sendBrevoEmail } from "@/lib/emailBrevo";
import { buildRepEmail, contactInfoForEmail, resolveDesign, type RepEmployee } from "@/lib/repEmail";
import { createBookLink } from "@/lib/bookLinks";
import { recordEmailSent, safely } from "@/lib/crm/activity";
import { refreshScoresForEmail } from "@/lib/crm/refresh";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";
import { recordRepAuditLog } from "@/lib/repAudit";
import { repCapacity } from "@/lib/crm/sendLimits";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const repSession = await getAuthenticatedRep(request);
  if (!repSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data: logs, error } = await supabase
      .from("rep_outreach_logs")
      .select("*")
      .eq("employee_id", repSession.id)
      .order("sent_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, logs: logs || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const repSession = await getOnboardedRep(request);
  if (!repSession) {
    const denial = await repAccessDenial(request);
    return NextResponse.json({ ok: false, error: denial.error }, { status: denial.status });
  }

  // Rate limit: 60 emails per hour per rep to prevent abuse (the per-rep daily limits are the real control)
  const rl = rateLimit(`rep_outreach:${repSession.id}`, 60, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Hourly outreach limit reached. Please wait before sending more emails." },
      { status: 429 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { recipientEmail, recipientName, companyName, subject, message, templateUsed, forceSend } = body;
    // Stage-wise: a first cold email carries the "Book a 30-minute call" button (with THIS rep's referral link); a follow-up is a
    // plain personal note by default. The rep can override the default with includeButton.
    const stage: "cold" | "follow_up" = body.stage === "follow_up" ? "follow_up" : "cold";
    const wantButton: boolean = typeof body.includeButton === "boolean" ? body.includeButton : stage === "cold";

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json(
        { ok: false, error: "Recipient email, subject, and message are required." },
        { status: 400 }
      );
    }

    const cleanRecipientEmail = String(recipientEmail).trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanRecipientEmail)) {
      return NextResponse.json({ ok: false, error: "Invalid recipient email address." }, { status: 400 });
    }

    // One shared do-not-contact list (unsubscribes, bounces, complaints, whole-domain opt-outs).
    try {
      await assertCanEmail(supabase, cleanRecipientEmail);
      await assertPoolContactAllowed(supabase, cleanRecipientEmail, repSession.id);
      await assertEmailDeliverable(supabase, cleanRecipientEmail, { allowRisky: body.confirmRisky === true });
    } catch (e) {
      if (e instanceof OutreachBlockedError) {
        // A risky address is a warning the rep can confirm; everything else is a hard stop.
        if (e.reason === "email_risky") return NextResponse.json({ ok: false, riskyWarning: true, error: `${e.message} Send anyway?`, blocked: e.reason }, { status: 409 });
        return NextResponse.json({ ok: false, error: e.message, blocked: e.reason }, { status: 403 });
      }
      throw e;
    }

    // Fetch fresh employee data
    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, full_name, email, referral_code, assigned_outreach_email, outreach_display_name, role_title, daily_outreach_limit, photo_url")
      .eq("id", repSession.id)
      .single();

    if (empErr || !employee) {
      return NextResponse.json({ ok: false, error: "Employee account not found." }, { status: 404 });
    }

    // Enforce the rep's daily limit for THIS kind of email. Cold and follow-ups are counted separately (rolling 24 hours), so cold
    // outreach can never use up the follow-up quota. The limit may be lower than the rep's maximum while they are warming up.
    const capacity = await repCapacity(supabase, employee.id).catch(() => null);
    const lane = capacity ? (stage === "follow_up" ? capacity.followUp : capacity.cold) : null;
    if (lane && lane.used >= lane.limit) {
      const kind = stage === "follow_up" ? "follow-up" : "cold outreach";
      return NextResponse.json(
        {
          ok: false,
          limitReached: stage,
          error: `Your daily ${kind} limit is reached (${lane.used}/${lane.limit} in the last 24 hours${capacity?.ramping ? `; it rises each week up to ${lane.max}` : ""}). It frees up as earlier emails pass 24 hours.`,
        },
        { status: 429 }
      );
    }

    // Check for duplicate recipients in last 14 days
    if (!forceSend && stage !== "follow_up") {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      // limit(1), not maybeSingle(): maybeSingle errors on 2+ rows, which silently disabled this check after a second send.
      const { data: duplicateRows } = await supabase
        .from("rep_outreach_logs")
        .select("id, sent_at, subject")
        .eq("employee_id", employee.id)
        .eq("recipient_email", cleanRecipientEmail)
        .gte("sent_at", fourteenDaysAgo)
        .order("sent_at", { ascending: false })
        .limit(1);
      const duplicateLog = duplicateRows?.[0];

      if (duplicateLog) {
        return NextResponse.json(
          {
            ok: false,
            duplicateWarning: true,
            error: `You already emailed ${cleanRecipientEmail} on ${new Date(
              duplicateLog.sent_at
            ).toLocaleDateString()}. Please confirm if you want to follow up.`,
          },
          { status: 409 }
        );
      }
    }

    const repRefCode = employee.referral_code || employee.id;
    const repOutreachLink = `${SITE_URL}/contact?ref=${repRefCode}`;

    // Admin-configured sender alias and display name (NO personal full name fallback)
    const senderEmail = (employee.assigned_outreach_email || "").trim() || "outreach@digitaldude.co.uk";
    const senderDisplayName = (employee.outreach_display_name || "").trim() || "The Digital Dude Partnerships";
    const senderName = senderDisplayName.includes("Digital Dude") 
      ? senderDisplayName 
      : `${senderDisplayName} | The Digital Dude`;
    const replyToEmail = "info@digitaldude.co.uk";

    const unsubscribeUrl = repUnsubscribeUrl(cleanRecipientEmail);
    const oneClickUrl = repUnsubscribeApiUrl(cleanRecipientEmail);

    // The design the rep picked (or the stage's default). The same builder renders the preview, so what they saw is what is sent.
    const design = resolveDesign(body.design, stage);
    const contactInfo = await contactInfoForEmail(supabase, cleanRecipientEmail).catch(() => ({ contactId: null, industry: null }));
    // The button opens a short private page (/b/<code>) personalised for this person, which credits THIS rep. If the link cannot be
    // created for any reason, the email still goes out with the plain referral link.
    const bookLink = wantButton
      ? await createBookLink(supabase, { employeeId: employee.id, contactId: contactInfo.contactId, recipientEmail: cleanRecipientEmail, recipientName: recipientName || null, companyName: companyName || null, industry: contactInfo.industry, stage, templateUsed: templateUsed || "custom", design })
      : null;
    const { html: emailHtml, text: emailText } = await buildRepEmail(supabase, {
      employee: employee as RepEmployee,
      subject,
      message: String(message),
      design,
      buttonUrl: wantButton ? (bookLink?.url ?? repOutreachLink) : null,
      unsubscribeUrl,
      industry: contactInfo.industry,
    });

    // Send email through Brevo
    const emailResult = await sendBrevoEmail({
      to: [{ email: cleanRecipientEmail, name: recipientName || cleanRecipientEmail }],
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: replyToEmail, name: "The Digital Dude" },
      subject,
      htmlContent: emailHtml,
      textContent: emailText,
      ...(oneClickUrl ? { headers: { "List-Unsubscribe": `<${oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
    });

    if (!emailResult.ok) {
      log("error", { message: "Brevo rep outreach failed", error: emailResult.error });
      return NextResponse.json({ ok: false, error: emailResult.error || "Failed to send email." }, { status: 500 });
    }

    // Record outreach log
    const logRow = {
      employee_id: employee.id,
      recipient_email: cleanRecipientEmail,
      recipient_name: recipientName || null,
      company_name: companyName || null,
      subject,
      body_content: message,
      template_used: templateUsed || "custom",
    };
    let { data: logRecord, error: logError } = await supabase.from("rep_outreach_logs").insert({ ...logRow, stage }).select().single();
    if (logError) {
      // Migration 0043 (the stage column) may not be applied yet: still keep the log, or the daily limit would stop counting.
      ({ data: logRecord, error: logError } = await supabase.from("rep_outreach_logs").insert(logRow).select().single());
    }

    if (logError) {
      log("warn", { message: "Could not save rep outreach log", error: logError });
    }

    // CRM: put the email on the lead's timeline, move a new lead forward, and schedule the follow-up (never blocks the send).
    await safely("email sent", async () => {
      if (await recordEmailSent(supabase, { employeeId: employee.id, email: cleanRecipientEmail, subject, stage })) await refreshScoresForEmail(supabase, cleanRecipientEmail);
    });

    // A first email to a pool contact moves their company on to "contacted".
    try {
      const { data: poolContact } = await supabase.from("acq_contacts").select("company_id").eq("email_normalized", cleanRecipientEmail).maybeSingle();
      if (poolContact?.company_id) {
        await supabase.from("acq_companies").update({ pool_status: "contacted" }).eq("id", poolContact.company_id).eq("owner_employee_id", employee.id).in("pool_status", ["assigned", "needs_contact"]);
      }
    } catch (e) {
      log("warn", { message: "could not update pool status after send", error: e });
    }

    // Record in global Rep Audit Logs
    await recordRepAuditLog({
      employeeId: employee.id,
      actionType: "outreach_sent",
      description: `Sent cold outreach email to ${recipientName ? `${recipientName} (${cleanRecipientEmail})` : cleanRecipientEmail} via alias ${senderEmail} (${senderDisplayName}).`,
      targetIdentifier: cleanRecipientEmail,
      metadata: {
        subject,
        templateUsed: templateUsed || "custom",
        companyName: companyName || null,
        senderEmail,
        senderDisplayName,
        replyTo: replyToEmail,
      },
      ipAddress: ip,
    });

    log("info", {
      message: "Rep outreach email dispatched",
      context: { repId: employee.id, recipientEmail: cleanRecipientEmail },
    });

    return NextResponse.json({
      ok: true,
      message: `Outreach email sent to ${cleanRecipientEmail}`,
      log: logRecord,
    });
  } catch (error) {
    log("error", { message: "Rep outreach dispatch exception", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
