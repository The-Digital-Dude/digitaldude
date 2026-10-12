import { describe, it, expect } from "vitest";
import { evaluateEligibility, type ConsentRecord } from "@/lib/acquisition/compliance/eligibility";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { checkCampaignCompliance, renderMessage, renderTemplate, findUnknownTags, STARTER_TEMPLATE } from "@/lib/acquisition/compliance/templates";
import { normalizeEmail, normalizeDomain, isFreeMailDomain } from "@/lib/acquisition/normalize";

const NOW = new Date("2026-10-12T00:00:00Z");
const rec = (o: Partial<ConsentRecord> = {}): ConsentRecord => ({
  consent_type: "express",
  legal_basis: "Contact asked to hear from us",
  evidence_url: "https://example.com.au/enquiry",
  evidence_notes: null,
  reviewed_by: "neil",
  reviewed_at: "2026-10-01T00:00:00Z",
  expires_at: null,
  created_at: "2026-10-01T00:00:00Z",
  ...o,
});

describe("evaluateEligibility", () => {
  const base = { email: "a@b.com.au", suppressed: false, now: NOW };

  it("accepts a reviewed, evidenced basis", () => {
    expect(evaluateEligibility({ ...base, consents: [rec()] })).toMatchObject({ eligible: true, status: "eligible" });
  });
  it("suppression beats everything", () => {
    expect(evaluateEligibility({ ...base, suppressed: true, consents: [rec()] })).toMatchObject({ eligible: false, status: "suppressed" });
  });
  it("needs review when there is no record", () => {
    expect(evaluateEligibility({ ...base, consents: [] })).toMatchObject({ eligible: false, status: "needs_review" });
  });
  it("blocks unverified and withdrawn contacts", () => {
    expect(evaluateEligibility({ ...base, consents: [rec({ consent_type: "unverified" })] }).status).toBe("blocked");
    expect(evaluateEligibility({ ...base, consents: [rec({ consent_type: "withdrawn" })] }).status).toBe("blocked");
  });
  it("latest record wins (withdrawal after consent)", () => {
    const r = evaluateEligibility({ ...base, consents: [rec(), rec({ consent_type: "withdrawn", created_at: "2026-10-05T00:00:00Z" })] });
    expect(r.eligible).toBe(false);
  });
  it("flags unreviewed, AI-reviewed, expired and evidence-free records for human review", () => {
    expect(evaluateEligibility({ ...base, consents: [rec({ reviewed_by: null, reviewed_at: null })] }).status).toBe("needs_review");
    expect(evaluateEligibility({ ...base, consents: [rec({ reviewed_by: "AI" })] }).reasons.join()).toMatch(/person/);
    expect(evaluateEligibility({ ...base, consents: [rec({ expires_at: "2026-09-01T00:00:00Z" })] }).reasons.join()).toMatch(/expired/);
    expect(evaluateEligibility({ ...base, consents: [rec({ evidence_url: null, evidence_notes: " " })] }).reasons.join()).toMatch(/evidence/);
    expect(evaluateEligibility({ ...base, consents: [rec({ legal_basis: "" })] }).reasons.join()).toMatch(/basis/);
  });
  it("inferred consent needs the publication URL", () => {
    const r = evaluateEligibility({ ...base, consents: [rec({ consent_type: "inferred_publication", evidence_url: null, evidence_notes: "saw it" })] });
    expect(r.eligible).toBe(false);
    expect(r.reasons.join()).toMatch(/URL/);
  });
  it("rejects malformed addresses", () => {
    expect(evaluateEligibility({ ...base, email: "not-an-email", consents: [rec()] }).status).toBe("blocked");
  });
});

describe("unsubscribe tokens", () => {
  const secret = "x".repeat(40);
  it("round-trips and normalises the address", () => {
    const t = createUnsubscribeToken("  Jo@Agency.COM.au ", secret);
    expect(verifyUnsubscribeToken(t, secret)).toBe("jo@agency.com.au");
  });
  it("rejects tampering, wrong secret and junk", () => {
    const t = createUnsubscribeToken("jo@agency.com.au", secret);
    const [enc, mac] = t.split(".");
    const other = Buffer.from("victim@agency.com.au").toString("base64url");
    expect(verifyUnsubscribeToken(`${other}.${mac}`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(t, "y".repeat(40))).toBeNull();
    expect(verifyUnsubscribeToken(`${enc}.`, secret)).toBeNull();
    expect(verifyUnsubscribeToken("garbage", secret)).toBeNull();
    expect(verifyUnsubscribeToken(`${t}.extra`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(null, secret)).toBeNull();
    expect(verifyUnsubscribeToken("a".repeat(5000), secret)).toBeNull();
  });
});

describe("templates and sender identity", () => {
  const sender = { sender_name: "Neil", sender_business: "The Digital Dude", sender_postal_address: "1 Example St, Dhaka", sender_email: "neil@digitaldude.co.uk" };
  const good = { ...sender, subject_template: "Hi {{company_name}}", body_template: "Body", followup_enabled: true, followup_body_template: "Follow" };

  it("always appends sender identity and an unsubscribe link, whatever the template says", () => {
    const m = renderMessage({ ...sender, subject_template: "Hi" }, "No footer in my template", {}, "https://x.test/u?t=1");
    expect(m.body).toContain("The Digital Dude");
    expect(m.body).toContain("1 Example St, Dhaka");
    expect(m.body).toContain("https://x.test/u?t=1");
    expect(m.body).toMatch(/unsubscribe/i);
  });
  it("drops the observation line cleanly when there is none", () => {
    const out = renderTemplate(STARTER_TEMPLATE.body, { first_name: "Sam", company_name: "Acme", sender_name: "Neil", observation: "" });
    expect(out).not.toMatch(/\{\{/);
    expect(out).not.toMatch(/\n\n\n/);
    expect(out.startsWith("Hi Sam,\n\nI run")).toBe(true);
  });
  it("leaves unknown tags visible so they are caught, never silently blanked", () => {
    expect(renderTemplate("Hi {{nickname}}", {})).toBe("Hi {{nickname}}");
    expect(findUnknownTags("{{first_name}} {{bogus}}")).toEqual(["bogus"]);
  });
  it("flags missing sender identity, deceptive subjects and unknown tags", () => {
    expect(checkCampaignCompliance(good)).toEqual([]);
    expect(checkCampaignCompliance({ ...good, sender_postal_address: " " }).map((i) => i.field)).toContain("sender_postal_address");
    expect(checkCampaignCompliance({ ...good, subject_template: "RE: your invoice" }).map((i) => i.message).join()).toMatch(/reply/);
    expect(checkCampaignCompliance({ ...good, body_template: "Hi {{oops}}" }).map((i) => i.message).join()).toMatch(/Unknown merge tag/);
    expect(checkCampaignCompliance({ ...good, followup_body_template: "" }).map((i) => i.field)).toContain("followup_body_template");
    expect(checkCampaignCompliance({ ...good, followup_enabled: false, followup_body_template: null })).toEqual([]);
  });
});

describe("normalisation", () => {
  it("normalises emails and domains", () => {
    expect(normalizeEmail("  A@B.Com ")).toBe("a@b.com");
    expect(normalizeDomain("https://www.Agency.com.au/about")).toBe("agency.com.au");
    expect(normalizeDomain("agency.com.au")).toBe("agency.com.au");
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
    expect(isFreeMailDomain("Gmail.com")).toBe(true);
  });
});

import { draftComplianceIssues } from "@/lib/acquisition/compliance/templates";
describe("draftComplianceIssues", () => {
  const sender = { sender_name: "Neil", sender_business: "The Digital Dude", sender_postal_address: "1 Example St, Dhaka", sender_email: "n@x.com" };
  const url = "https://x.test/u?t=abc";
  const m = renderMessage({ ...sender, subject_template: "Hi" }, "Hello", {}, url);
  it("passes a system-rendered message", () => expect(draftComplianceIssues(m, { unsubscribeUrl: url, sender })).toEqual([]));
  it("catches a stripped footer, wrong recipient link, 'Re:' subjects and leftover tags", () => {
    expect(draftComplianceIssues({ subject: "Hi", body: "Hello there" }, { unsubscribeUrl: url, sender })).toHaveLength(3);
    expect(draftComplianceIssues({ ...m, body: m.body.replace("abc", "someone-else") }, { unsubscribeUrl: url, sender })[0]).toMatch(/unsubscribe link/);
    expect(draftComplianceIssues({ ...m, subject: "Re: hi" }, { unsubscribeUrl: url, sender })[0]).toMatch(/reply/);
    expect(draftComplianceIssues({ ...m, body: m.body + " {{oops}}" }, { unsubscribeUrl: url, sender })[0]).toMatch(/unresolved/);
  });
});
