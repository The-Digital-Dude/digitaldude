import { describe, it, expect } from "vitest";
import { approvalBody, campaignInput, companyInput, consentInput, contactInput, importCompaniesBody, suppressionBody } from "@/lib/acquisition/validation";

const uuid = "6f1c2f0e-8c1a-4a3e-9d57-2b5a0f6a1c11";

describe("consentInput", () => {
  const ok = { consent_type: "express", legal_basis: "Asked to hear from us", evidence_notes: "Email dated 1 Oct" };
  it("accepts a complete express-consent review", () => expect(consentInput.safeParse(ok).success).toBe(true));
  it("requires reasoning and evidence for a positive basis", () => {
    expect(consentInput.safeParse({ consent_type: "express" }).success).toBe(false);
    expect(consentInput.safeParse({ consent_type: "express", legal_basis: "x" }).success).toBe(false);
  });
  it("lets you record unverified/withdrawn with no evidence", () => {
    expect(consentInput.safeParse({ consent_type: "unverified" }).success).toBe(true);
    expect(consentInput.safeParse({ consent_type: "withdrawn" }).success).toBe(true);
  });
  it("requires all three inferred-consent confirmations", () => {
    const inferred = { consent_type: "inferred_publication", legal_basis: "b", evidence_url: "https://a.com.au/contact" };
    expect(consentInput.safeParse(inferred).success).toBe(false);
    expect(consentInput.safeParse({ ...inferred, inferred_checklist: { conspicuously_published: true, no_no_spam_notice: true, relevant_to_role: false } }).success).toBe(false);
    expect(consentInput.safeParse({ ...inferred, inferred_checklist: { conspicuously_published: true, no_no_spam_notice: true, relevant_to_role: true } }).success).toBe(true);
  });
  it("rejects non-http evidence URLs and unknown types", () => {
    expect(consentInput.safeParse({ ...ok, evidence_url: "javascript:alert(1)" }).success).toBe(false);
    expect(consentInput.safeParse({ ...ok, consent_type: "implied_by_vibes" }).success).toBe(false);
  });
});

describe("other schemas", () => {
  it("company import normalises blanks and validates state", () => {
    const r = importCompaniesBody.parse({ companies: [{ name: " Acme ", website: "", state: "", suburb: "" }] });
    expect(r.companies[0]).toMatchObject({ name: "Acme", website: null, state: null, suburb: null });
    expect(companyInput.safeParse({ name: "A", state: "XX" }).success).toBe(false);
    expect(companyInput.safeParse({ name: "A", website: "ftp://x.com" }).success).toBe(false);
    expect(companyInput.safeParse({ name: "  " }).success).toBe(false);
    expect(importCompaniesBody.safeParse({ companies: [] }).success).toBe(false);
  });
  it("contact requires a valid email, company id and source type", () => {
    const base = { company_id: uuid, email: "a@b.com.au", source_type: "company_website" };
    expect(contactInput.safeParse(base).success).toBe(true);
    expect(contactInput.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(contactInput.safeParse({ ...base, company_id: "x" }).success).toBe(false);
    expect(contactInput.safeParse({ ...base, source_type: "bought_list" }).success).toBe(false);
  });
  it("campaign input bounds the limits", () => {
    const base = { name: "x", sender_name: "", sender_business: "", sender_postal_address: "", sender_email: "", subject_template: "", body_template: "", followup_enabled: true, followup_delay_business_days: 7, followup_body_template: "" };
    expect(campaignInput.safeParse(base).success).toBe(true);
    expect(campaignInput.safeParse({ ...base, daily_limit: 0 }).success).toBe(false);
    expect(campaignInput.safeParse({ ...base, daily_limit: 51 }).success).toBe(false);
    expect(campaignInput.safeParse({ ...base, followup_delay_business_days: 0 }).success).toBe(false);
  });
  it("approval is a strict discriminated union and needs a full hash / a reason", () => {
    const hash = "a".repeat(64);
    expect(approvalBody.safeParse({ decision: "approve", campaignId: uuid, contentHash: hash }).success).toBe(true);
    expect(approvalBody.safeParse({ decision: "approve", campaignId: uuid, contentHash: "short" }).success).toBe(false);
    expect(approvalBody.safeParse({ decision: "reject", campaignId: uuid }).success).toBe(false);
    expect(approvalBody.safeParse({ decision: "reject", campaignId: uuid, reason: "off-brand" }).success).toBe(true);
    // The approver identity is never accepted from the client.
    const parsed = approvalBody.parse({ decision: "approve", campaignId: uuid, contentHash: hash, approvedBy: "evil" } as never);
    expect("approvedBy" in parsed).toBe(false);
  });
  it("suppression needs an email or domain, and only allows human reasons", () => {
    expect(suppressionBody.safeParse({}).success).toBe(false);
    expect(suppressionBody.safeParse({ email: "bad" }).success).toBe(false);
    expect(suppressionBody.safeParse({ domain: "not a domain" }).success).toBe(false);
    expect(suppressionBody.safeParse({ domain: "agency.com.au" }).success).toBe(true);
    expect(suppressionBody.safeParse({ email: "a@b.com", reason: "hard_bounce" }).success).toBe(false);
  });
});
