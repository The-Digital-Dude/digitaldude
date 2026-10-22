import { describe, it, expect } from "vitest";
import { csvCell, mapHeaders, parseCsvText, planImport, MAX_IMPORT_ROWS } from "@/lib/crm/csv";
import { prepareLeadUpdate } from "@/lib/crm/leads";
import { buildStaleDigests } from "@/lib/crm/jobs";
import { DEFAULT_CRM_SETTINGS } from "@/lib/crm/settings";
import { applyFilters, type CrmLead } from "@/components/rep/crm/shared";

describe("CSV reading", () => {
  it("handles quotes, commas, doubled quotes, line breaks inside quotes, CRLF and a byte-order mark", () => {
    const rows = parseCsvText('﻿Name,Email,Notes\r\n"Lee, Dan",dan@x.com,"said ""hi""\nthen left"\r\n\r\nAnn,ann@x.com,\r\n');
    expect(rows).toEqual([
      ["Name", "Email", "Notes"],
      ["Lee, Dan", "dan@x.com", 'said "hi"\nthen left'],
      ["Ann", "ann@x.com", ""],
    ]);
  });
  it("guards exported cells against spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+1 555")).toBe(`"'+1 555"`);
    expect(csvCell(null)).toBe('""');
    expect(csvCell("a\nb")).toBe('"a b"');
  });
});

describe("import planning", () => {
  it("recognises common header spellings, including first + last name", () => {
    const m = mapHeaders(["First Name", "Last name", "E-mail address", "Mobile", "Organisation", "Job Title", "Misc"]);
    expect(m.first).toBe(0);
    expect(m.last).toBe(1);
    expect(m.fields.email).toBe(2);
    expect(m.fields.phone).toBe(3);
    expect(m.fields.company_name).toBe(4);
    expect(m.fields.job_title).toBe(5);
    expect(m.unmapped).toEqual(["Misc"]);
  });

  it("accepts good rows and explains each bad one", () => {
    const rows = parseCsvText(
      [
        "Name,Email,Country,Tags,Deal value,Stage",
        "Jane Smith,Jane@Example.com,au,warm; referral,\"$5,000\",contacted",
        "No Email,,AU,,,",
        "Bad Email,not-an-email,,,,",
        "Dup,jane@example.com,,,,",
        ",nobody@example.com,,,,",
        "Wrong Country,w@example.com,Australia,,,",
        "Lost Start,l@example.com,,,,lost",
      ].join("\n")
    );
    const plan = planImport(rows, { currency: "GBP" });
    expect(plan.error).toBeUndefined();
    const byLine = Object.fromEntries(plan.rows.map((r) => [r.line, r]));
    expect(byLine[2].ok).toBe(true);
    expect(byLine[2].email).toBe("jane@example.com");
    expect(byLine[2].lead).toMatchObject({ full_name: "Jane Smith", country: "AU", tags: ["warm", "referral"], estimated_deal_value: 5000, stage: "contacted", currency: "AUD" });
    expect(byLine[3]).toMatchObject({ ok: false, reason: "No email address" });
    expect(byLine[4]).toMatchObject({ ok: false, reason: "That is not an email address" });
    expect(byLine[5]).toMatchObject({ ok: false, reason: "Appears twice in this file" });
    expect(byLine[6]).toMatchObject({ ok: false, reason: "No name" });
    expect(byLine[7].ok).toBe(false); // "Australia" is not a 2-letter code
    expect(byLine[8].ok).toBe(true);
    expect(byLine[8].lead).not.toHaveProperty("stage"); // an imported lead cannot start as lost (no reason)
    expect(byLine[8].lead).toMatchObject({ currency: "GBP" }); // no country: the rep's currency
  });

  it("refuses files without the essentials or with too many rows", () => {
    expect(planImport([["Name"], ["x"]]).error).toMatch(/email column/i);
    expect(planImport([["Email"], ["a@b.co"]]).error).toMatch(/name column/i);
    expect(planImport([["Name", "Email"]]).error).toMatch(/at least one lead/i);
    const big = [["Name", "Email"], ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => [`P${i}`, `p${i}@x.com`])];
    expect(planImport(big).error).toMatch(/up to 300/);
  });
});

describe("applying an edit to a lead", () => {
  const lead = { stage: "contacted", status: "attempted", email: "dan@plum.com.au", currency: "AUD" };

  it("closing a deal as lost needs a reason; leaving 'lost' clears it", () => {
    expect(prepareLeadUpdate(lead, { stage: "lost" }).error).toMatch(/why this deal was lost/i);
    const ok = prepareLeadUpdate(lead, { stage: "lost", lost_reason: "no_budget", lost_note: " too dear " });
    expect(ok.error).toBeUndefined();
    expect(ok.update).toMatchObject({ stage: "lost", lost_reason: "no_budget", lost_note: "too dear" });
    expect(ok.stageChanged).toBe(true);
    const back = prepareLeadUpdate({ ...lead, stage: "lost", lost_reason: "no_budget" }, { stage: "negotiation" });
    expect(back.update).toMatchObject({ stage: "negotiation", lost_reason: null, lost_note: null });
  });

  it("an older lost lead with no reason can still have its details corrected", () => {
    const r = prepareLeadUpdate({ ...lead, stage: "lost", lost_reason: null }, { phone: "0400 000 000" });
    expect(r.error).toBeUndefined();
    expect(r.update.phone).toBe("0400 000 000");
    expect(prepareLeadUpdate(lead, { lost_reason: "other" }).error).toMatch(/only applies to a lost deal/i);
  });

  it("blank strings become empty fields, the email is lower-cased and a change is reported", () => {
    const r = prepareLeadUpdate(lead, { phone: " ", company_name: "", email: "DAN@PLUM.COM.AU" });
    expect(r.update).toMatchObject({ phone: null, company_name: null, email: "dan@plum.com.au" });
    expect(r.emailChanged).toBe(false);
    expect(prepareLeadUpdate(lead, { email: "Dan.Lee@Plum.com.au" })).toMatchObject({ emailChanged: true, update: { email: "dan.lee@plum.com.au" } });
  });

  it("setting a country picks that country's currency unless one is chosen; tags are de-duplicated", () => {
    expect(prepareLeadUpdate(lead, { country: "GB" }).update.currency).toBe("GBP");
    expect(prepareLeadUpdate(lead, { country: "GB", currency: "USD" }).update.currency).toBe("USD");
    expect(prepareLeadUpdate(lead, { tags: ["a", "a", "b"] }).update.tags).toEqual(["a", "b"]);
    expect(prepareLeadUpdate(lead, { status: "interested" })).toMatchObject({ statusChanged: true });
    expect(prepareLeadUpdate(lead, { status: "attempted" }).statusChanged).toBe(false);
  });
});

describe("quiet-lead digests", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const ago = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  const mk = (id: string, rep: string, stage: string, daysQuiet: number) => ({ id, employee_id: rep, full_name: `Lead ${id}`, stage, created_at: ago(90), last_activity_at: ago(daysQuiet) });

  it("groups quiet open leads by rep, longest first, and counts the ones quiet for twice the threshold", () => {
    const d = buildStaleDigests(
      [mk("a", "r1", "contacted", 6), mk("b", "r1", "contacted", 12), mk("c", "r1", "contacted", 1), mk("d", "r2", "negotiation", 8), mk("e", "r2", "won", 99), mk("f", "r3", "new", 0)],
      now,
      DEFAULT_CRM_SETTINGS
    );
    expect(d.map((x) => x.employeeId).sort()).toEqual(["r1", "r2"]);
    const r1 = d.find((x) => x.employeeId === "r1")!;
    expect(r1.leads.map((l) => l.id)).toEqual(["b", "a"]);
    expect(r1.severe).toBe(1); // 12 >= 2 x 5
    expect(d.find((x) => x.employeeId === "r2")!.severe).toBe(0); // 8 < 2 x 7
  });
});

describe("rep list filters", () => {
  const base = { id: "1", employee_id: "r", full_name: "Dan Lee", email: "dan@plum.com.au", phone: null, company_name: "Plum Pty", job_title: "Director", lead_source: "x", stage: "contacted", estimated_deal_value: 0, currency: "AUD", notes: null, last_contacted_at: null, created_at: "2026-01-01" } as CrmLead;
  const leads: CrmLead[] = [
    { ...base, id: "1", tags: ["warm"], country: "AU", fit_grade: "A", stale: true },
    { ...base, id: "2", full_name: "Ann Wu", email: "ann@x.co", company_name: "Orchid", tags: [], country: "GB", fit_grade: "C", needs_next_step: true },
    { ...base, id: "3", stage: "won", status: "connected" },
  ];
  const ids = (f: Parameters<typeof applyFilters>[1]) => applyFilters(leads, f).map((l) => l.id);
  it("filters by every field and combines them", () => {
    expect(ids({})).toEqual(["1", "2", "3"]);
    expect(ids({ stage: "won" })).toEqual(["3"]);
    expect(ids({ status: "connected" })).toEqual(["3"]);
    expect(ids({ tag: "warm" })).toEqual(["1"]);
    expect(ids({ country: "gb" })).toEqual(["2"]);
    expect(ids({ stale: true })).toEqual(["1"]);
    expect(ids({ grade: "C" })).toEqual(["2"]);
    expect(ids({ noNextStep: true })).toEqual(["2"]);
    expect(ids({ q: "orchid" })).toEqual(["2"]);
    expect(ids({ q: "PLUM", stage: "contacted", stale: true })).toEqual(["1"]);
  });
});
