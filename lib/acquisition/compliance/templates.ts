/**
 * Message templating and the mandatory sender-identification / unsubscribe footer.
 * The footer is appended by the system on every message so a template can never omit it.
 */

export const MERGE_TAGS = [
  "first_name", "company_name", "observation", "sender_name", "sender_business", "booking_url", "unsubscribe_url",
] as const;
export type MergeTag = (typeof MERGE_TAGS)[number];

export interface SenderIdentity {
  sender_name: string;
  sender_business: string;
  sender_postal_address: string;
  sender_email: string;
}

export interface CampaignContent extends SenderIdentity {
  subject_template: string;
  body_template: string;
  followup_enabled: boolean;
  followup_body_template: string | null;
}

const TAG_RE = /\{\{\s*([a-z_]+)\s*\}\}/gi;

export function findUnknownTags(template: string): string[] {
  const unknown = new Set<string>();
  for (const m of template.matchAll(TAG_RE)) {
    if (!(MERGE_TAGS as readonly string[]).includes(m[1].toLowerCase())) unknown.add(m[1]);
  }
  return [...unknown];
}

export function renderTemplate(template: string, vars: Partial<Record<MergeTag, string>>): string {
  let out = template;
  // A line that is only an empty {{observation}} disappears instead of leaving a gap.
  if (!vars.observation?.trim()) out = out.replace(/^[ \t]*\{\{\s*observation\s*\}\}[ \t]*\r?\n?(\r?\n)?/gim, "");
  return out.replace(TAG_RE, (whole, tag: string) => {
    const key = tag.toLowerCase() as MergeTag;
    return (MERGE_TAGS as readonly string[]).includes(key) ? (vars[key] ?? "") : whole;
  });
}

export function buildFooter(s: SenderIdentity, unsubscribeUrl: string): string {
  return [
    "--",
    `${s.sender_name}, ${s.sender_business}`,
    s.sender_postal_address,
    s.sender_email,
    "",
    `You are receiving this because of your role at a property management business. If you'd rather not hear from us, unsubscribe here: ${unsubscribeUrl}`,
  ].join("\n");
}

export function renderMessage(
  content: Pick<CampaignContent, keyof SenderIdentity> & { subject_template: string },
  bodyTemplate: string,
  vars: Partial<Record<MergeTag, string>>,
  unsubscribeUrl: string
): { subject: string; body: string } {
  const all = {
    sender_name: content.sender_name,
    sender_business: content.sender_business,
    unsubscribe_url: unsubscribeUrl,
    ...vars,
  };
  const subject = renderTemplate(content.subject_template, all).replace(/\s+/g, " ").trim();
  const body = `${renderTemplate(bodyTemplate, all).trim()}\n\n${buildFooter(content, unsubscribeUrl)}`;
  return { subject, body };
}

export interface ComplianceIssue {
  field: string;
  message: string;
}

/** Checks a campaign is fit to submit for approval. Errors block submission. */
export function checkCampaignCompliance(c: CampaignContent): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const need = (field: keyof SenderIdentity, label: string) => {
    if (!c[field]?.trim()) issues.push({ field, message: `${label} is required so the sender is accurately identified` });
  };
  need("sender_name", "Sender name");
  need("sender_business", "Business name");
  need("sender_postal_address", "Postal address");
  need("sender_email", "Reply-to / sender email");
  if (c.sender_email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.sender_email.trim())) {
    issues.push({ field: "sender_email", message: "Sender email is not valid" });
  }

  if (!c.subject_template.trim()) issues.push({ field: "subject_template", message: "Subject is required" });
  if (/^\s*(re|fw|fwd)\s*:/i.test(c.subject_template)) {
    issues.push({ field: "subject_template", message: "Subject must not pretend to be a reply or forward" });
  }
  if (!c.body_template.trim()) issues.push({ field: "body_template", message: "Body is required" });
  if (c.followup_enabled && !c.followup_body_template?.trim()) {
    issues.push({ field: "followup_body_template", message: "Follow-up body is required when follow-ups are enabled" });
  }

  for (const [field, text] of [
    ["subject_template", c.subject_template],
    ["body_template", c.body_template],
    ["followup_body_template", c.followup_body_template ?? ""],
  ] as const) {
    const unknown = findUnknownTags(text);
    if (unknown.length) issues.push({ field, message: `Unknown merge tag(s): ${unknown.map((t) => `{{${t}}}`).join(", ")}` });
  }
  return issues;
}

export const STARTER_TEMPLATE = {
  subject: "Reducing admin load at {{company_name}}",
  body: `Hi {{first_name}},

{{observation}}

I run The Digital Dude, a small web and software studio. We build custom tools that cut repetitive admin for property management teams, such as automated owner reporting, maintenance request triage and tenant onboarding workflows.

If that could be relevant to {{company_name}}, I'd be glad to share a couple of examples. If not, no problem at all.

Regards,
{{sender_name}}`,
  followup: `Hi {{first_name}},

Just a brief follow-up on my note last week. If improving admin workflows at {{company_name}} isn't a priority right now, no need to reply and I won't contact you again about it.

Regards,
{{sender_name}}`,
};

/**
 * Per-message check, run when a draft is edited and again at approval, so a
 * reviewer's edit (or a direct database write) can't strip the mandatory
 * identification or unsubscribe link.
 */
export function draftComplianceIssues(
  draft: { subject: string; body: string },
  expected: { unsubscribeUrl: string; sender: SenderIdentity }
): string[] {
  const issues: string[] = [];
  if (!draft.subject.trim()) issues.push("Subject is empty");
  if (/^\s*(re|fw|fwd)\s*:/i.test(draft.subject)) issues.push("Subject must not pretend to be a reply or forward");
  if (!draft.body.includes(expected.unsubscribeUrl)) issues.push("Body is missing this recipient's unsubscribe link");
  if (!draft.body.includes(expected.sender.sender_business)) issues.push("Body is missing the sender's business name");
  if (!draft.body.includes(expected.sender.sender_postal_address)) issues.push("Body is missing the sender's postal address");
  if (/\{\{[^}]*\}\}/.test(draft.subject + draft.body)) issues.push("Draft contains an unresolved {{merge tag}}");
  return issues;
}
