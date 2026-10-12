import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, eligibleContact, draftCampaign, approveAndActivate, unpause, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

const reserve = (id: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_reserve_send($1)`, [id]);
const due = async (now = "now()") => (await db.query<{ lead_id: string }>(`select lead_id from acq_due_followups(${now}, 50)`)).rows.map((r) => r.lead_id);

/** An active campaign whose first email to one contact has been sent `daysAgo` days ago. */
async function sentLead(tag: string, daysAgo: number) {
  const contact = await eligibleContact(db, `fu-${tag}@example.com.au`);
  const camp = await draftCampaign(db, [contact]);
  await approveAndActivate(db, camp.campaignId);
  await unpause(db);
  expect(await reserve(camp.messages[0])).toMatchObject({ ok: true });
  const lead = await one<{ id: string }>(db, `select id from acq_campaign_leads where contact_id=$1`, [contact]);
  await db.query(`update acq_email_messages set status='delivered', sent_at=now() where id=$1`, [camp.messages[0]]);
  await db.query(`update acq_campaign_leads set status='sent', last_message_at = now() - ($2 || ' days')::interval where id=$1`, [lead.id, String(daysAgo)]);
  return { contact, leadId: lead.id, initialId: camp.messages[0], campaignId: camp.campaignId };
}

describe("business-day arithmetic (Australia/Sydney)", () => {
  const add = async (from: string, n: number) => (await one<{ t: string }>(db, `select to_char(acq_add_business_days($1::timestamptz, $2) at time zone 'Australia/Sydney', 'Dy YYYY-MM-DD') as t`, [from, n])).t;
  it("skips weekends", async () => {
    expect(await add("2026-10-09 12:00+11", 1)).toBe("Mon 2026-10-12"); // Friday + 1
    expect(await add("2026-10-09 12:00+11", 2)).toBe("Tue 2026-10-13");
    expect(await add("2026-10-12 12:00+11", 7)).toBe("Wed 2026-10-21"); // Monday + 7 = next Wednesday
  });
});

describe("follow-up selection", () => {
  it("is not due before the delay and is due after it", async () => {
    const early = await sentLead("early", 1);
    const late = await sentLead("late", 20);
    const ids = await due();
    expect(ids).toContain(late.leadId);
    expect(ids).not.toContain(early.leadId);
  });

  it("is skipped when the contact has really replied, but not for an out-of-office", async () => {
    const replied = await sentLead("replied", 20);
    const ooo = await sentLead("ooo", 20);
    await db.query(`insert into acq_replies (contact_id, classification, body) values ($1,'interested','yes please')`, [replied.contact]);
    await db.query(`insert into acq_replies (contact_id, classification, body) values ($1,'out_of_office','away')`, [ooo.contact]);
    const ids = await due();
    expect(ids).not.toContain(replied.leadId);
    expect(ids).toContain(ooo.leadId);
  });

  it("is skipped when the campaign is paused (follow-up settings are frozen while active)", async () => {
    const off = await sentLead("off", 20);
    expect(await due()).toContain(off.leadId);
    await db.query(`update acq_campaigns set status='paused' where id=$1`, [off.campaignId]);
    expect(await due()).not.toContain(off.leadId);
  });

  it("is skipped when the first email bounced", async () => {
    const b = await sentLead("bounced", 20);
    await db.query(`update acq_email_messages set status='bounced' where id=$1`, [b.initialId]);
    expect(await due()).not.toContain(b.leadId);
  });
});

describe("creating and sending a follow-up", () => {
  it("creates exactly one approved follow-up, marks the lead due, and sends it through the normal gate", async () => {
    const s = await sentLead("create", 20);
    expect(await one<{ ok: boolean }>(db, `select acq_create_followup($1,'Following up: Hi','Hello again') as ok`, [s.leadId]).then((r) => r.ok)).toBe(true);
    expect(await one<{ ok: boolean }>(db, `select acq_create_followup($1,'Following up: Hi','Hello again') as ok`, [s.leadId]).then((r) => r.ok)).toBe(false); // only one per lead
    expect(await due()).not.toContain(s.leadId);

    const lead = await one<{ status: string }>(db, `select status from acq_campaign_leads where id=$1`, [s.leadId]);
    expect(lead.status).toBe("follow_up_due");
    const fu = await one<{ id: string; status: string; content_hash: string | null }>(db, `select id, status, content_hash from acq_email_messages where campaign_lead_id=$1 and kind='follow_up'`, [s.leadId]);
    expect(fu).toMatchObject({ status: "approved" });
    expect(fu.content_hash).toBeTruthy();
    expect(await reserve(fu.id)).toMatchObject({ ok: true });
  });

  it("refuses to send the follow-up if the contact replies or opts out first", async () => {
    const r = await sentLead("reply-first", 20);
    await db.query(`select acq_create_followup($1,'Following up: Hi','Hello again')`, [r.leadId]);
    const fu = await one<{ id: string }>(db, `select id from acq_email_messages where campaign_lead_id=$1 and kind='follow_up'`, [r.leadId]);
    await db.query(`insert into acq_replies (contact_id, classification, body) values ($1,'not_interested','no thanks')`, [r.contact]);
    expect(await reserve(fu.id)).toMatchObject({ ok: false, reason: "has_reply" });

    const o = await sentLead("optout-first", 20);
    await db.query(`select acq_create_followup($1,'Following up: Hi','Hello again')`, [o.leadId]);
    await db.query(`insert into acq_suppressions (normalized_email, reason, source) values ('fu-optout-first@example.com.au','unsubscribe','test')`);
    const msg = await one<{ status: string }>(db, `select status from acq_email_messages where campaign_lead_id=$1 and kind='follow_up'`, [o.leadId]);
    expect(msg.status).toBe("cancelled"); // suppression cancels approved-but-unsent mail
  });

  it("rejects an empty subject or body, and a lead that is not in the sent state", async () => {
    const s = await sentLead("empty", 20);
    expect(await one<{ ok: boolean }>(db, `select acq_create_followup($1,'  ','body') as ok`, [s.leadId]).then((r) => r.ok)).toBe(false);
    expect(await one<{ ok: boolean }>(db, `select acq_create_followup($1,'subj','') as ok`, [s.leadId]).then((r) => r.ok)).toBe(false);
    await db.query(`update acq_campaign_leads set status='replied' where id=$1`, [s.leadId]);
    expect(await one<{ ok: boolean }>(db, `select acq_create_followup($1,'subj','body') as ok`, [s.leadId]).then((r) => r.ok)).toBe(false);
  });
});
