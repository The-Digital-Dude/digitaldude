import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, eligibleContact, draftCampaign, approveAndActivate, unpause, type Db } from "./db";

let db: Db;
let n = 0;
const email = () => `s${++n}@example.com.au`;
const suppress = (e: string, reason = "unsubscribe") =>
  db.query(`insert into acq_suppressions (normalized_email, reason, source) values (lower(btrim($1)), $2, 'test')`, [e, reason]);
const reserve = (id: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_reserve_send($1)`, [id]);

beforeAll(async () => {
  db = await createDb();
});

describe("suppression stops outreach immediately", () => {
  it("cancels drafts, stops the lead and flags the contact", async () => {
    const e = email();
    const contact = await eligibleContact(db, e);
    const { campaignId, leads, messages } = await draftCampaign(db, [contact]);
    await approveAndActivate(db, campaignId);
    await db.query(`insert into acq_jobs (type, idempotency_key, campaign_lead_id) values ('send_email','j-'||$1::text, $1::uuid)`, [leads[0]]);

    await suppress(e);

    expect((await one<{ status: string }>(db, `select status from acq_contacts where id=$1`, [contact])).status).toBe("suppressed");
    expect(await one(db, `select status, stop_reason from acq_campaign_leads where id=$1`, [leads[0]])).toMatchObject({ status: "opted_out", stop_reason: "suppressed: unsubscribe" });
    expect((await one<{ status: string }>(db, `select status from acq_email_messages where id=$1`, [messages[0]])).status).toBe("cancelled");
    expect((await one<{ status: string }>(db, `select status from acq_jobs where campaign_lead_id=$1`, [leads[0]])).status).toBe("cancelled");
  });

  it("is case/whitespace-insensitive", async () => {
    const e = email();
    await eligibleContact(db, e);
    await db.query(`insert into acq_suppressions (normalized_email, reason) values ($1,'manual')`, [e]);
    expect((await one<{ s: boolean }>(db, `select acq_is_suppressed($1) as s`, [`  ${e.toUpperCase()} `])).s).toBe(true);
    // A non-normalised value cannot be stored, so lookups can never silently miss.
    expect(await failure(db, `insert into acq_suppressions (normalized_email, reason) values ('Mixed@Case.com','manual')`)).toMatch(/acq_suppression_email_norm/);
  });

  it("applies to the whole domain when a domain is suppressed", async () => {
    const a = await eligibleContact(db, "a@blocked-agency.com.au");
    await db.query(`insert into acq_suppressions (company_domain, reason, source) values ('blocked-agency.com.au','objection','test')`);
    expect((await one<{ status: string }>(db, `select status from acq_contacts where id=$1`, [a])).status).toBe("suppressed");
    expect((await one<{ s: boolean }>(db, `select acq_is_suppressed('someone.else@blocked-agency.com.au') as s`)).s).toBe(true);
  });

  it("survives deletion and re-import of the lead", async () => {
    const e = email();
    const id = await eligibleContact(db, e);
    await suppress(e, "reply_opt_out");
    await db.query(`delete from acq_contacts where id=$1`, [id]);
    const re = await one<{ status: string }>(db, `insert into acq_contacts (email) values ($1) returning status`, [e.toUpperCase()]);
    expect(re.status).toBe("suppressed");
    const reId = await one<{ id: string }>(db, `select id from acq_contacts where email_normalized=$1`, [e]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [reId.id])).toMatch(/suppressed/);
  });

  it("prevents a suppressed address from entering a campaign", async () => {
    const e = email();
    const id = await eligibleContact(db, e);
    await suppress(e);
    const camp = await one<{ id: string }>(db, `insert into acq_campaigns (name) values ('x') returning id`);
    expect(await failure(db, `insert into acq_campaign_leads (campaign_id, contact_id) values ($1,$2)`, [camp.id, id])).toMatch(/not eligible/);
  });

  it("makes suppression records permanent (no update, no delete)", async () => {
    const e = email();
    await suppress(e);
    expect(await failure(db, `delete from acq_suppressions where normalized_email=$1`, [e])).toMatch(/append-only/);
    expect(await failure(db, `update acq_suppressions set reason='manual' where normalized_email=$1`, [e])).toMatch(/append-only/);
  });

  it("ignores duplicate opt-outs via the unique index (idempotent for retries)", async () => {
    const e = email();
    await suppress(e);
    expect(await failure(db, `insert into acq_suppressions (normalized_email, reason) values ($1,'unsubscribe')`, [e])).toMatch(/duplicate key/);
    await db.query(`insert into acq_suppressions (normalized_email, reason) values ($1,'unsubscribe') on conflict do nothing`, [e]);
  });
});

describe("the send gate rechecks suppression every time", () => {
  it("blocks an initial send on the suppression lookup alone (cancel trigger and contact flag both bypassed)", async () => {
    await unpause(db);
    const e = email();
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, e)]);
    await approveAndActivate(db, campaignId);
    await db.query(`alter table acq_suppressions disable trigger acq_suppression_apply_trg`);
    await suppress(e);
    await db.query(`alter table acq_suppressions enable trigger acq_suppression_apply_trg`);
    // Simulate stale contact row (status still 'eligible') by disabling the contact guard.
    await db.query(`alter table acq_contacts disable trigger acq_contacts_guard_trg`);
    await db.query(`update acq_contacts set status='eligible' where email_normalized=$1`, [e]);
    await db.query(`alter table acq_contacts enable trigger acq_contacts_guard_trg`);
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "suppressed" });
  });

  it("blocks a follow-up after an opt-out that arrives between initial send and follow-up", async () => {
    await unpause(db);
    const e = email();
    const { campaignId, leads, messages } = await draftCampaign(db, [await eligibleContact(db, e)]);
    await approveAndActivate(db, campaignId);
    expect((await reserve(messages[0])).ok).toBe(true);
    await db.query(`update acq_email_messages set status='sent', sent_at=now() where id=$1`, [messages[0]]);
    await db.query(`update acq_campaign_leads set status='follow_up_due', next_action_at=now() - interval '1 minute' where id=$1`, [leads[0]]);
    const fu = await one<{ id: string }>(db, `insert into acq_email_messages (campaign_lead_id, kind, subject, body, status, content_hash) values ($1,'follow_up','Re','Following up', 'approved', acq_message_hash('Re','Following up')) returning id`, [leads[0]]);

    await suppress(e);
    expect((await one<{ status: string }>(db, `select status from acq_email_messages where id=$1`, [fu.id])).status).toBe("cancelled");
    expect((await reserve(fu.id)).ok).toBe(false);
  });
});

describe("follow-up rules", () => {
  async function sentInitial() {
    await unpause(db);
    const contact = await eligibleContact(db, email());
    const { campaignId, leads, messages } = await draftCampaign(db, [contact]);
    await approveAndActivate(db, campaignId);
    expect((await reserve(messages[0])).ok).toBe(true);
    await db.query(`update acq_email_messages set status='sent', sent_at=now() where id=$1`, [messages[0]]);
    const fu = await one<{ id: string }>(db, `insert into acq_email_messages (campaign_lead_id, kind, subject, body, status, content_hash) values ($1,'follow_up','Re','Following up','approved', acq_message_hash('Re','Following up')) returning id`, [leads[0]]);
    return { contact, lead: leads[0], fu: fu.id };
  }

  it("sends when due and still eligible", async () => {
    const { lead, fu } = await sentInitial();
    await db.query(`update acq_campaign_leads set status='follow_up_due', next_action_at=now() - interval '1 minute' where id=$1`, [lead]);
    expect(await reserve(fu)).toMatchObject({ ok: true });
  });

  it("waits until the follow-up is due", async () => {
    const { lead, fu } = await sentInitial();
    await db.query(`update acq_campaign_leads set status='follow_up_due', next_action_at=now() + interval '3 days' where id=$1`, [lead]);
    expect(await reserve(fu)).toMatchObject({ ok: false, reason: "follow_up_not_due" });
  });

  it("is blocked once the contact has replied", async () => {
    const { contact, lead, fu } = await sentInitial();
    await db.query(`update acq_campaign_leads set status='follow_up_due', next_action_at=now() - interval '1 minute' where id=$1`, [lead]);
    await db.query(`insert into acq_replies (contact_id, classification) values ($1,'uncertain')`, [contact]);
    expect(await reserve(fu)).toMatchObject({ ok: false, reason: "has_reply" });
  });

  it("is blocked if the initial email never delivered (e.g. bounced)", async () => {
    const { lead, fu } = await sentInitial();
    await db.query(`update acq_email_messages set status='bounced' where campaign_lead_id=$1 and kind='initial'`, [lead]);
    await db.query(`update acq_campaign_leads set status='follow_up_due', next_action_at=now() - interval '1 minute' where id=$1`, [lead]);
    expect(await reserve(fu)).toMatchObject({ ok: false, reason: "initial_not_delivered" });
  });

  it("cannot have its follow-up setting changed after approval", async () => {
    const { lead } = await sentInitial();
    expect(await failure(db, `update acq_campaigns set followup_enabled=false where id=(select campaign_id from acq_campaign_leads where id=$1)`, [lead])).toMatch(/frozen/);
  });
});
