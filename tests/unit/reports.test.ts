import { describe, it, expect } from "vitest";
import { discoveryYield, funnelByMarket, repLeaderboard, type CompanyRow } from "@/lib/acquisition/reports";

let n = 0;
const co = (o: Partial<CompanyRow> = {}): CompanyRow => ({
  id: `c${++n}`, market_id: "m1", pool_status: "unassigned", owner_employee_id: null, source: "manual", status: "researched", fit_band: null, contact_count: 0, created_at: "2026-10-05T00:00:00Z", ...o,
});
const markets = [{ id: "m1", name: "Law - UK" }, { id: "m2", name: "Property - AU" }];

describe("funnelByMarket", () => {
  it("counts companies per pool status per market, skipping archived", () => {
    const f = funnelByMarket([co(), co({ pool_status: "assigned" }), co({ pool_status: "assigned" }), co({ market_id: "m2", pool_status: "won" }), co({ status: "archived" }), co({ market_id: null })], markets);
    expect(f[0]).toMatchObject({ market: "Law - UK", total: 3, byStatus: { unassigned: 1, assigned: 2 } });
    expect(f.find((x) => x.market === "Property - AU")).toMatchObject({ total: 1, byStatus: { won: 1 } });
    expect(f.find((x) => x.market === "No market")?.total).toBe(1);
    expect(f.reduce((a, x) => a + x.total, 0)).toBe(5); // archived excluded
  });
});

describe("repLeaderboard", () => {
  const reps = [{ id: "r1", full_name: "Ann", status: "active" }, { id: "r2", full_name: "Bob", status: "active" }, { id: "r3", full_name: "Gone", status: "offboarded" }];
  const companies = [
    co({ id: "a", owner_employee_id: "r1", pool_status: "assigned" }),
    co({ id: "b", owner_employee_id: "r1", pool_status: "contacted", contact_count: 2 }),
    co({ id: "c", owner_employee_id: "r1", pool_status: "meeting", contact_count: 1 }),
    co({ id: "d", owner_employee_id: "r1", pool_status: "won", contact_count: 1 }),
    co({ id: "e", owner_employee_id: "r1", pool_status: "dead" }),
    co({ id: "f", owner_employee_id: "r2", pool_status: "needs_contact" }),
    co({ id: "g", owner_employee_id: "r2", status: "archived", pool_status: "assigned" }),
  ];
  const rows = repLeaderboard({ companies, reps, eligibleByCompany: { b: 2, c: 1 }, emails30d: { r1: 40 }, bookings: [{ employeeId: "r1", viaPool: true }, { employeeId: "r1", viaPool: false }, { employeeId: "r2", viaPool: false }] });

  it("summarises what each rep owns and how far they've taken it", () => {
    expect(rows.find((r) => r.id === "r1")).toMatchObject({ owned: 5, open: 2, needsContact: 1, contacted: 3, meetings: 1, won: 1, eligibleContacts: 3, emails30d: 40, bookings: 2, poolBookings: 1 });
    expect(rows.find((r) => r.id === "r2")).toMatchObject({ owned: 1, open: 1, needsContact: 1, bookings: 1 });
  });
  it("ignores archived companies, sorts by bookings, and hides an offboarded rep with no activity", () => {
    expect(rows.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(rows.some((r) => r.id === "r3")).toBe(false);
  });
  it("keeps an offboarded rep who still has bookings so credit isn't hidden", () => {
    const withBooking = repLeaderboard({ companies: [], reps, eligibleByCompany: {}, emails30d: {}, bookings: [{ employeeId: "r3", viaPool: true }] });
    expect(withBooking.map((r) => r.id)).toContain("r3");
  });
});

describe("discoveryYield", () => {
  it("measures only AI-discovered companies added in the window", () => {
    const y = discoveryYield(
      [
        co({ source: "ai_discovery", status: "new" }),
        co({ source: "ai_discovery", status: "researched", fit_band: "prioritize_review", contact_count: 1 }),
        co({ source: "ai_discovery", status: "deprioritized", fit_band: "deprioritize" }),
        co({ source: "ai_discovery", status: "researched", fit_band: "gather_evidence" }),
        co({ source: "manual", status: "researched" }),
        co({ source: "ai_discovery", created_at: "2026-08-01T00:00:00Z" }),
        co({ source: "ai_discovery", market_id: "m2", status: "researched", fit_band: "prioritize_review" }),
      ],
      markets,
      "2026-09-12T00:00:00Z"
    );
    expect(y[0]).toEqual({ market: "Law - UK", discovered: 4, researched: 3, goodFit: 2, withContact: 1, deprioritized: 1 });
    expect(y[1]).toMatchObject({ market: "Property - AU", discovered: 1, goodFit: 1 });
  });
});
