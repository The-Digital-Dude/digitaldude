import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendBrevoEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
}

const DEFAULT_SENDER_NAME = "The Digital Dude";
const DEFAULT_SENDER_EMAIL = "info@digitaldude.co.uk";

/**
 * Sends a transactional email using Brevo (formerly Sendinblue) API v3.
 * Fallbacks to Resend if RESEND_API_KEY is present, or logs if in local dev without keys.
 */
export async function sendBrevoEmail(params: SendBrevoEmailParams): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

  const sender = {
    name: params.senderName || DEFAULT_SENDER_NAME,
    email: params.senderEmail || DEFAULT_SENDER_EMAIL,
  };

  if (apiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender,
          to: params.to,
          subject: params.subject,
          htmlContent: params.htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        log("error", { message: "Brevo API error", error: data });
        return { ok: false, error: data.message || "Brevo failed to send email." };
      }

      log("info", { message: "Brevo email sent successfully", context: { messageId: data.messageId, to: params.to } });
      return { ok: true, messageId: data.messageId };
    } catch (err) {
      log("error", { message: "Network error sending Brevo email", error: err });
      return { ok: false, error: (err as Error).message };
    }
  }

  // Fallback to Resend if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${sender.name} <${sender.email}>`,
          to: params.to.map((t) => t.email),
          subject: params.subject,
          html: params.htmlContent,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return { ok: true, messageId: data.id };
      }
    } catch {
      // ignore
    }
  }

  // Local development / simulated send
  log("info", {
    message: "Email simulated (no BREVO_API_KEY found in .env.local)",
    context: { to: params.to, subject: params.subject },
  });
  return { ok: true, messageId: `simulated-${Date.now()}` };
}

/**
 * HTML Email Wrapper with The Digital Dude branding
 */
export function wrapInEmailTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a4e; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fa; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e6ff; box-shadow: 0 4px 12px rgba(26, 26, 78, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #1a1a4e; padding: 28px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-weight: 900; font-size: 14px; padding: 6px 12px; border-radius: 8px; letter-spacing: 0.5px;">DD</span>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin-left: 10px; vertical-align: middle;">The Digital Dude</span>
                  </td>
                  <td align="right">
                    <span style="color: #a5a4cf; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">UK & Australia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fcfbfe; padding: 24px 36px; border-top: 1px solid #f0eeff; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b6b90; line-height: 1.6;">
                <strong>The Digital Dude Ltd</strong> · Bespoke Web Applications, CRMs & Cloud Architecture<br>
                London, United Kingdom & Sydney, Australia<br>
                <a href="${SITE_URL}" style="color: #7b61ff; text-decoration: none; font-weight: 600;">digitaldude.co.uk</a> · 
                <a href="mailto:info@digitaldude.co.uk" style="color: #7b61ff; text-decoration: none; font-weight: 600;">info@digitaldude.co.uk</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 4 Pre-Built Agency Email Templates
 */
export const EMAIL_TEMPLATES = [
  {
    id: "proposal_delivery",
    name: "📄 Proposal & Architecture Spec Delivery",
    defaultSubject: "Technical Architecture Specification & Project Scope — {{company_name}} × The Digital Dude",
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      projectTitle?: string;
      proposalSlug?: string;
      scopeSummary?: string;
      budgetRange?: string;
      targetTimeline?: string;
    }) => {
      const proposalUrl = `${SITE_URL}/proposals/${params.proposalSlug || "TDD-SPEC-DEMO-2026"}`;
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Your Project Architecture Specification is Ready, ${params.clientName.split(" ")[0]}!
        </h1>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          Following our discussion, our technical architecture team has drafted a comprehensive, bespoke technical specification and milestone roadmap for <strong style="color: #1a1a4e;">${params.companyName}</strong>.
        </p>

        <!-- Spec Summary Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f5ff; border: 1px solid #dfdcff; border-radius: 12px; margin-bottom: 24px; padding: 20px;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #7b61ff; text-transform: uppercase; letter-spacing: 1px;">Specification Summary</p>
              <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #1a1a4e;">${params.projectTitle || "Custom Web System Architecture"}</h2>
              <p style="margin: 0 0 14px 0; font-size: 13px; color: #4a4a75; line-height: 1.5;">${params.scopeSummary || "End-to-end bespoke operational software replacing manual workflows."}</p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid #e8e5ff; padding-top: 12px;">
                <tr>
                  <td width="50%" style="font-size: 12px; color: #6b6b90;">Target Timeline: <strong style="color: #1a1a4e;">${params.targetTimeline || "4–8 Weeks"}</strong></td>
                  <td width="50%" style="font-size: 12px; color: #6b6b90;">IP Ownership: <strong style="color: #059669;">100% Client Owned</strong></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Primary CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
          <tr>
            <td align="center">
              <a href="${proposalUrl}" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(123, 97, 255, 0.25);">
                Review & Download Architecture Spec (PDF) →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #4a4a75;">
          You can print or save this specification directly as a PDF from the page, or share the private link with your executive team.
        </p>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4a4a75;">
          Please review the deliverable modules and let us know if any milestone adjustments are required before we lock in the sprint schedule.
        </p>
      `;
      return wrapInEmailTemplate("Project Architecture Specification", content);
    },
  },
  {
    id: "discovery_followup",
    name: "📞 Discovery Call Follow-up & Next Steps",
    defaultSubject: "Great speaking today, {{first_name}} — Next steps for {{company_name}}",
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      customNotes?: string;
    }) => {
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Great speaking with you today, ${params.clientName.split(" ")[0]}!
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          Thank you for taking the time to walk us through the operational challenges and growth vision for <strong style="color: #1a1a4e;">${params.companyName}</strong>.
        </p>

        ${
          params.customNotes
            ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #7b61ff; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #333366; line-height: 1.5;">
            ${params.customNotes.replace(/\n/g, "<br>")}
          </div>`
            : ""
        }

        <h2 style="margin: 20px 0 10px 0; font-size: 15px; font-weight: 700; color: #1a1a4e;">Our Next Steps:</h2>
        <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; color: #4a4a75; line-height: 1.7;">
          <li>Our architecture team is finalizing the module deliverable matrix and database schema.</li>
          <li>We will deliver your bespoke Technical Specification & Milestone Proposal within 24–48 hours.</li>
          <li>We will schedule a quick 15-minute alignment call to review wireframe concepts before kickoff.</li>
        </ul>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4a4a75;">
          If you have any extra documentation, spreadsheet samples, or workflow diagrams to share in the meantime, simply reply directly to this email.
        </p>
      `;
      return wrapInEmailTemplate("Discovery Call Follow-up", content);
    },
  },
  {
    id: "proposal_checkin",
    name: "⏱️ Proposal Review & Scheduling Check-in",
    defaultSubject: "Checking in on your architecture specification — {{company_name}}",
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      proposalSlug?: string;
    }) => {
      const proposalUrl = `${SITE_URL}/proposals/${params.proposalSlug || "TDD-SPEC-DEMO-2026"}`;
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Checking in on your proposal, ${params.clientName.split(" ")[0]}
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          I wanted to check in and see if you and the team at <strong style="color: #1a1a4e;">${params.companyName}</strong> had a chance to review the architecture specification we prepared for you.
        </p>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          You can access your interactive proposal anytime here:
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${proposalUrl}" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px;">
                Open Specification & Scope Brief →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4a4a75;">
          We are currently booking engineering sprint slots for the upcoming month. If you’d like to discuss any scope refinements or payment structuring, let me know!
        </p>
      `;
      return wrapInEmailTemplate("Proposal Review Check-in", content);
    },
  },
  {
    id: "custom",
    name: "✉️ Custom Direct Message",
    defaultSubject: "Update regarding your project — {{company_name}}",
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      customMessage?: string;
    }) => {
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Hello ${params.clientName.split(" ")[0]},
        </h1>
        <div style="font-size: 14px; line-height: 1.7; color: #333366; margin-bottom: 24px;">
          ${(params.customMessage || "We have an update regarding your software project.")
            .replace(/\n/g, "<br>")}
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b6b90;">
          Warm regards,<br>
          <strong style="color: #1a1a4e;">The Digital Dude Team</strong>
        </p>
      `;
      return wrapInEmailTemplate("Message from The Digital Dude", content);
    },
  },
];
