import { describe, it, expect } from "vitest";
import { findPoolOwnerForEmail, markPoolMeeting } from "@/lib/acquisition/attribution";
import type { Db } from "@/lib/acquisition/db";

type Row = Record<string, unknown> | null;

function fakeDb(tables: { acq_contacts?: Row; acq_companies?: Row; employees?: Row }) {
  const queries: { table: string; filters: Record<string, unknown>; update?: Record<string, unknown> }[] = [];
  const db = {
    from(table: keyof typeof tables) {
      const q: { table: string; filters: Record<string, unknown>; update?: Record<string, unknown> } = { table, filters: {} };
      queries.push(q);
      const b: Record<string, unknown> = {
        select: () => b,
        eq: (k: string, v: unknown) => ((q.filters[k] = v), b),
        in: (k: string, v: unknown) => ((q.filters[k] = v), b),
        update: (v: Record<string, unknown>) => ((q.update = v), b),
        maybeSingle: async () => ({ data: tables[table] ?? null, error: null }),
        then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      };
      return b;
    },
  };
  return { db: db as unknown as Db, queries };
}

describe("pool attribution", () => {
  const contact = { company_id: "co1" };
  const company = { id: "co1", name: "Acme", owner_employee_id: "rep1", status: "researched" };
  const rep = { id: "rep1", full_name: "Rita Rep", status: "active" };

  it("credits the active rep who owns the contact's company", async () => {
    const { db, queries } = fakeDb({ acq_contacts: contact, acq_companies: company, employees: rep });
    expect(await findPoolOwnerForEmail(db, "  Lead@Acme.com ")).toEqual({ employeeId: "rep1", employeeName: "Rita Rep", companyId: "co1", companyName: "Acme" });
    expect(queries[0].filters.email_normalized).toBe("lead@acme.com"); // exact, normalised email only
  });

  it("gives nobody credit when the email isn't a pool contact", async () => {
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: null }).db, "stranger@x.com")).toBeNull();
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: { company_id: null } }).db, "a@x.com")).toBeNull();
  });

  it("gives nobody credit for unowned or archived companies, or an offboarded rep", async () => {
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: contact, acq_companies: { ...company, owner_employee_id: null }, employees: rep }).db, "a@x.com")).toBeNull();
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: contact, acq_companies: { ...company, status: "archived" }, employees: rep }).db, "a@x.com")).toBeNull();
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: contact, acq_companies: company, employees: { ...rep, status: "offboarded" } }).db, "a@x.com")).toBeNull();
    expect(await findPoolOwnerForEmail(fakeDb({ acq_contacts: contact, acq_companies: company, employees: null }).db, "a@x.com")).toBeNull();
  });

  it("only moves a company to 'meeting' from the early working stages, for its owner", async () => {
    const { db, queries } = fakeDb({});
    await markPoolMeeting(db, "co1", "rep1");
    expect(queries[0]).toMatchObject({ table: "acq_companies", update: { pool_status: "meeting" } });
    expect(queries[0].filters).toMatchObject({ id: "co1", owner_employee_id: "rep1", pool_status: ["assigned", "needs_contact", "contacted", "replied"] });
  });
});
