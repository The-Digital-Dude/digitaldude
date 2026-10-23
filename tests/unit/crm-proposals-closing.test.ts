import { describe, it, expect } from "vitest";
import {
  PROPOSAL_BLUEPRINTS,
  generateProposalSlug,
  createAgreementHash,
  tailorProposalWithAi,
} from "@/lib/crm/proposals";

describe("CRM Proposal Generation & Closing logic", () => {
  it("generates an unguessable slug with sanitized company prefix and random hex", () => {
    const slug1 = generateProposalSlug("Acme Logistics");
    const slug2 = generateProposalSlug("Acme Logistics");
    expect(slug1).toMatch(/^tdd-prop-acme-logistics-[a-f0-9]{8}$/);
    expect(slug2).toMatch(/^tdd-prop-acme-logistics-[a-f0-9]{8}$/);
    expect(slug1).not.toBe(slug2); // Unguessable randomness
  });

  it("handles blank or special-character company names safely", () => {
    const slug = generateProposalSlug("!!! @@@ ###");
    expect(slug).toMatch(/^tdd-prop-deal-[a-f0-9]{8}$/);
  });

  it("generates a deterministic SHA-256 agreement audit hash", () => {
    const payload = {
      slug: "tdd-prop-acme-1234abcd",
      clientName: "Jane Doe",
      clientEmail: "jane@acme.com",
      signedAt: "2026-10-23T12:00:00.000Z",
      signedIp: "192.168.1.1",
      budgetRange: "$10,000 – $15,000",
    };
    const hash1 = createAgreementHash(payload);
    const hash2 = createAgreementHash(payload);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string

    // Tampering changes the digest
    const tampered = createAgreementHash({ ...payload, budgetRange: "$5,000" });
    expect(tampered).not.toBe(hash1);
  });

  it("provides battle-tested default blueprints with architecture modules and phases", () => {
    expect(PROPOSAL_BLUEPRINTS.length).toBeGreaterThanOrEqual(4);
    for (const bp of PROPOSAL_BLUEPRINTS) {
      expect(bp.name).toBeTruthy();
      expect(bp.systemType).toBeTruthy();
      expect(bp.architectureModules.length).toBeGreaterThan(0);
      expect(bp.deliverablePhases.length).toBe(4);
      for (const m of bp.architectureModules) {
        expect(m.name).toBeTruthy();
        expect(m.deliverables.length).toBeGreaterThan(0);
        expect(m.phase).toBeTruthy();
      }
    }
  });

  it("tailorProposalWithAi falls back gracefully to blueprint defaults when AI is unconfigured", async () => {
    const blueprint = PROPOSAL_BLUEPRINTS[0];
    const lead = {
      fullName: "Marcus Aurelius",
      companyName: "Imperial Logistics",
      jobTitle: "Operations Director",
      notes: "Bottleneck in driver dispatch and lost proof-of-delivery receipts.",
      estimatedDealValue: 12000,
      currency: "GBP",
      country: "UK",
    };

    const tailored = await tailorProposalWithAi({ blueprint, lead });
    expect(tailored.scopeSummary).toContain("Imperial Logistics");
    expect(tailored.problemStatement).toContain("Bottleneck in driver dispatch");
    expect(tailored.architectureModules).toEqual(blueprint.architectureModules);
    expect(tailored.deliverablePhases).toEqual(blueprint.deliverablePhases);
  });
});
