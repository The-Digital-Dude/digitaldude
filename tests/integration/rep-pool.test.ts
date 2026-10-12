import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, eligibleContact, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

let n = 0;
const rep = async () => (await one<{ id: string }>(db, `insert into employees (full_name, email, status, onboarding_completed) values ('Rep','r${++n}@x.com','active',true) returning id`)).id;
const ownedEligible = async (owner: string | null, country = "AU") => {
  const contact = await eligibleContact(db, `pool-contact-${++n}@example.com.au`);
  const co = await one<{ company_id: string }>(db, `select company_id from acq_contacts where id=$1`, [contact]);
  await db.query(`update acq_companies set country=$1 where id=$2`, [country, co.company_id]);
  if (owner) await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[co.company_id], owner]);
  return { contact, company: co.company_id };
};
const can = (contact: string, employee: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_rep_can_email($1,$2)`, [contact, employee]);

describe("acq_rep_can_email (the rep send gate)", () => {
  it("allows the owner to email an eligible, consented contact in an allowed country", async () => {
    const r = await rep();
    const { contact } = await ownedEligible(r);
    expect(await can(contact, r)).toMatchObject({ ok: true });
  });

  it("refuses a rep who does not own the company, and unowned companies", async () => {
    const owner = await rep();
    const other = await rep();
    const { contact } = await ownedEligible(owner);
    expect(await can(contact, other)).toMatchObject({ ok: false, reason: "not_your_company" });
    const unowned = await ownedEligible(null);
    expect(await can(unowned.contact, owner)).toMatchObject({ ok: false, reason: "not_your_company" });
  });

  it("refuses unknown contacts and contacts without a company", async () => {
    const r = await rep();
    expect(await can((await one<{ id: string }>(db, `select gen_random_uuid() as id`)).id, r)).toMatchObject({ ok: false, reason: "contact_not_found" });
    const loose = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [`loose${++n}@x.com`]);
    expect(await can(loose.id, r)).toMatchObject({ ok: false, reason: "no_company" });
  });

  it("refuses suppressed addresses, withdrawn consent, blocked countries and archived companies", async () => {
    const r = await rep();
    const a = await ownedEligible(r);
    await db.query(`insert into acq_suppressions (normalized_email, reason) select email_normalized, 'unsubscribe' from acq_contacts where id=$1`, [a.contact]);
    expect((await can(a.contact, r)).ok).toBe(false);

    const b = await ownedEligible(r);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, reviewed_by, reviewed_at) values ($1,'withdrawn','Rep (rep)',now())`, [b.contact]);
    expect((await can(b.contact, r)).ok).toBe(false);

    const c = await ownedEligible(r, "FR");
    expect(await can(c.contact, r)).toMatchObject({ ok: false, reason: "country_blocked" });
    await db.query(`insert into acq_country_rules (country, name, email_allowed) values ('FR','France',true) on conflict (country) do update set email_allowed=true`);
    expect(await can(c.contact, r)).toMatchObject({ ok: true });

    const d = await ownedEligible(r);
    await db.query(`update acq_companies set status='archived' where id=$1`, [d.company]);
    expect(await can(d.contact, r)).toMatchObject({ ok: false, reason: "company_archived" });
  });

  it("a contact that is not eligible cannot be emailed even by the owner", async () => {
    const r = await rep();
    const { company } = await ownedEligible(r);
    const fresh = await one<{ id: string }>(db, `insert into acq_contacts (company_id, email, status) values ($1,$2,'needs_review') returning id`, [company, `fresh${++n}@x.com.au`]);
    expect(await can(fresh.id, r)).toMatchObject({ ok: false, reason: "contact_not_eligible" });
  });
});

describe("rep-recorded consent", () => {
  it("records which rep reviewed it, and the model/system names are still refused", async () => {
    const r = await rep();
    const contact = await eligibleContact(db, `rc${++n}@example.com.au`);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, legal_basis, evidence_notes, reviewed_by, reviewed_at, reviewed_by_employee_id) values ($1,'express','b','n','Rep (rep)',now(),$2)`, [contact, r]);
    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_consent_records where reviewed_by_employee_id=$1`, [r])).c).toBe("1");
    expect(await failure(db, `insert into acq_consent_records (contact_id, consent_type, reviewed_by) values ($1,'express','system')`, [contact])).toMatch(/acq_consent_human_reviewer/);
  });
});

describe("company notes", () => {
  it("stores bounded notes per company", async () => {
    const { company } = await ownedEligible(null);
    await db.query(`insert into acq_company_notes (company_id, author, note) values ($1,'Rep','Called, asked to call back')`, [company]);
    expect(await failure(db, `insert into acq_company_notes (company_id, author, note) values ($1,'Rep','   ')`, [company])).not.toBeNull();
    expect(await failure(db, `insert into acq_company_notes (company_id, author, note) values ($1,'Rep',$2)`, [company, "x".repeat(4001)])).not.toBeNull();
  });
});
