import { describe, it, expect } from "vitest";
import { applyPoolFilters, csvCell, likeSafe, parsePoolFilters } from "@/lib/acquisition/pool";
import { assignmentRuleInput, poolBulkBody, repMarketBody } from "@/lib/acquisition/validation";

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";

describe("pool filters", () => {
  it("accepts valid values and drops anything malformed", () => {
    const f = parsePoolFilters(new URLSearchParams({ market: U1, country: "gb", band: "prioritize_review", poolStatus: "needs_contact", owner: "none", source: "ai_discovery", duplicate: "1", contacts: "no", research: "researched", q: " acme " }));
    expect(f).toMatchObject({ market: U1, country: "GB", band: "prioritize_review", poolStatus: "needs_contact", owner: "none", source: "ai_discovery", duplicate: true, contacts: "no", research: "researched", q: "acme" });
    const bad = parsePoolFilters(new URLSearchParams({ market: "x", country: "GBR", band: "evil", poolStatus: "x", owner: "'; drop", source: "y", contacts: "maybe", research: "z" }));
    expect(bad).toMatchObject({ market: "", country: "", band: "", poolStatus: "", owner: "", source: "", contacts: "", research: "", duplicate: false });
  });

  it("strips characters that could break a PostgREST filter expression", () => {
    expect(likeSafe("a%b_c,d(e)f*g" + String.fromCharCode(92) + "h")).toBe("a b c d e f g h");
  });

  it("builds the expected query calls and excludes archived by default", () => {
    const calls: string[] = [];
    const q: Record<string, unknown> = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => (calls.push(`${name}(${args.join(",")})`), q) });
    applyPoolFilters(q, parsePoolFilters(new URLSearchParams({ owner: U2, contacts: "yes", q: "acme" })));
    expect(calls).toContain(`eq(owner_employee_id,${U2})`);
    expect(calls).toContain("gt(contact_count,0)");
    expect(calls.some((c) => c.startsWith("or(name.ilike.%acme%"))).toBe(true);
    expect(calls).toContain("neq(status,archived)");
  });
});

describe("csv export safety", () => {
  it("quotes cells and neutralises spreadsheet formulas", () => {
    expect(csvCell('He said "hi"\nbye')).toBe('"He said ""hi"" bye"');
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    for (const bad of ["+1+1", "-2+3", "@SUM(A1)"]) expect(csvCell(bad).startsWith("\"'")).toBe(true);
    expect(csvCell(null)).toBe('""');
    expect(csvCell(42)).toBe('"42"');
  });
});

describe("pool request validation", () => {
  it("bulk actions need 1-500 valid company ids", () => {
    expect(poolBulkBody.safeParse({ action: "assign", companyIds: [U1], employeeId: U2 }).success).toBe(true);
    expect(poolBulkBody.safeParse({ action: "assign", companyIds: [U1], employeeId: null }).success).toBe(true);
    expect(poolBulkBody.safeParse({ action: "assign", companyIds: [], employeeId: U2 }).success).toBe(false);
    expect(poolBulkBody.safeParse({ action: "assign", companyIds: ["nope"], employeeId: U2 }).success).toBe(false);
    expect(poolBulkBody.safeParse({ action: "archive", companyIds: Array(501).fill(U1) }).success).toBe(false);
    expect(poolBulkBody.safeParse({ action: "set_status", companyIds: [U1], poolStatus: "hacked" }).success).toBe(false);
    expect(poolBulkBody.safeParse({ action: "delete_all", companyIds: [U1] }).success).toBe(false);
  });
  it("a rule needs a criterion and a valid country", () => {
    expect(assignmentRuleInput.safeParse({ employeeId: U1 }).success).toBe(false);
    expect(assignmentRuleInput.safeParse({ employeeId: U1, country: "gb" }).success).toBe(true);
    expect(assignmentRuleInput.safeParse({ employeeId: U1, minFitScore: 0 }).success).toBe(true);
    expect(assignmentRuleInput.safeParse({ employeeId: U1, minFitScore: 101 }).success).toBe(false);
    expect(assignmentRuleInput.safeParse({ employeeId: U1, country: "GBR" }).success).toBe(false);
  });
  it("rep market grants are bounded", () => {
    expect(repMarketBody.safeParse({ employeeId: U1, marketId: U2, claimCap: 25 }).success).toBe(true);
    expect(repMarketBody.safeParse({ employeeId: U1, marketId: U2, claimCap: -1 }).success).toBe(false);
    expect(repMarketBody.safeParse({ employeeId: U1, marketId: U2, claimCap: 5000 }).success).toBe(false);
  });
});
