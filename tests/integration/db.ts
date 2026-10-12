import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Boots an in-process Postgres (PGlite) and applies the real acquisition
 * migration, so the tests exercise the actual triggers and functions that
 * enforce the compliance rules in production.
 */
export async function createDb() {
  const db = new PGlite();
  // Minimal stand-in for the existing employees table (later migrations reference it).
  await db.exec(`create table public.employees (id uuid primary key default gen_random_uuid(), full_name text, email text, status text not null default 'active', onboarding_completed boolean default false)`);
  for (const file of ["0022_acquisition_system.sql", "0023_acquisition_autoresearch.sql", "0026_markets_countries_dedupe.sql", "0027_pool_assignment.sql", "0029_rep_pool.sql", "0030_contact_finder.sql", "0031_offboarding_outreach.sql", "0032_claim_cap_all_open.sql", "0033_reserve_send_company_closed.sql", "0034_setup_markets_one_contact_rule.sql"]) {
    await db.exec(readFileSync(path.resolve(__dirname, "../../supabase/migrations", file), "utf8"));
  }
  return db;
}

export type Db = Awaited<ReturnType<typeof createDb>>;

export async function one<T = Record<string, unknown>>(db: Db, q: string, params: unknown[] = []): Promise<T> {
  const r = await db.query<T>(q, params);
  return r.rows[0];
}

/** Resolves to the error message if the statement throws, else null. */
export async function failure(db: Db, q: string, params: unknown[] = []): Promise<string | null> {
  try {
    await db.query(q, params);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export async function unpause(db: Db) {
  await db.query(`update acq_settings set value = 'false'::jsonb where key = 'sending_paused'`);
}

/** Creates a contact with a valid, reviewed consent basis and marks it eligible. */
export async function eligibleContact(db: Db, email: string) {
  const co = await one<{ id: string }>(db, `insert into acq_companies (name, country) values ($1,'AU') returning id`, [`Co ${email}`]);
  const c = await one<{ id: string }>(db, `insert into acq_contacts (company_id, email, source_url, source_type) values ($1,$2,'https://example.com.au/contact','company_website') returning id`, [co.id, email]);
  await db.query(
    `insert into acq_consent_records (contact_id, consent_type, legal_basis, evidence_url, evidence_notes, reviewed_by, reviewed_at)
     values ($1,'inferred_publication','Conspicuously published business address; relevant to role','https://example.com.au/contact','Reviewed page','neil', now())`,
    [c.id]
  );
  await db.query(`update acq_contacts set status = 'eligible' where id = $1`, [c.id]);
  return c.id;
}

export async function draftCampaign(db: Db, contactIds: string[], opts: { dailyLimit?: number } = {}) {
  const camp = await one<{ id: string }>(
    db,
    `insert into acq_campaigns (name, daily_limit, sender_name, sender_business, sender_postal_address, sender_email, subject_template, body_template, followup_body_template)
     values ('Pilot', $1, 'Neil', 'The Digital Dude', '1 Example St, Dhaka', 'neil@digitaldude.co.uk', 'Hello {{first_name}}', 'Body {{unsubscribe_url}}', 'Follow up {{unsubscribe_url}}') returning id`,
    [opts.dailyLimit ?? 5]
  );
  const messages: string[] = [];
  const leads: string[] = [];
  for (const cid of contactIds) {
    const lead = await one<{ id: string }>(db, `insert into acq_campaign_leads (campaign_id, contact_id) values ($1,$2) returning id`, [camp.id, cid]);
    leads.push(lead.id);
    const msg = await one<{ id: string }>(db, `insert into acq_email_messages (campaign_lead_id, subject, body) values ($1,'Hi','Hello there') returning id`, [lead.id]);
    messages.push(msg.id);
  }
  return { campaignId: camp.id, leads, messages };
}

export async function approveAndActivate(db: Db, campaignId: string) {
  await db.query(`select acq_set_campaign_status($1,'pending_approval','neil')`, [campaignId]);
  const h = await one<{ h: string }>(db, `select acq_campaign_content_hash($1) as h`, [campaignId]);
  await db.query(`select acq_approve_campaign($1,$2,'neil')`, [campaignId, h.h]);
  await db.query(`select acq_set_campaign_status($1,'active','neil')`, [campaignId]);
}
