import { describe, it, expect, vi } from "vitest";
import { acceptAiBasis, candidatePageUrls, draftBasisForContact, findEmailOnPage, templateBasis } from "@/lib/acquisition/contacts/basis-draft";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import type { FetchedPage } from "@/lib/acquisition/providers/research";
import { fakeDb } from "./helpers/fakedb";

const page = (url: string, body: string, status = 200): FetchedPage => ({ url, status, contentType: "text/html", body });
const contact = { id: "c1", email: "daniel@plum-property.com.au", role: "Property Manager", source_url: "https://plum-property.com.au/team", acq_companies: { name: "Plum Property", website: "https://plum-property.com.au", domain: "plum-property.com.au", industry: "Property management", country: "AU" } };

describe("page selection and evidence", () => {
  it("checks the page the address came from first, then the company's own contact pages, capped and de-duplicated", () => {
    const urls = candidatePageUrls("https://plum-property.com.au/team", "https://plum-property.com.au");
    expect(urls[0]).toBe("https://plum-property.com.au/team");
    expect(urls).toContain("https://plum-property.com.au/contact");
    expect(urls.length).toBeLessThanOrEqual(4);
    expect(new Set(urls).size).toBe(urls.length);
    expect(candidatePageUrls("javascript:alert(1)", null)).toEqual([]);
  });

  it("finds an address in visible text or a mailto link, and gives no proof otherwise", () => {
    expect(findEmailOnPage({ html: "", text: "Contact Daniel on daniel@plum-property.com.au today" }, "Daniel@Plum-Property.com.au")).toMatch(/daniel@plum-property.com.au/);
    expect(findEmailOnPage({ html: '<a href="mailto:daniel@plum-property.com.au">x</a>', text: "x" }, "daniel@plum-property.com.au")).toMatch(/mailto/);
    expect(findEmailOnPage({ html: "<p>nothing</p>", text: "nothing" }, "daniel@plum-property.com.au")).toBeNull();
  });
});

describe("wording", () => {
  const ctx = { email: "d@x.com", companyName: "Plum", role: "Manager", industry: "Property management", country: "AU", url: "https://x.com/team" };
  it("states only verified facts, and uses legitimate-interest wording for EU countries", () => {
    expect(templateBasis(ctx)).toContain("published on x.com (https://x.com/team)");
    expect(templateBasis(ctx)).not.toMatch(/legitimate/i);
    expect(templateBasis({ ...ctx, country: "DE" })).toMatch(/Legitimate-interest B2B contact/);
  });
  it("rejects AI wording that is too short, has markup, or links somewhere other than the evidence page", () => {
    expect(acceptAiBasis("Address published on the company team page for a property manager.", "https://x.com/team")).toBeTruthy();
    expect(acceptAiBasis("short", "https://x.com/team")).toBeNull();
    expect(acceptAiBasis("See <b>this</b> page where the address was published for the role.", "https://x.com/team")).toBeNull();
    expect(acceptAiBasis("Address published at https://evil.example/phish for the role of manager.", "https://x.com/team")).toBeNull();
    expect(acceptAiBasis("Address published at https://x.com/team for the role of manager.", "https://x.com/team")).toBeTruthy();
  });
});

describe("draftBasisForContact", () => {
  it("fills the form when the address is really on the page, using template wording when AI is off", async () => {
    const { db } = fakeDb({ acq_contacts: [contact] });
    const fetchPage = vi.fn(async (u: string) => page(u, "<html><body><p>Daniel Lee, Property Manager: daniel@plum-property.com.au</p></body></html>"));
    const d = await draftBasisForContact(db, "c1", { fetchPage, ai: null });
    expect(d).toMatchObject({ verified: true, consentType: "inferred_publication", evidenceUrl: "https://plum-property.com.au/team", warning: null });
    expect(d?.legalBasis).toContain("plum-property.com.au");
    expect(d?.evidenceNotes).toContain("daniel@plum-property.com.au");
    expect(fetchPage).toHaveBeenCalledTimes(1); // stops at the first page that proves it
  });

  it("uses the AI sentence when it passes validation, else falls back to the template", async () => {
    const { db } = fakeDb({ acq_contacts: [contact] });
    const fetchPage = async (u: string) => page(u, "<p>daniel@plum-property.com.au</p>");
    const good: AiProvider = { completeJson: async () => JSON.stringify({ basis: "Daniel's address is published on the Plum Property team page for the property manager role." }) } as unknown as AiProvider;
    const bad: AiProvider = { completeJson: async () => JSON.stringify({ basis: "Visit https://evil.example now" }) } as unknown as AiProvider;
    expect((await draftBasisForContact(db, "c1", { fetchPage, ai: good }))?.legalBasis).toMatch(/team page/);
    expect((await draftBasisForContact(db, "c1", { fetchPage, ai: bad }))?.legalBasis).toMatch(/published on plum-property\.com\.au/);
  });

  it("fills nothing in, and says so, when the address is not found on any page", async () => {
    const { db } = fakeDb({ acq_contacts: [contact] });
    const fetchPage = async (u: string) => page(u, "<p>No emails here</p>");
    const d = await draftBasisForContact(db, "c1", { fetchPage, ai: null });
    expect(d).toMatchObject({ verified: false, legalBasis: "", evidenceUrl: null });
    expect(d?.warning).toMatch(/not found on the pages checked/);
    expect(d?.checkedPages.length).toBeGreaterThan(0);
  });

  it("treats unreachable pages and error responses as 'no evidence', not as a failure", async () => {
    const { db } = fakeDb({ acq_contacts: [contact] });
    let n = 0;
    const fetchPage = async (u: string) => {
      if (++n === 1) throw new Error("timeout");
      return page(u, "<p>daniel@plum-property.com.au</p>", n === 2 ? 404 : 200);
    };
    expect((await draftBasisForContact(db, "c1", { fetchPage, ai: null }))?.verified).toBe(true);
  });

  it("returns null for an unknown contact", async () => {
    expect(await draftBasisForContact(fakeDb({ acq_contacts: [] }).db, "nope", { ai: null })).toBeNull();
  });
});
