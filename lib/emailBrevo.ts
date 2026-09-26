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
  const logoUrl = `${SITE_URL}/logo-full-white.png`;
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
            <td style="background-color: #1a1a4e; padding: 24px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <a href="${SITE_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="The Digital Dude" height="30" style="height: 30px; width: auto; display: block; border: 0;" />
                    </a>
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
 * Converts plain text with paragraphs and bullet lines into responsive HTML
 */
export function formatEmailBodyToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (
        lines.length > 0 &&
        lines.every((l) => l.startsWith("- ") || l.startsWith("* ") || l.startsWith("• "))
      ) {
        const items = lines
          .map(
            (l) =>
              `<li style="margin-bottom: 6px; color: #4a4a75;">${l.replace(/^[-*•]\s*/, "")}</li>`
          )
          .join("");
        return `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">${items}</ul>`;
      }
      return `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">${block.replace(
        /\n/g,
        "<br>"
      )}</p>`;
    })
    .join("");
}

/**
 * 6 Pre-Built Agency Email Templates
 */
export const EMAIL_TEMPLATES = [
  {
    id: "inbound_welcome",
    name: "✨ New Inbound Lead Welcome & Intro",
    defaultSubject: "Thanks for reaching out, {{first_name}} — Next steps for {{company_name}}",
    defaultBody: `Thank you for reaching out to The Digital Dude regarding software architecture and digital systems for {{company_name}}.

Our engineering team has received your project inquiry and is reviewing your requirements.

What Happens Next:
- Initial Architecture Review: We evaluate your scope, database models, and target integrations.
- Discovery Call: A 30-minute scoping session to map milestones, tech stack, and deliverable timeline.
- Milestone Specification: We draft a comprehensive technical specification and fixed-cost proposal.

If you have an RFP, wireframe deck, or workflow document ready, please reply directly to this email with your files attached.`,
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      customNotes?: string;
      customMessage?: string;
    }) => {
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Thank you for reaching out, ${params.clientName.split(" ")[0]}!
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          We received your inquiry regarding software development and digital architecture for <strong style="color: #1a1a4e;">${params.companyName}</strong>. Our engineering leads are already reviewing your project requirements.
        </p>

        ${
          params.customNotes || params.customMessage
            ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #7b61ff; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #333366; line-height: 1.5;">
            ${(params.customNotes || params.customMessage || "").replace(/\n/g, "<br>")}
          </div>`
            : ""
        }

        <h2 style="margin: 20px 0 10px 0; font-size: 15px; font-weight: 700; color: #1a1a4e;">What Happens Next:</h2>
        <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; color: #4a4a75; line-height: 1.7;">
          <li><strong>Architecture Review:</strong> We analyze your functional scope, database models, and target integrations.</li>
          <li><strong>Discovery Call:</strong> A focused 30-minute scoping session to map milestones, tech stack, and deliverable timeline.</li>
          <li><strong>Interactive Specification:</strong> We produce a comprehensive milestone roadmap & fixed-pricing proposal.</li>
        </ul>

        <!-- Primary CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${SITE_URL}/contact" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 12px; box-shadow: 0 4px 10px rgba(123, 97, 255, 0.25);">
                Book Your 30-Min Discovery Call →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4a4a75;">
          If you already have an RFP, wireframe, or requirements doc ready, simply reply directly to this email with your files attached.
        </p>
      `;
      return wrapInEmailTemplate("New Inbound Lead Welcome", content);
    },
  },
  {
    id: "cold_outreach",
    name: "🚀 Cold Outreach & B2B Introduction",
    defaultSubject: "Streamlining operations & custom software architecture for {{company_name}}",
    defaultBody: `Hi {{first_name}},

I came across {{company_name}} and wanted to reach out directly.

At The Digital Dude, we partner with growing businesses to replace disconnected spreadsheets and legacy tools with high-performance, bespoke web applications and automated workflows.

Key Advantages:
- Bespoke Web Systems: Engineered specifically for your operational workflows.
- Process Automation: Eliminate manual data entry, fragmented apps, and admin overhead.
- 100% IP Ownership: Zero recurring seat licensing; complete ownership of your codebase.

Would you be open to a brief 30-minute discovery call next week to explore where custom software could accelerate your operations?`,
    buildHtml: (params: {
      clientName: string;
      companyName: string;
      customNotes?: string;
      customMessage?: string;
    }) => {
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
          Custom Software & Automation for ${params.companyName}
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          Hi ${params.clientName.split(" ")[0]},
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          I came across <strong style="color: #1a1a4e;">${params.companyName}</strong> and wanted to reach out directly. At <strong style="color: #1a1a4e;">The Digital Dude</strong>, we partner with ambitious teams to replace disconnected spreadsheets and legacy software with high-performance, bespoke web applications.
        </p>

        ${
          params.customNotes || params.customMessage
            ? `
          <div style="background-color: #f8f9fa; border-left: 4px solid #7b61ff; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #333366; line-height: 1.5;">
            ${(params.customNotes || params.customMessage || "").replace(/\n/g, "<br>")}
          </div>`
            : ""
        }

        <!-- Highlights Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f5ff; border: 1px solid #dfdcff; border-radius: 12px; margin-bottom: 24px; padding: 20px;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #7b61ff; text-transform: uppercase; letter-spacing: 1px;">How We Help Growing Teams</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #333366; line-height: 1.7;">
                <li><strong>Bespoke Web & Internal Systems:</strong> Engineered specifically for your exact operations.</li>
                <li><strong>Process Automation:</strong> Eliminate repetitive manual entry, errors, and administrative bottlenecks.</li>
                <li><strong>100% Client IP Ownership:</strong> Zero restrictive recurring seat licenses; full ownership of your code.</li>
              </ul>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
          Would you be open to a brief 30-minute discovery call next week to explore where bespoke tooling could accelerate your operations?
        </p>

        <!-- Primary CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${SITE_URL}/contact" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 12px; box-shadow: 0 4px 10px rgba(123, 97, 255, 0.25);">
                Schedule a 30-Min Discovery Call →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b6b90;">
          Or feel free to reply directly to this email with your current operational priorities.
        </p>
      `;
      return wrapInEmailTemplate("Bespoke Software Architecture Intro", content);
    },
  },
  {
    id: "discovery_followup",
    name: "📞 Discovery Call Follow-up & Next Steps",
    defaultSubject: "Great speaking today, {{first_name}} — Next steps for {{company_name}}",
    defaultBody: `Thank you for taking the time to walk us through the operational challenges and growth vision for {{company_name}}.

Our Next Steps:
- Our architecture team is finalizing the module deliverable matrix and database schema.
- We will deliver your bespoke Technical Specification & Milestone Proposal within 24–48 hours.
- We will schedule a quick 15-minute alignment call to review wireframe concepts before kickoff.

If you have any extra documentation, spreadsheet samples, or workflow diagrams to share in the meantime, simply reply directly to this email.`,
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
    id: "proposal_delivery",
    name: "📄 Proposal & Architecture Spec Delivery",
    defaultSubject: "Technical Architecture Specification & Project Scope — {{company_name}} × The Digital Dude",
    defaultBody: `Following our discussion, our technical architecture team has drafted a comprehensive, bespoke technical specification and milestone roadmap for {{company_name}}.

Key Scope Highlights:
- Milestone 1: Core Database Architecture, Authentication & Role-Based Access Control.
- Milestone 2: Automated Workflows, Real-Time API Integrations & Admin Control Room.
- Milestone 3: Security Hardening, QA Testing & Production Deployment.

You can review and download the interactive specification (PDF) from your private client link. Please let us know if any milestone adjustments are required before we lock in the sprint schedule.`,
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
    id: "proposal_checkin",
    name: "⏱️ Proposal Review & Scheduling Check-in",
    defaultSubject: "Checking in on your architecture specification — {{company_name}}",
    defaultBody: `I wanted to check in and see if you and the team at {{company_name}} had a chance to review the architecture specification we prepared for you.

We are currently booking engineering sprint slots for the upcoming month. If you'd like to discuss any scope refinements, milestone adjustments, or payment structuring, please let me know!`,
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
    defaultBody: `Hello {{first_name}},

Thank you for reaching out to The Digital Dude. We are excited about the opportunity to partner with {{company_name}}.

Please let us know if you have any questions or when you are available for a brief sync.`,
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
