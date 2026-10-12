import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, eligibleContact, draftCampaign, approveAndActivate, unpause, type Db } from "./db";

let db: Db;
let n = 0;
const email = () => `lead${++n}@example.com.au`;

beforeAll(async () => {
  db = await createDb();
});

describe("contact eligibility is enforced by the database", () => {
  it("rejects 'eligible' on a contact with no consent record", async () => {
    const c = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [c.id])).toMatch(/no reviewed consent/);
  });

  it("rejects inserting a contact directly as eligible", async () => {
    expect(await failure(db, `insert into acq_contacts (email, status) values ($1,'eligible')`, [email()])).toMatch(/cannot be eligible/);
  });

  it("rejects an 'unverified' consent record as a basis", async () => {
    const c = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()]);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, reviewed_by, reviewed_at, evidence_notes, legal_basis) values ($1,'unverified','neil',now(),'x','x')`, [c.id]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [c.id])).toMatch(/no reviewed consent/);
  });

  it("rejects consent that is unreviewed, expired or lacks evidence", async () => {
    const mk = async () => (await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()])).id;
    const unreviewed = await mk();
    await db.query(`insert into acq_consent_records (contact_id, consent_type, legal_basis, evidence_notes) values ($1,'express','b','n')`, [unreviewed]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [unreviewed])).not.toBeNull();

    const expired = await mk();
    await db.query(`insert into acq_consent_records (contact_id, consent_type, legal_basis, evidence_notes, reviewed_by, reviewed_at, expires_at) values ($1,'express','b','n','neil',now(), now() - interval '1 day')`, [expired]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [expired])).not.toBeNull();

    const noEvidence = await mk();
    await db.query(`insert into acq_consent_records (contact_id, consent_type, legal_basis, reviewed_by, reviewed_at) values ($1,'express','b','neil',now())`, [noEvidence]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [noEvidence])).not.toBeNull();
  });

  it("requires a source URL for inferred consent from publication", async () => {
    const c = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()]);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, legal_basis, evidence_notes, reviewed_by, reviewed_at) values ($1,'inferred_publication','b','seen it','neil',now())`, [c.id]);
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [c.id])).not.toBeNull();
  });

  it("never lets the AI or system record a review", async () => {
    const c = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()]);
    for (const who of ["ai", "AI", "model", "system"]) {
      expect(await failure(db, `insert into acq_consent_records (contact_id, consent_type, reviewed_by) values ($1,'express',$2)`, [c.id, who])).toMatch(/acq_consent_human_reviewer/);
    }
  });

  it("consent history is append-only and a later 'withdrawn' record revokes eligibility", async () => {
    const id = await eligibleContact(db, email());
    const rec = await one<{ id: string }>(db, `select id from acq_consent_records where contact_id=$1`, [id]);
    expect(await failure(db, `update acq_consent_records set consent_type='express' where id=$1`, [rec.id])).toMatch(/append-only/);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, reviewed_by, reviewed_at) values ($1,'withdrawn','neil',now())`, [id]);
    expect((await one<{ ok: boolean }>(db, `select acq_contact_consent_ok($1) as ok`, [id])).ok).toBe(false);
  });

  it("blocks unverified contacts from entering a campaign", async () => {
    const c = await one<{ id: string }>(db, `insert into acq_contacts (email) values ($1) returning id`, [email()]);
    const camp = await one<{ id: string }>(db, `insert into acq_campaigns (name) values ('x') returning id`);
    expect(await failure(db, `insert into acq_campaign_leads (campaign_id, contact_id) values ($1,$2)`, [camp.id, c.id])).toMatch(/not eligible/);
  });
});

describe("campaign approval locks the content", () => {
  it("approves only the exact content that was previewed", async () => {
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const seen = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;

    // A draft is edited after the reviewer loaded the preview (campaign is pending_approval,
    // so back it to draft, edit, and resubmit — the stale hash must now be refused).
    await db.query(`select acq_set_campaign_status($1,'draft','neil')`, [campaignId]);
    await db.query(`update acq_email_messages set body='Edited after preview' where id=$1`, [messages[0]]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    expect(await failure(db, `select acq_approve_campaign($1,$2,'neil')`, [campaignId, seen])).toMatch(/content_changed_since_preview/);

    const fresh = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    expect(fresh).not.toBe(seen);
    const approved = await one<{ h: string }>(db, `select acq_approve_campaign($1,$2,'neil') as h`, [campaignId, fresh]);
    expect(approved.h).toBe(fresh);

    const camp = await one<{ status: string; approved_by: string; approved_content_hash: string }>(db, `select * from acq_campaigns where id=$1`, [campaignId]);
    expect(camp).toMatchObject({ status: "approved", approved_by: "neil", approved_content_hash: fresh });
    const msg = await one<{ status: string; content_hash: string }>(db, `select status, content_hash from acq_email_messages where id=$1`, [messages[0]]);
    expect(msg.status).toBe("approved");
    expect(msg.content_hash).toHaveLength(64);
  });

  it("freezes campaign and message content after approval", async () => {
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    await db.query(`select acq_approve_campaign($1,$2,'neil')`, [campaignId, h]);

    for (const col of ["body_template", "subject_template", "sender_name", "sender_postal_address", "sender_email"]) {
      expect(await failure(db, `update acq_campaigns set ${col}='tampered' where id=$1`, [campaignId])).toMatch(/frozen/);
    }
    expect(await failure(db, `update acq_campaigns set daily_limit=50 where id=$1`, [campaignId])).toMatch(/frozen/);
    expect(await failure(db, `update acq_email_messages set body='tampered' where id=$1`, [messages[0]])).toMatch(/frozen/);

    // Adding recipients after approval would bypass the reviewed list.
    const extra = await eligibleContact(db, email());
    expect(await failure(db, `insert into acq_campaign_leads (campaign_id, contact_id) values ($1,$2)`, [campaignId, extra])).toMatch(/draft campaign/);
  });

  it("revoking approval clears it and makes drafts editable again", async () => {
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    await db.query(`select acq_approve_campaign($1,$2,'neil')`, [campaignId, h]);
    await db.query(`select acq_set_campaign_status($1,'draft','neil')`, [campaignId]);

    const camp = await one<{ status: string; approved_by: string | null; approved_content_hash: string | null }>(db, `select * from acq_campaigns where id=$1`, [campaignId]);
    expect(camp).toMatchObject({ status: "draft", approved_by: null, approved_content_hash: null });
    expect(await failure(db, `update acq_email_messages set body='now editable' where id=$1`, [messages[0]])).toBeNull();
  });

  it("cannot be approved by writing the status directly or skipping steps", async () => {
    const { campaignId } = await draftCampaign(db, [await eligibleContact(db, email())]);
    expect(await failure(db, `update acq_campaigns set status='approved' where id=$1`, [campaignId])).toMatch(/illegal campaign transition/);
    expect(await failure(db, `update acq_campaigns set status='active' where id=$1`, [campaignId])).toMatch(/illegal campaign transition/);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    expect(await failure(db, `update acq_campaigns set status='approved', approved_by='neil', approved_at=now(), approved_content_hash='fake' where id=$1`, [campaignId])).toMatch(/does not match/);
    expect(await failure(db, `update acq_campaigns set status='approved' where id=$1`, [campaignId])).toMatch(/requires approved_by/);
  });

  it("refuses approval by the AI/system or with an empty actor", async () => {
    const { campaignId } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    expect(await failure(db, `select acq_approve_campaign($1,$2,'ai')`, [campaignId, h])).toMatch(/acq_campaign_human_approver/);
    expect(await failure(db, `select acq_approve_campaign($1,$2,'')`, [campaignId, h])).toMatch(/approver required/);
  });

  it("refuses approval when a recipient lost eligibility after drafting", async () => {
    const contact = await eligibleContact(db, email());
    const { campaignId } = await draftCampaign(db, [contact]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    await db.query(`insert into acq_consent_records (contact_id, consent_type, reviewed_by, reviewed_at) values ($1,'withdrawn','neil',now())`, [contact]);
    expect(await failure(db, `select acq_approve_campaign($1,$2,'neil')`, [campaignId, h])).toMatch(/ineligible_recipient/);
  });

  it("cannot approve a campaign with no drafts", async () => {
    const camp = await one<{ id: string }>(db, `insert into acq_campaigns (name) values ('empty') returning id`);
    expect(await failure(db, `select acq_set_campaign_status($1,'pending_approval','neil')`, [camp.id])).toMatch(/no drafts/);
  });

  it("refuses activation if content changed after approval (even bypassing the freeze)", async () => {
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    await db.query(`select acq_approve_campaign($1,$2,'neil')`, [campaignId, h]);
    await db.query(`alter table acq_email_messages disable trigger acq_messages_guard_trg`);
    await db.query(`update acq_email_messages set body='sneaky' where id=$1`, [messages[0]]);
    await db.query(`alter table acq_email_messages enable trigger acq_messages_guard_trg`);
    expect(await failure(db, `select acq_set_campaign_status($1,'active','neil')`, [campaignId])).toMatch(/changed since approval/);
  });

  it("audits every status change with the acting user", async () => {
    const { campaignId } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await approveAndActivate(db, campaignId);
    const rows = (await db.query<{ action: string; actor_id: string }>(
      `select action, actor_id from acq_audit_logs where entity_type='campaign' and entity_id=$1 order by created_at, id`, [campaignId])).rows;
    expect(rows.map((r) => r.action)).toEqual(["campaign.pending_approval", "campaign.approved", "campaign.active"]);
    expect(rows.every((r) => r.actor_id === "neil")).toBe(true);
    expect(await failure(db, `delete from acq_audit_logs where entity_id=$1`, [campaignId])).toMatch(/append-only/);
  });
});

describe("send gate (acq_reserve_send)", () => {
  const reserve = async (id: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_reserve_send($1)`, [id]);

  it("fails closed: nothing sends while sending_paused is on (the default)", async () => {
    await db.query(`update acq_settings set value='true'::jsonb where key='sending_paused'`);
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await approveAndActivate(db, campaignId);
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "sending_paused" });
  });

  it("reserves an approved message exactly once", async () => {
    await unpause(db);
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await approveAndActivate(db, campaignId);
    expect(await reserve(messages[0])).toMatchObject({ ok: true });
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "message_not_approved" });
  });

  it("refuses before the campaign is launched, and after it is paused", async () => {
    await unpause(db);
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
    const h = (await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId])).h;
    await db.query(`select acq_approve_campaign($1,$2,'neil')`, [campaignId, h]);
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "campaign_not_active" });
    await db.query(`select acq_set_campaign_status($1,'active','neil')`, [campaignId]);
    await db.query(`select acq_set_campaign_status($1,'paused','neil')`, [campaignId]);
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "campaign_not_active" });
  });

  it("enforces the campaign daily cap", async () => {
    await unpause(db);
    const contacts = [await eligibleContact(db, email()), await eligibleContact(db, email()), await eligibleContact(db, email())];
    const { campaignId, messages } = await draftCampaign(db, contacts, { dailyLimit: 2 });
    await approveAndActivate(db, campaignId);
    expect((await reserve(messages[0])).ok).toBe(true);
    expect((await reserve(messages[1])).ok).toBe(true);
    expect(await reserve(messages[2])).toMatchObject({ ok: false, reason: "daily_limit_reached" });
  });

  it("detects message tampering that bypassed the freeze trigger", async () => {
    await unpause(db);
    const { campaignId, messages } = await draftCampaign(db, [await eligibleContact(db, email())]);
    await approveAndActivate(db, campaignId);
    await db.query(`alter table acq_email_messages disable trigger acq_messages_guard_trg`);
    await db.query(`update acq_email_messages set body='injected' where id=$1`, [messages[0]]);
    await db.query(`alter table acq_email_messages enable trigger acq_messages_guard_trg`);
    // The campaign hash covers the drafts, so the campaign-level check trips first.
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "campaign_content_changed" });
  });

  it("rechecks consent at send time (expiry after approval blocks the send)", async () => {
    await unpause(db);
    const contact = await eligibleContact(db, email());
    const { campaignId, messages } = await draftCampaign(db, [contact]);
    await approveAndActivate(db, campaignId);
    await db.query(`insert into acq_consent_records (contact_id, consent_type, reviewed_by, reviewed_at) values ($1,'withdrawn','neil',now())`, [contact]);
    expect(await reserve(messages[0])).toMatchObject({ ok: false, reason: "consent_invalid" });
  });
});

describe("job queue", () => {
  it("claims due jobs once, honours run_at, and de-duplicates by idempotency key", async () => {
    await db.query(`insert into acq_jobs (type, idempotency_key) values ('research','k1'), ('research','k2')`);
    await db.query(`insert into acq_jobs (type, idempotency_key, run_at) values ('research','later', now() + interval '1 hour')`);
    expect(await failure(db, `insert into acq_jobs (type, idempotency_key) values ('research','k1')`)).toMatch(/duplicate key/);

    const first = (await db.query<{ idempotency_key: string; attempts: number }>(`select * from acq_claim_jobs(10)`)).rows;
    expect(first.map((j) => j.idempotency_key).sort()).toEqual(["k1", "k2"]);
    expect(first.every((j) => j.attempts === 1)).toBe(true);
    expect((await db.query(`select * from acq_claim_jobs(10)`)).rows).toHaveLength(0);
  });

  it("re-claims a job stranded by a dead worker, and fails it once attempts are exhausted", async () => {
    await db.query(`insert into acq_jobs (type, idempotency_key, status, locked_at, attempts, max_attempts) values ('x','stale-ok','running', now() - interval '1 hour', 1, 3), ('x','stale-dead','running', now() - interval '1 hour', 3, 3)`);
    const claimed = (await db.query<{ idempotency_key: string }>(`select * from acq_claim_jobs(10)`)).rows.map((j) => j.idempotency_key);
    expect(claimed).toContain("stale-ok");
    expect(claimed).not.toContain("stale-dead");
    expect((await one<{ status: string }>(db, `select status from acq_jobs where idempotency_key='stale-dead'`)).status).toBe("failed");
  });
});
