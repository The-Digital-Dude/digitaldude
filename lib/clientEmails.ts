import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";
import { SITE_URL } from "@/lib/utils";

/**
 * Dispatches an Email OTP passcode for client login.
 */
export async function sendClientOtpEmail(params: { email: string; clientName: string; code: string; projectTitle: string }) {
  const firstName = params.clientName.trim().split(/\s+/)[0] || "there";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      Access Your Client Project Portal
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Hi ${firstName}, here is your single-use verification code to access the project tracking workspace for <strong>${params.projectTitle}</strong>:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7b61ff; background: #f4f0ff; border: 2px dashed #7b61ff66; padding: 12px 28px; border-radius: 16px;">
        ${params.code}
      </span>
    </div>

    <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6; color: #6b6b90;">
      This code will expire in <strong>15 minutes</strong>. If you did not request this login, you can safely ignore this email.
    </p>
  `;

  return sendBrevoEmail({
    to: [{ email: params.email, name: params.clientName }],
    subject: `Login Code: ${params.code} — ${params.projectTitle} Client Portal`,
    htmlContent: wrapInEmailTemplate("Client Portal Login", content),
  });
}

/**
 * Dispatches an initial project invite to the client stakeholder.
 */
export async function sendClientInviteEmail(params: { email: string; clientName: string; projectTitle: string; companyName?: string }) {
  const firstName = params.clientName.trim().split(/\s+/)[0] || "there";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      🚀 Your Project Workspace is Live!
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Hi ${firstName}, welcome to The Digital Dude! Your dedicated project tracking workspace for <strong>${params.projectTitle}</strong> is now live.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #1a1a4e;">
        <strong>Inside your portal, you can:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a4a75; line-height: 1.7;">
        <li>Track real-time engineering milestones &amp; delivery roadmaps.</li>
        <li>Access live staging environments, Figma boards, and API docs.</li>
        <li>Review weekly async video walkthroughs &amp; changelogs.</li>
        <li>Submit priority change requests and support tickets directly to our engineering team.</li>
      </ul>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 20px 0;">
      <tr>
        <td>
          <a href="${SITE_URL}/portal/login" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.25);">
            Access Client Portal →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #94a3b8;">
      Simply enter your email (<strong>${params.email}</strong>) to receive a one-click passcode.
    </p>
  `;

  return sendBrevoEmail({
    to: [{ email: params.email, name: params.clientName }],
    subject: `Welcome to Your Project Portal: ${params.projectTitle} — The Digital Dude`,
    htmlContent: wrapInEmailTemplate("Client Workspace Live", content),
  });
}

/**
 * Notifies client of new weekly changelog / milestone release.
 */
export async function sendClientProjectUpdateEmail(params: { email: string; clientName: string; projectTitle: string; updateTitle: string; summary: string }) {
  const firstName = params.clientName.trim().split(/\s+/)[0] || "there";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      📢 New Project Update: ${params.updateTitle}
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Hi ${firstName}, our engineering team just published a new progress update for <strong>${params.projectTitle}</strong>:
    </p>

    <div style="background-color: #f8fafc; border-left: 4px solid #7b61ff; border-radius: 12px; padding: 16px 20px; margin: 20px 0; font-size: 13px; color: #1a1a4e; line-height: 1.6;">
      ${params.summary.replace(/\n/g, "<br>")}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${SITE_URL}/portal/dashboard" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
            View Full Changelog &amp; Demo →
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendBrevoEmail({
    to: [{ email: params.email, name: params.clientName }],
    subject: `Project Update: ${params.updateTitle} — ${params.projectTitle}`,
    htmlContent: wrapInEmailTemplate("Engineering Update", content),
  });
}

/**
 * Alerts Admin when a client submits a support ticket or change request.
 */
export async function sendAdminTicketAlertEmail(params: {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  subject: string;
  category: string;
  urgency: string;
  description: string;
}) {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      🎫 New Client Support Ticket
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      A client has submitted a new inquiry / change request in the Client Portal:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 20px 0; font-size: 13px; color: #1a1a4e; line-height: 1.8;">
      <p style="margin: 0 0 6px 0;"><strong>Project:</strong> ${params.projectTitle}</p>
      <p style="margin: 0 0 6px 0;"><strong>Client:</strong> ${params.clientName} (<a href="mailto:${params.clientEmail}">${params.clientEmail}</a>)</p>
      <p style="margin: 0 0 6px 0;"><strong>Category:</strong> ${params.category.toUpperCase()}</p>
      <p style="margin: 0 0 6px 0;"><strong>Urgency:</strong> <span style="color: ${params.urgency === "critical" || params.urgency === "high" ? "#ef4444" : "#10b981"}; font-weight: 700;">${params.urgency.toUpperCase()}</span></p>
      <p style="margin: 12px 0 0 0; border-top: 1px solid #e2e8f0; padding-top: 10px;"><strong>Subject:</strong> ${params.subject}</p>
      <p style="margin: 6px 0 0 0; color: #4a4a75;">${params.description.replace(/\n/g, "<br>")}</p>
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${SITE_URL}/admin/projects" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
            Respond in Admin Projects Hub →
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendBrevoEmail({
    to: [{ email: "info@digitaldude.co.uk", name: "The Digital Dude Leadership" }],
    subject: `[Client Ticket - ${params.urgency.toUpperCase()}] ${params.subject} — ${params.projectTitle}`,
    htmlContent: wrapInEmailTemplate("Client Support Ticket", content),
  });
}
