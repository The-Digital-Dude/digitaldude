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
}) {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      Welcome to The Digital Dude, ${firstName(params.fullName)}!
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      We're glad to have you on board as our new <strong style="color: #1a1a4e;">${params.roleTitle}</strong>. Someone from the team will be in touch directly with your onboarding steps and everything you need to get started.
    </p>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b6b90;">
      Questions in the meantime? Just reply to this email.
    </p>
  `;
  return sendBrevoEmail({
    to: [{ email: params.email, name: params.fullName }],
    subject: "Welcome to The Digital Dude",
    htmlContent: wrapInEmailTemplate("Welcome", content),
  });
}
