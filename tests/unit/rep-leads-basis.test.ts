import { describe, it, expect } from "vitest";
import { ensureRepLead, expandQuickBasis, quickBasisSchema, recordBasisFor } from "@/lib/repPool";
import { reviewSuggestions } from "@/lib/acquisition/contacts/review";
import type { RepSessionPayload } from "@/lib/repAuth";
import { fakeDb } from "./helpers/fakedb";

const rep = { id: "r1", full_name: "Rita Rep" } as unknown as RepSessionPayload;
const canEmail = (ok: boolean) => ({ acq_rep_can_email: () => [{ ok, reason: ok ? null : "contact_not_eligible" }], acq_is_suppressed: () => false });

const contact = { id: "c1", email: "dan@plum.com.au", name: "Dan", role: "Manager", source_url: "https://plum.com.au/team", status: "needs_review", company_id: "co1" };
const company = (o: Record<string, unknown> = {}) => ({ id: "co1", name: "Plum", owner_employee_id: "r1", status: "researched", ...o });
const seed = (c: Record<string, unknown> = {}, co: Record<string, unknown> = {}) => ({ acq_contacts: [{ ...contact, ...c, acq_companies: company(co) }] });
const basis = { consentType: "inferred_publication" as const, legalBasis: "Published on the team page for the manager role", evidenceUrl: "https://plum.com.au/team", evidenceNotes: "seen" };

describe("ensureRepLead", () => {
  it("saves the contact in the rep's Leads CRM immediately, even when it cannot be emailed yet", async () => {
    const { db, tables } = fakeDb({ rep_leads: [] }, { rpc: canEmail(false) });
    const r = await ensureRepLead(db, rep, contact, "Plum");
    expect(r.readyToEmail).toBe(false);
    expect(r.leadId).toBeTruthy();
    expect(tables.rep_leads[0]).toMatchObject({ employee_id: "r1", acq_contact_id: "c1", email: "dan@plum.com.au", company_name: "Plum", lead_source: "Lead pool", stage: "new" });
  });

  it("does not create a second lead, and reports readiness once the gate passes", async () => {
    const { db, tables } = fakeDb({ rep_leads: [] }, { rpc: canEmail(true) });
    const a = await ensureRepLead(db, rep, contact, "Plum");
    const b = await ensureRepLead(db, rep, contact, "Plum");
    expect(b.leadId).toBe(a.leadId);
    expect(b.readyToEmail).toBe(true);
    expect(tables.rep_leads).toHaveLength(1);
  });
});

describe("recordBasisFor", () => {
  const run = (s: Record<string, unknown[]>, b: Parameters<typeof recordBasisFor>[3] = basis, rpc = canEmail(true)) => {
    const f = fakeDb({ rep_leads: [], acq_consent_records: [], ...(s as Record<string, Record<string, unknown>[]>) }, { rpc });
    return { ...f, result: recordBasisFor(f.db, rep, "c1", b) };
  };

  it("records the basis, marks the contact eligible and puts it in the Leads CRM", async () => {
    const { result, tables } = run(seed());
    expect(await result).toMatchObject({ ok: true, eligible: true, readyToEmail: true });
    expect(tables.acq_consent_records[0]).toMatchObject({ contact_id: "c1", consent_type: "inferred_publication", reviewed_by_employee_id: "r1" });
    expect(tables.acq_contacts[0].status).toBe("eligible");
    expect(tables.rep_leads).toHaveLength(1);
  });

  it("refuses contacts at companies the rep does not own, or archived ones", async () => {
    expect(await run(seed({}, { owner_employee_id: "someone-else" })).result).toMatchObject({ ok: false, status: 404 });
    expect(await run(seed({}, { status: "archived" })).result).toMatchObject({ ok: false, status: 404 });
  });

  it("refuses to re-enable a blocked or suppressed contact, or one with withdrawn consent", async () => {
    expect(await run(seed({ status: "blocked" })).result).toMatchObject({ ok: false, status: 409 });
    expect(await run(seed({ status: "suppressed" })).result).toMatchObject({ ok: false, status: 409 });
    const withdrawn = { ...seed(), acq_consent_records: [{ contact_id: "c1", consent_type: "withdrawn", created_at: "2026-01-01" }] };
    expect(await run(withdrawn).result).toMatchObject({ ok: false, status: 409 });
  });

  it("refuses an address on the do-not-contact list and never writes a consent record for it", async () => {
    const { result, tables } = run(seed(), basis, { ...canEmail(true), acq_is_suppressed: () => true });
    expect(await result).toMatchObject({ ok: false, status: 409 });
    expect(tables.acq_consent_records).toHaveLength(0);
    expect(tables.rep_leads).toHaveLength(0);
  });

  it("needs a web page for a published-address claim", async () => {
    const noUrl = { ...basis, evidenceUrl: undefined };
    expect(await run(seed({ source_url: null }), noUrl).result).toMatchObject({ ok: false, status: 422 });
  });
});

describe("one-click basis", () => {
  const ctx = { repName: "Rita Rep", companyName: "Plum", sourceUrl: "https://plum.com.au/team" };
  const run = (s: Record<string, unknown[]>, q: Parameters<typeof recordBasisFor>[3]) => {
    const f = fakeDb({ rep_leads: [], acq_consent_records: [], ...(s as Record<string, Record<string, unknown>[]>) }, { rpc: canEmail(true) });
    return { ...f, result: recordBasisFor(f.db, rep, "c1", q) };
  };

  it("turns a plain reason into a complete record that satisfies the database rules (a sentence plus evidence)", () => {
    for (const reason of ["published", "relationship", "asked"] as const) {
      const b = expandQuickBasis({ reason }, ctx);
      expect(b.legalBasis.length).toBeGreaterThanOrEqual(10);
      expect(b.legalBasis).toContain("Rita Rep"); // always names the person who confirmed it
      expect(b.evidenceNotes).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
    expect(expandQuickBasis({ reason: "published" }, ctx)).toMatchObject({ consentType: "inferred_publication", evidenceUrl: "https://plum.com.au/team" });
    expect(expandQuickBasis({ reason: "relationship" }, ctx).consentType).toBe("existing_relationship");
    expect(expandQuickBasis({ reason: "asked" }, ctx).consentType).toBe("express");
  });

  it("keeps the rep's own words when they are long enough, and falls back to generated text otherwise", () => {
    expect(expandQuickBasis({ reason: "relationship", note: "Worked together on the 2025 portal project" }, ctx).legalBasis).toBe("Worked together on the 2025 portal project");
    expect(expandQuickBasis({ reason: "relationship", note: "yes" }, ctx).legalBasis).toMatch(/Existing business relationship/);
  });

  it("accepts the three reasons only, and only http(s) links", () => {
    expect(quickBasisSchema.safeParse({ reason: "published" }).success).toBe(true);
    expect(quickBasisSchema.safeParse({ reason: "because" }).success).toBe(false);
    expect(quickBasisSchema.safeParse({ reason: "published", evidenceUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("records a quick basis end to end and still refuses a published-address claim with no page at all", async () => {
    const ok = run(seed(), { reason: "published" });
    expect(await ok.result).toMatchObject({ ok: true, eligible: true });
    expect(ok.tables.acq_consent_records[0]).toMatchObject({ consent_type: "inferred_publication", evidence_url: "https://plum.com.au/team", reviewed_by_employee_id: "r1" });
    expect(await run(seed({ source_url: null }), { reason: "published" }).result).toMatchObject({ ok: false, status: 422 });
    expect(await run(seed({ source_url: null }), { reason: "relationship" }).result).toMatchObject({ ok: true, eligible: true });
  });

  it("applies the same protections as the full form (blocked contacts, other reps' contacts)", async () => {
    expect(await run(seed({ status: "blocked" }), { reason: "relationship" }).result).toMatchObject({ ok: false, status: 409 });
    expect(await run(seed({}, { owner_employee_id: "someone-else" }), { reason: "relationship" }).result).toMatchObject({ ok: false, status: 404 });
  });
});

describe("reviewSuggestions (admin bulk accept/dismiss)", () => {
  const sug = (id: string, o: Record<string, unknown> = {}) => ({ id, company_id: "co1", email: `${id}@plum.com.au`, name: null, role: "Manager", source_url: "https://plum.com.au/team", status: "pending", acq_companies: { name: "Plum", owner_employee_id: "r1", status: "researched" }, ...o });

  it("accepts as needs_review contacts, adds each to the owning rep's Leads CRM, and skips already-reviewed ones", async () => {
    const { db, tables } = fakeDb({ acq_contact_suggestions: [sug("a"), sug("b"), sug("done", { status: "accepted" })], acq_contacts: [], rep_leads: [] }, { rpc: canEmail(false) });
    const r = await reviewSuggestions(db, ["a", "b", "done", "missing"], "accept", "neil");
    expect(r.map((x) => x.status)).toEqual(["accepted", "accepted", "skipped", "skipped"]);
    expect(tables.acq_contacts.map((c) => c.status)).toEqual(["needs_review", "needs_review"]);
    expect(tables.rep_leads).toHaveLength(2);
    expect(tables.acq_contact_suggestions.filter((s) => s.status === "accepted")).toHaveLength(3);
  });

  it("does not create a lead for an unowned company", async () => {
    const { db, tables } = fakeDb({ acq_contact_suggestions: [sug("a", { acq_companies: { name: "Plum", owner_employee_id: null, status: "researched" } })], acq_contacts: [], rep_leads: [] }, { rpc: canEmail(false) });
    await reviewSuggestions(db, ["a"], "accept", "neil");
    expect(tables.acq_contacts).toHaveLength(1);
    expect(tables.rep_leads).toHaveLength(0);
  });

  it("dismisses instead of accepting an address on the do-not-contact list", async () => {
    const { db, tables } = fakeDb({ acq_contact_suggestions: [sug("a")], acq_contacts: [], rep_leads: [] }, { rpc: { ...canEmail(false), acq_is_suppressed: () => true } });
    const [r] = await reviewSuggestions(db, ["a"], "accept", "neil");
    expect(r).toMatchObject({ status: "dismissed" });
    expect(tables.acq_contacts).toHaveLength(0);
  });

  it("dismiss only dismisses", async () => {
    const { db, tables } = fakeDb({ acq_contact_suggestions: [sug("a")], acq_contacts: [], rep_leads: [] }, { rpc: canEmail(false) });
    expect((await reviewSuggestions(db, ["a"], "dismiss", "neil"))[0].status).toBe("dismissed");
    expect(tables.acq_contacts).toHaveLength(0);
  });
});
