import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";
import { SITE_URL } from "@/lib/utils";

/**
 * Recruiting & Candidate Lifecycle Email Utilities
 */

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

export interface ApplicationEmailCopy {
  subject: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const RECRUITING_STATUS_TEMPLATES: Record<
  string,
  (params: {
    applicantName: string;
    jobTitle: string;
    interviewBookingUrl?: string;
    meetingLink?: string;
  }) => ApplicationEmailCopy
> = {
  interview: ({ applicantName, jobTitle, interviewBookingUrl, meetingLink }) => ({
    subject: `Interview Invitation — ${jobTitle} at The Digital Dude`,
    heading: `Let's schedule an interview, ${firstName(applicantName)}!`,
    body: `We thoroughly reviewed your application and written test for the ${jobTitle} role, and we would love to invite you to a 30-minute interview with our team.\n\nPlease pick a time that suits your schedule using the link below.${
      meetingLink ? `\n\nMeeting link: ${meetingLink}` : ""
    }`,
    ctaText: interviewBookingUrl ? "Pick Interview Time Slot →" : undefined,
    ctaUrl: interviewBookingUrl || undefined,
  }),
  offered: ({ applicantName, jobTitle }) => ({
    subject: `Job Offer — ${jobTitle} at The Digital Dude`,
    heading: `Congratulations, ${firstName(applicantName)}!`,
    body: `We were thoroughly impressed with your background and interview performance, and we would like to offer you the role of ${jobTitle} at The Digital Dude!\n\nOur team will follow up directly with your formal agreement and onboarding documentation. In the meantime, please let us know if you have any immediate questions.`,
  }),
  rejected: ({ applicantName, jobTitle }) => ({
    subject: `Update on your application for ${jobTitle}`,
    heading: `Thank you for your interest, ${firstName(applicantName)}`,
    body: `Thank you for taking the time to apply for the ${jobTitle} role and for completing our assessment.\n\nWhile your qualifications are noteworthy, we have decided to move forward with other candidates who more closely align with our current operational requirements.\n\nWe appreciate your interest in The Digital Dude and wish you every success in your search.`,
  }),
  reviewing: ({ applicantName, jobTitle }) => ({
    subject: `Application Status Update — ${jobTitle}`,
    heading: `We're reviewing your application, ${firstName(applicantName)}`,
    body: `Your application for ${jobTitle} is currently under active review by our hiring team. We will be in touch shortly with next steps.`,
  }),
};

export async function sendApplicationReceivedEmail(params: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
}) {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      Thanks for applying, ${firstName(params.applicantName)}!
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      We've received your application for <strong style="color: #1a1a4e;">${params.jobTitle}</strong> at The Digital Dude.
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      We review every application personally. If your background and written test are a fit, we'll be in touch to arrange next steps. Thanks again for the time you put into your application.
    </p>
  `;
  return sendBrevoEmail({
    to: [{ email: params.applicantEmail, name: params.applicantName }],
    subject: `Application received — ${params.jobTitle}`,
    htmlContent: wrapInEmailTemplate("Application Received", content),
  });
}

export async function sendApplicationStatusEmail(params: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  status: string;
  customSubject?: string;
  customHeading?: string;
  customMessage?: string;
  interviewBookingUrl?: string;
  meetingLink?: string;
}) {
  const templateBuilder = RECRUITING_STATUS_TEMPLATES[params.status];
  const defaults = templateBuilder
    ? templateBuilder({
        applicantName: params.applicantName,
        jobTitle: params.jobTitle,
        interviewBookingUrl: params.interviewBookingUrl,
        meetingLink: params.meetingLink,
      })
    : {
        subject: `Update regarding your application for ${params.jobTitle}`,
        heading: `Application Update, ${firstName(params.applicantName)}`,
        body: params.customMessage || "We have an update regarding your application.",
      };

  const subject = params.customSubject || defaults.subject;
  const heading = params.customHeading || defaults.heading;
  const bodyText = params.customMessage || defaults.body;
  const ctaUrl = params.interviewBookingUrl || defaults.ctaUrl;
  const ctaText = defaults.ctaText || "Schedule Interview →";

  const formattedBody = bodyText
    .split("\n\n")
    .map((paragraph) => `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      ${heading}
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #7b61ff; text-transform: uppercase; letter-spacing: 0.5px;">
      Position: ${params.jobTitle}
    </p>
    ${formattedBody}

    ${
      ctaUrl
        ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 20px 0;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #7b61ff; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(123, 97, 255, 0.25);">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>
      `
        : ""
    }
  `;

  return sendBrevoEmail({
    to: [{ email: params.applicantEmail, name: params.applicantName }],
    subject,
    htmlContent: wrapInEmailTemplate(subject, content),
  });
}

export async function sendOnboardingWelcomeEmail(params: {
  fullName: string;
  email: string;
  roleTitle: string;
  referralCode?: string;
  currency?: string;
  meetingBonusMin?: number;
  meetingBonusMax?: number;
  dealCommissionMin?: number;
  dealCommissionMax?: number;
  employmentType?: string;
  customNotes?: string;
}) {
  const currencySymbol = params.currency === "BDT" ? "৳" : params.currency === "GBP" ? "£" : "$";
  const refCode = params.referralCode || "";
  const referralUrl = refCode ? `${SITE_URL}/contact?ref=${refCode}` : "";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      Welcome to The Digital Dude Team, ${firstName(params.fullName)}! 🎉
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4a4a75;">
      We are thrilled to officially welcome you on board as our new <strong style="color: #7b61ff;">${params.roleTitle || "Team Member"}</strong>.
    </p>

    ${
      referralUrl
        ? `
      <div style="background: #f4f0ff; border: 1px solid #7b61ff33; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #7b61ff;">
          🔗 Your Unique Outreach &amp; Referral Link
        </p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #4a4a75; line-height: 1.5;">
          Share this link with prospective clients. Any meeting booked through your link is automatically tracked and credited to you:
        </p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 13px; color: #1a1a4e; word-break: break-all;">
          <a href="${referralUrl}" style="color: #7b61ff; text-decoration: none; font-weight: 700;">${referralUrl}</a>
        </div>
      </div>
      `
        : ""
    }

    ${
      params.dealCommissionMin
        ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #1a1a4e;">
          💼 Compensation &amp; Commission Structure
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4a4a75; line-height: 1.7;">
          ${
            params.meetingBonusMin && params.meetingBonusMax
              ? `<li><strong>Meeting Bonus:</strong> ${currencySymbol}${params.meetingBonusMin.toLocaleString()} – ${currencySymbol}${params.meetingBonusMax.toLocaleString()} per qualified discovery call</li>`
              : ""
          }
          <li><strong>Deal Commission:</strong> ${params.dealCommissionMin}% – ${params.dealCommissionMax || params.dealCommissionMin}% of closed contract value</li>
          <li><strong>Payout Currency:</strong> ${params.currency || "BDT"}</li>
        </ul>
      </div>
      `
        : ""
    }

    ${
      params.customNotes
        ? `
      <div style="background: #fdfefe; border-left: 4px solid #7b61ff; padding: 12px 16px; margin: 20px 0; font-size: 14px; color: #4a4a75; line-height: 1.6;">
        ${params.customNotes.replace(/\n/g, "<br>")}
      </div>
      `
        : ""
    }

    <h3 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 700; color: #1a1a4e;">
      Next Onboarding Steps:
    </h3>
    <ol style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #4a4a75;">
      <li>Review &amp; sign your Consultant Agreement and NDA.</li>
      <li>Submit your preferred payout information (Bank/bKash/Nagad/Wise).</li>
      <li>Join our workspace and review the Sales Playbook &amp; Pitch Deck.</li>
      <li>Attend your 1-on-1 strategy kickoff call with the team.</li>
    </ol>

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      If you have any questions or need access assistance, simply reply directly to this email.<br>
      Welcome aboard, and let's achieve great milestones together!
    </p>
  `;

  return sendBrevoEmail({
    to: [{ email: params.email, name: params.fullName }],
    subject: `Welcome to The Digital Dude — ${params.roleTitle || "Onboarding Guide"}`,
    htmlContent: wrapInEmailTemplate("Welcome to The Digital Dude", content),
  });
}
