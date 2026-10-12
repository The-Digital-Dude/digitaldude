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
  state: z.preprocess((v) => (v === "" ? null : v), z.enum(STATES).nullable().optional()), // legacy AU state; prefer `region`
  region: optionalText(80),
  country: z.preprocess((v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toUpperCase()) : v), z.string().regex(/^[A-Z]{2}$/, "Use a 2-letter country code like AU, GB, US").nullable().optional()),
  market_id: z.preprocess((v) => (v === "" ? null : v), z.string().uuid().nullable().optional()),
  industry: optionalText(120),
  linkedin_url: optionalUrl,
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

export const settingsBody = z
  .object({ sendingPaused: z.boolean().optional(), autoResearchEnabled: z.boolean().optional() })
  .refine((b) => b.sendingPaused !== undefined || b.autoResearchEnabled !== undefined, "Nothing to update");

export const suggestionBody = z.object({ action: z.enum(["accept", "dismiss"]) });

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

const list = (maxItems: number, maxLen: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.split(/[\n,]/).map((x) => x.trim()).filter(Boolean) : v),
    z.array(z.string().trim().min(1).max(maxLen)).max(maxItems)
  );

export const marketInput = z.object({
  name: text(120).min(1),
  industry: text(120).min(1),
  country: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.string().regex(/^[A-Z]{2}$/, "Use a 2-letter country code like AU, GB, US")),
  search_phrases: list(20, 120),
  places: list(60, 80),
  qualification_text: text(1000).default(""),
  domain_suffixes: list(10, 12),
  enabled: z.boolean().default(true),
});
export const marketPatch = marketInput.partial();

export const countryRuleInput = z.object({
  country: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.string().regex(/^[A-Z]{2}$/, "Use a 2-letter country code")),
  name: text(120).min(1),
  email_allowed: z.boolean(),
  requires_postal_address: z.boolean().default(false),
  notes: text(1000).default(""),
});

export const duplicateBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("merge"), keeperId: z.string().uuid() }),
  z.object({ action: z.literal("dismiss") }),
]);

const ids = z.array(z.string().uuid()).min(1).max(500);
const POOL = ["unassigned", "assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"] as const;

export const poolBulkBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), companyIds: ids, employeeId: z.string().uuid().nullable() }),
  z.object({ action: z.literal("set_status"), companyIds: ids, poolStatus: z.enum(POOL) }),
  z.object({ action: z.literal("set_market"), companyIds: ids, marketId: z.string().uuid().nullable() }),
  z.object({ action: z.literal("archive"), companyIds: ids }),
  z.object({ action: z.literal("research"), companyIds: ids }),
  z.object({ action: z.literal("apply_rules"), companyIds: ids }),
  z.object({ action: z.literal("find_contacts"), companyIds: ids }),
]);

export const assignmentRuleInput = z
  .object({
    employeeId: z.string().uuid(),
    marketId: z.string().uuid().nullable().optional(),
    country: z.preprocess((v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toUpperCase()) : v), z.string().regex(/^[A-Z]{2}$/).nullable().optional()),
    minFitScore: z.number().int().min(0).max(100).nullable().optional(),
    priority: z.number().int().min(0).max(1000).default(100),
  })
  .refine((r) => r.marketId || r.country || r.minFitScore !== null && r.minFitScore !== undefined, "A rule needs at least one of: market, country, minimum score");

export const repMarketBody = z.object({
  employeeId: z.string().uuid(),
  marketId: z.string().uuid(),
  claimCap: z.number().int().min(0).max(1000).default(25),
});
export const repMarketDelete = z.object({ employeeId: z.string().uuid(), marketId: z.string().uuid() });
