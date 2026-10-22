import { describe, it, expect } from "vitest";
import { insertSuggestions } from "@/lib/acquisition/contacts/suggestions";
import { reviewSuggestions } from "@/lib/acquisition/contacts/review";
import { loadChecks, verifyMany } from "@/lib/acquisition/verify/bulk";
import { fakeDb } from "./helpers/fakedb";

const fresh = () => new Date().toISOString();
const check = (email: string, status: string, reason = "why") => ({ email_normalized: email, status, reason, source: "builtin", details: {}, checked_at: fresh() });
const rpc = { acq_is_suppressed: () => false, acq_rep_can_email: () => [{ ok: false, reason: null }] };

describe("addresses that cannot receive mail are dropped early", () => {
  it("website and Hunter suggestions with an invalid address are never saved", async () => {
    const { db, tables } = fakeDb({ acq_contacts: [], acq_contact_suggestions: [], acq_email_checks: [check("dead@gone.example", "invalid", "no such domain"), check("ok@plum.com.au", "safe")] }, { rpc });
    const saved = await insertSuggestions(db, "co1", [
      { email: "dead@gone.example", source_url: "https://plum.com.au", evidence_excerpt: "x", origin: "website" },
      { email: "ok@plum.com.au", source_url: "https://plum.com.au", evidence_excerpt: "x", origin: "website" },
    ]);
    expect(saved).toBe(1);
    expect(tables.acq_contact_suggestions.map((s) => s.email)).toEqual(["ok@plum.com.au"]);
  });

  it("accepting a suggestion for an invalid address dismisses it instead of creating a contact", async () => {
    const sug = (id: string, email: string) => ({ id, company_id: "co1", email, name: null, role: null, source_url: "https://x", status: "pending", acq_companies: { name: "Plum", owner_employee_id: null, status: "researched" } });
    const { db, tables } = fakeDb({ acq_contact_suggestions: [sug("a", "dead@gone.example"), sug("b", "ok@plum.com.au")], acq_contacts: [], rep_leads: [], acq_email_checks: [check("dead@gone.example", "invalid", "no such domain"), check("ok@plum.com.au", "risky", "typo")] }, { rpc });
    const r = await reviewSuggestions(db, ["a", "b"], "accept", "neil");
    expect(r[0]).toMatchObject({ status: "dismissed", note: expect.stringContaining("cannot receive mail") });
    expect(r[1]).toMatchObject({ status: "accepted" }); // risky is allowed through (a warning, not a block)
    expect(tables.acq_contacts.map((c) => c.email)).toEqual(["ok@plum.com.au"]);
  });
});

describe("saved checks", () => {
  it("loadChecks returns what is saved, keyed by the normalised address, and nothing for unchecked ones", async () => {
    const { db } = fakeDb({ acq_email_checks: [check("dan@plum.com.au", "safe")] });
    const out = await loadChecks(db, ["Dan@Plum.com.au", "other@x.com"]);
    expect(Object.keys(out)).toEqual(["dan@plum.com.au"]);
    expect(out["dan@plum.com.au"].status).toBe("safe");
    expect(await loadChecks(db, [])).toEqual({});
  });

  it("verifyMany checks each distinct address once, saves the results, and skips junk", async () => {
    const { db, tables } = fakeDb({});
    const out = await verifyMany(db, ["a@plum.com.au", "A@plum.com.au", "b@mailinator.com", "not-an-email"]);
    expect(out.map((c) => c.email).sort()).toEqual(["a@plum.com.au", "b@mailinator.com", "not-an-email"]);
    expect(out.find((c) => c.email === "b@mailinator.com")?.status).toBe("invalid");
    expect(out.find((c) => c.email === "not-an-email")?.status).toBe("invalid");
    expect(tables.acq_email_checks).toHaveLength(3);
  });
});
