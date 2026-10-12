import { describe, it, expect } from "vitest";
import { basisSchema, cleanLinkedinUrl, searchHelpLinks } from "@/lib/repPool";
import { assertPoolContactAllowed, OutreachBlockedError } from "@/lib/outreachGate";

describe("LinkedIn reference validation", () => {
  it("accepts only https linkedin.com addresses and drops query strings", () => {
    expect(cleanLinkedinUrl("https://www.linkedin.com/company/acme/?trk=x#y")).toBe("https://www.linkedin.com/company/acme");
    expect(cleanLinkedinUrl("https://uk.linkedin.com/in/jane-doe/")).toBe("https://uk.linkedin.com/in/jane-doe");
    expect(cleanLinkedinUrl("http://www.linkedin.com/company/acme")).toBeNull();
    expect(cleanLinkedinUrl("https://linkedin.com.evil.com/company/acme")).toBeNull();
    expect(cleanLinkedinUrl("https://evil.com/linkedin.com")).toBeNull();
    expect(cleanLinkedinUrl("javascript:alert(1)")).toBeNull();
    expect(cleanLinkedinUrl("not a url")).toBeNull();
  });
});

describe("search helper links", () => {
  it("builds encoded searches the rep opens themselves (nothing is fetched)", () => {
    const links = searchHelpLinks({ name: 'Smith & "Sons" Pty Ltd', domain: "smith.com.au", website: "https://smith.com.au", country: "AU" });
    const urls = links.map((l) => l.url);
    expect(urls.every((u) => u.startsWith("https://"))).toBe(true);
    expect(urls.some((u) => u.startsWith("https://www.linkedin.com/search/results/companies/?keywords=Smith%20%26"))).toBe(true);
    expect(urls.some((u) => u.includes("site%3Asmith.com.au"))).toBe(true);
    expect(urls).toContain("https://smith.com.au/contact");
    expect(urls.some((u) => u.includes('"Sons"'))).toBe(false); // quotes are encoded, never raw
  });
  it("omits site-specific links when the company has no website", () => {
    const links = searchHelpLinks({ name: "No Site Co", domain: null, website: null, country: null });
    expect(links.some((l) => l.label.includes("their site") || l.label.includes("contact page"))).toBe(false);
    expect(links.length).toBe(3);
  });
});

describe("lawful basis form", () => {
  const ok = { consentType: "inferred_publication", legalBasis: "Published on their contact page for enquiries." };
  it("requires a real explanation and a rep-permissible basis type", () => {
    expect(basisSchema.safeParse(ok).success).toBe(true);
    expect(basisSchema.safeParse({ ...ok, legalBasis: "ok" }).success).toBe(false);
    expect(basisSchema.safeParse({ ...ok, consentType: "unverified" }).success).toBe(false);
    expect(basisSchema.safeParse({ ...ok, consentType: "withdrawn" }).success).toBe(false);
  });
  it("treats an empty evidence link as absent but rejects a malformed one", () => {
    expect(basisSchema.safeParse({ ...ok, evidenceUrl: "" }).success).toBe(true);
    expect(basisSchema.safeParse({ ...ok, evidenceUrl: "not a url" }).success).toBe(false);
  });
});

function gateDb(contact: { id: string } | null, gate: { ok: boolean; reason: string | null } | { error: string }) {
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: contact, error: null }) }) }) }),
    rpc: async () => ("error" in gate ? { data: null, error: { message: gate.error } } : { data: [gate], error: null }),
  } as never;
}

describe("assertPoolContactAllowed (rep send gate for pool contacts)", () => {
  it("does not restrict a rep's own prospects that are not in the pool", async () => {
    await expect(assertPoolContactAllowed(gateDb(null, { ok: false, reason: "x" }), "own@prospect.com", "rep1")).resolves.toBeUndefined();
  });
  it("lets a cleared pool contact through", async () => {
    await expect(assertPoolContactAllowed(gateDb({ id: "c1" }, { ok: true, reason: null }), "a@b.com", "rep1")).resolves.toBeUndefined();
  });
  it("blocks with a plain-language reason", async () => {
    await expect(assertPoolContactAllowed(gateDb({ id: "c1" }, { ok: false, reason: "country_blocked" }), "a@b.com", "rep1")).rejects.toMatchObject({ reason: "pool_not_allowed", message: expect.stringContaining("country") });
    await expect(assertPoolContactAllowed(gateDb({ id: "c1" }, { ok: false, reason: "not_your_company" }), "a@b.com", "rep1")).rejects.toBeInstanceOf(OutreachBlockedError);
    await expect(assertPoolContactAllowed(gateDb({ id: "c1" }, { ok: false, reason: "weird_new_reason" }), "a@b.com", "rep1")).rejects.toThrow(/not cleared/);
  });
  it("fails closed when the gate itself errors", async () => {
    await expect(assertPoolContactAllowed(gateDb({ id: "c1" }, { error: "db down" }), "a@b.com", "rep1")).rejects.toThrow(/pool gate failed/);
  });
});
