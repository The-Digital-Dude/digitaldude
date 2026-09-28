import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";

/**
 * Automated recruiting/onboarding emails. Kept separate from
 * lib/emailBrevo.ts's EMAIL_TEMPLATES array on purpose: those are ad-hoc
 * templates an admin picks and edits per send via EmailComposerModal, while
 * these are fired automatically by an event (application submitted, status
 * changed, onboarding completed) with no admin composition step. Both reuse
 * the same underlying sendBrevoEmail/wrapInEmailTemplate primitives.
 */

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

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

const STATUS_COPY: Record<string, { subject: string; heading: string; body: string }> = {
  interview: {
    subject: "You're through to the next stage",
    heading: "Let's talk",
    body: "We've reviewed your application and would like to move forward to an interview. Someone from our team will be in touch shortly to arrange a time.",
  },
  rejected: {
    subject: "Update on your application",
    heading: "Thank you for applying",
    body: "After reviewing your application, we've decided not to move forward at this time. We appreciate the time you put into applying and wish you the best in your search.",
  },
  offered: {
    subject: "We'd like to offer you the role",
    heading: "Great news",
    body: "We'd like to offer you the role. Someone from our team will follow up directly with the details and next steps.",
  },
};

export async function sendApplicationStatusEmail(params: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  status: "interview" | "rejected" | "offered";
}) {
  const copy = STATUS_COPY[params.status];
  if (!copy) return { ok: false, error: `No email copy for status "${params.status}"` };

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      ${copy.heading}, ${firstName(params.applicantName)}
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Regarding your application for <strong style="color: #1a1a4e;">${params.jobTitle}</strong>:
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      ${copy.body}
    </p>
  `;
  return sendBrevoEmail({
    to: [{ email: params.applicantEmail, name: params.applicantName }],
    subject: `${copy.subject} — ${params.jobTitle}`,
    htmlContent: wrapInEmailTemplate(copy.subject, content),
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
