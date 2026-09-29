import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";
import { recordRepAuditLog } from "@/lib/repAudit";

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
  const repSession = await getAuthenticatedRep(request);
  if (!repSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 cold emails per hour per rep to prevent spam/abuse
  const rl = rateLimit(`rep_outreach:${repSession.id}`, 30, 60 * 60 * 1000);
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

    // Fetch fresh employee data
    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, full_name, email, referral_code, assigned_outreach_email, outreach_display_name, role_title, daily_outreach_limit")
      .eq("id", repSession.id)
      .single();

    if (empErr || !employee) {
      return NextResponse.json({ ok: false, error: "Employee account not found." }, { status: 404 });
    }

    // Enforce 24-hour daily outreach volume limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: sentLast24h } = await supabase
      .from("rep_outreach_logs")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .gte("sent_at", oneDayAgo);

    const dailyCap = Number(employee.daily_outreach_limit) || 50;
    if ((sentLast24h || 0) >= dailyCap) {
      return NextResponse.json(
        {
          ok: false,
          error: `Daily outreach limit reached (${sentLast24h}/${dailyCap} emails sent in the last 24 hours). Limit resets gradually.`,
        },
        { status: 429 }
      );
    }

    // Check for duplicate recipients in last 14 days
    if (!forceSend) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: duplicateLog } = await supabase
        .from("rep_outreach_logs")
        .select("id, sent_at, subject")
        .eq("employee_id", employee.id)
        .eq("recipient_email", cleanRecipientEmail)
        .gte("sent_at", fourteenDaysAgo)
        .maybeSingle();

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
    const replyToEmail = senderEmail;

    const formattedBody = message
      .split("\n\n")
      .map(
        (paragraph: string) =>
          `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">${paragraph.replace(
            /\n/g,
            "<br>"
          )}</p>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${formattedBody}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 20px 0;">
          <tr>
            <td>
              <a href="${repOutreachLink}" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 12px; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.25);">
                Book 30-Min Technical Discovery Call →
              </a>
            </td>
          </tr>
        </table>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1a1a4e;">${senderDisplayName}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #7b61ff; font-weight: 600;">${
            employee.role_title || "Outreach & Partnerships"
          } · The Digital Dude</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b6b90;">London · Sydney · Dhaka</p>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #6b6b90;">
            <a href="${SITE_URL}" style="color: #7b61ff; text-decoration: none;">digitaldude.co.uk</a>
          </p>
        </div>
      </div>
    `;

    // Send email through Brevo
    const emailResult = await sendBrevoEmail({
      to: [{ email: cleanRecipientEmail, name: recipientName || cleanRecipientEmail }],
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: replyToEmail, name: senderName },
      subject,
      htmlContent: wrapInEmailTemplate(subject, emailHtml),
    });

    if (!emailResult.ok) {
      log("error", { message: "Brevo rep outreach failed", error: emailResult.error });
      return NextResponse.json({ ok: false, error: emailResult.error || "Failed to send email." }, { status: 500 });
    }

    // Record outreach log
    const { data: logRecord, error: logError } = await supabase
      .from("rep_outreach_logs")
      .insert({
        employee_id: employee.id,
        recipient_email: cleanRecipientEmail,
        recipient_name: recipientName || null,
        company_name: companyName || null,
        subject,
        body_content: message,
        template_used: templateUsed || "custom",
      })
      .select()
      .single();

    if (logError) {
      log("warn", { message: "Could not save rep outreach log", error: logError });
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
