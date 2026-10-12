import { z } from "zod";
import { isValidEmail, normalizeDomain } from "./normalize";

const text = (max = 500) => z.string().trim().max(max);
const optionalText = (max = 500) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), text(max).nullable().optional());
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().max(2000).url().refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) URL").nullable().optional()
);

export const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export const companyInput = z.object({
  name: text(200).min(1),
  website: optionalUrl,
  state: z.preprocess((v) => (v === "" ? null : v), z.enum(STATES).nullable().optional()),
  suburb: optionalText(120),
  property_portfolio_evidence: optionalText(2000),
});
export type CompanyInput = z.infer<typeof companyInput>;

export const importCompaniesBody = z.object({ companies: z.array(companyInput).min(1).max(200) });

export const contactInput = z.object({
  company_id: z.string().uuid(),
  name: optionalText(200),
  role: optionalText(200),
  email: text(320).refine(isValidEmail, "Invalid email address"),
  source_url: optionalUrl,
  source_type: z.enum(["company_website", "public_directory", "referral", "inbound_enquiry", "existing_client", "manual_import", "other"]),
});

export const consentInput = z
  .object({
    consent_type: z.enum(["express", "inferred_publication", "existing_relationship", "unverified", "withdrawn"]),
    legal_basis: optionalText(2000),
    evidence_url: optionalUrl,
    evidence_notes: optionalText(4000),
    expires_at: z.preprocess((v) => (v === "" ? null : v), z.string().datetime({ offset: true }).nullable().optional()),
    /** Required confirmations for inferred consent from a published address. */
    inferred_checklist: z
      .object({ conspicuously_published: z.boolean(), no_no_spam_notice: z.boolean(), relevant_to_role: z.boolean() })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.consent_type === "inferred_publication") {
      const c = v.inferred_checklist;
      if (!c || !c.conspicuously_published || !c.no_no_spam_notice || !c.relevant_to_role) {
        ctx.addIssue({ code: "custom", path: ["inferred_checklist"], message: "Confirm all three inferred-consent checks" });
      }
    }
    if (v.consent_type !== "unverified" && v.consent_type !== "withdrawn") {
      if (!v.legal_basis) ctx.addIssue({ code: "custom", path: ["legal_basis"], message: "Explain the legal basis" });
      if (!v.evidence_url && !v.evidence_notes) ctx.addIssue({ code: "custom", path: ["evidence_notes"], message: "Provide evidence (URL or notes)" });
    }
  });

export const researchBody = z.object({ companyId: z.string().uuid() });

export const researchNoteInput = z.object({
  category: z.enum(["identity", "portfolio", "opportunity", "technology", "decision_maker"]),
  strength: z.number().min(0).max(1),
  source_url: z.string().url(),
  observed_fact: text(1000).min(1),
  evidence_excerpt: text(1000).min(1),
});

export const campaignInput = z.object({
  name: text(200).min(1),
  daily_limit: z.number().int().min(1).max(50).optional(),
  sender_name: text(120),
  sender_business: text(200),
  sender_postal_address: text(300),
  sender_email: text(320),
  subject_template: text(300),
  body_template: text(6000),
  followup_enabled: z.boolean(),
  followup_delay_business_days: z.number().int().min(1).max(30),
  followup_body_template: z.preprocess((v) => (v === "" ? null : v), text(6000).nullable().optional()),
});
export type CampaignInput = z.infer<typeof campaignInput>;

export const campaignStatusBody = z.object({
  action: z.enum(["submit", "revoke", "launch", "pause", "resume", "complete"]),
});

export const addLeadsBody = z.object({ contactIds: z.array(z.string().uuid()).min(1).max(50) });

export const messageEditBody = z.object({ subject: text(300).min(1), body: text(8000).min(1) });

export const approvalBody = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), campaignId: z.string().uuid(), contentHash: z.string().length(64) }),
  z.object({ decision: z.literal("reject"), campaignId: z.string().uuid(), reason: text(1000).min(1) }),
]);

export const suppressionBody = z
  .object({
    email: text(320).optional(),
    domain: text(255).optional(),
    reason: z.enum(["objection", "manual"]).default("manual"),
  })
  .superRefine((v, ctx) => {
    if (!v.email && !v.domain) ctx.addIssue({ code: "custom", message: "Provide an email or a domain" });
    if (v.email && !isValidEmail(v.email)) ctx.addIssue({ code: "custom", path: ["email"], message: "Invalid email" });
    if (v.domain && !normalizeDomain(v.domain)) ctx.addIssue({ code: "custom", path: ["domain"], message: "Invalid domain" });
  });

export const settingsBody = z.object({ sendingPaused: z.boolean() });

export const replyReviewBody = z.object({
  classification: z.enum(["interested", "not_interested", "opt_out", "out_of_office", "bounce", "uncertain"]),
});

export const meetingBody = z.object({ contactId: z.string().uuid() });

export const webhookEvent = z.object({
  id: z.string().min(1).max(200),
  type: z.enum(["delivered", "bounced", "complained", "replied", "unsubscribed"]),
  email: z.string().min(3).max(320),
  providerMessageId: z.string().max(300).optional(),
  bounceType: z.enum(["hard", "soft"]).optional(),
  body: z.string().max(100_000).optional(),
  occurredAt: z.string().optional(),
});
