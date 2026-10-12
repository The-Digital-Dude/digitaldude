import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, eligibleContact, draftCampaign, approveAndActivate, unpause, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

const reserve = (id: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_reserve_send($1)`, [id]);
const active = async (contactId: string) => (await one<{ a: boolean }>(db, `select acq_company_other_active($1) as a`, [contactId])).a;

/** Two eligible contacts at the SAME company, plus one at a different company, all in one approved campaign. */
async function setup(tag: string) {
  const a = await eligibleContact(db, `a-${tag}@example.com.au`);
  const b = await eligibleContact(db, `b-${tag}@example.com.au`);
  const other = await eligibleContact(db, `c-${tag}@example.com.au`);
  await db.query(`update acq_contacts set company_id = (select company_id from acq_contacts where id=$1) where id=$2`, [a, b]);
  const camp = await draftCampaign(db, [a, b, other], { dailyLimit: 10 });
  await approveAndActivate(db, camp.campaignId);
  await unpause(db);
  return { a, b, other, msgs: camp.messages };
}

describe("setup migration 0034", () => {
  it("enables IE/NL/DE, keeps other countries blocked, and seeds disabled markets", async () => {
    const allowed = async (c: string) => (await one<{ a: boolean }>(db, `select acq_country_allowed($1) as a`, [c])).a;
    expect(await allowed("IE")).toBe(true);
    expect(await allowed("NL")).toBe(true);
    expect(await allowed("DE")).toBe(true);
    expect(await allowed("FR")).toBe(false);
    expect(await allowed("BD")).toBe(false);
    const m = await one<{ total: number; enabled: number }>(db, `select count(*)::int as total, count(*) filter (where enabled)::int as enabled from acq_markets`);
    expect(m.total).toBe(21); // 7 industries x 3 countries (the existing AU property market is one of them)
    expect(m.enabled).toBe(1); // only the pre-existing AU property market stays on
  });

  it("puts the head-office address in the sender identity without overwriting an edited one", async () => {
    const s = await one<{ value: { postalAddress: string } }>(db, `select value from acq_settings where key='sender_identity'`);
    expect(s.value.postalAddress).toBe("Dhanmondi, Dhaka, Bangladesh");
  });
});

describe("one contact per company at a time", () => {
  it("blocks a colleague's first email once the first contact has been sent to", async () => {
    const { a, b, other, msgs } = await setup("send");
    expect(await reserve(msgs[0])).toMatchObject({ ok: true }); // contact a: first at the company
    expect(await reserve(msgs[1])).toMatchObject({ ok: false, reason: "company_has_active_contact" }); // contact b: same company
    expect(await reserve(msgs[2])).toMatchObject({ ok: true }); // other company is unaffected
    expect(await active(b)).toBe(true);
    expect(await active(a)).toBe(false); // a is the one in conversation, not blocked by itself
    expect(await active(other)).toBe(false);
  });

  it("lets the colleague through once the first conversation has finished", async () => {
    const { a, b, msgs } = await setup("done");
    await reserve(msgs[0]);
    await db.query(`update acq_email_messages set status='bounced' where id=$1`, [msgs[0]]);
    await db.query(`update acq_campaign_leads set status='bounced' where contact_id=$1`, [a]);
    expect(await active(b)).toBe(false);
    expect(await reserve(msgs[1])).toMatchObject({ ok: true });
  });

  it("counts a rep's recent email and an active rep drip to a colleague, and ignores old ones", async () => {
    await db.query(`create table if not exists rep_outreach_logs (id serial primary key, recipient_email text not null, sent_at timestamptz not null default now())`);
    const a = await eligibleContact(db, "rep-a@example.com.au");
    const b = await eligibleContact(db, "rep-b@example.com.au");
    await db.query(`update acq_contacts set company_id = (select company_id from acq_contacts where id=$1) where id=$2`, [a, b]);
    expect(await active(b)).toBe(false);
    await db.query(`insert into rep_outreach_logs (recipient_email, sent_at) values ('rep-a@example.com.au', now() - interval '40 days')`);
    expect(await active(b)).toBe(false); // older than 30 days
    await db.query(`insert into rep_outreach_logs (recipient_email) values ('REP-A@example.com.au')`);
    expect(await active(b)).toBe(true);
    expect(await active(a)).toBe(false);
  });
});
