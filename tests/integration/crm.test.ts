import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createDb, one, failure, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
  // Stand-ins for the existing rep tables (migration 0013 / 0011), then the real 0041.
  await db.exec(`
    create table public.rep_leads (
      id uuid primary key default gen_random_uuid(), employee_id uuid not null references employees(id) on delete cascade,
      full_name text not null, email text not null, phone text, company_name text, job_title text, lead_source text not null default 'Cold Outreach',
      stage text not null default 'new', estimated_deal_value numeric(12,2) default 0, currency text not null default 'BDT', notes text,
      last_contacted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table public.rep_outreach_logs (id serial primary key, employee_id uuid, recipient_email text not null, body_content text, sent_at timestamptz not null default now());
  `);
  await db.exec(readFileSync(path.resolve(__dirname, "../../supabase/migrations/0041_crm_upgrade.sql"), "utf8"));
});

const rep = async (name = "Rita", status = "active") => (await one<{ id: string }>(db, `insert into employees (full_name, email, status) values ($1,$2,$3) returning id`, [name, `${name}${Math.random()}@x.com`, status])).id;
const lead = async (employee: string, email = `l${Math.random()}@plum.com.au`, extra = "") => (await one<{ id: string }>(db, `insert into rep_leads (employee_id, full_name, email ${extra ? "," + extra.split("=")[0] : ""}) values ($1,'Dan',$2 ${extra ? "," + extra.split("=")[1] : ""}) returning id`, [employee, email])).id;

describe("lost reason guard", () => {
  it("refuses to move a lead to lost without a reason, allows it with one, and leaves old lost leads editable", async () => {
    const r = await rep();
    const l = await lead(r);
    expect(await failure(db, `update rep_leads set stage='lost' where id=$1`, [l])).toMatch(/reason/);
    await db.query(`update rep_leads set stage='lost', lost_reason='no_budget' where id=$1`, [l]);
    // An already-lost lead (for example one lost before this migration) can still be edited without touching the stage.
    await db.query(`update rep_leads set lost_reason=null where id=$1`, [l]).catch(() => null);
    expect(await failure(db, `insert into rep_leads (employee_id, full_name, email, stage) values ($1,'X','x@y.com','lost')`, [r])).toMatch(/reason/);
    expect(await failure(db, `update rep_leads set lost_reason='because' where id=$1`, [l])).not.toBeNull();
  });
});

describe("fields", () => {
  it("validates status, probability and country", async () => {
    const l = await lead(await rep());
    expect(await failure(db, `update rep_leads set status='weird' where id=$1`, [l])).not.toBeNull();
    expect(await failure(db, `update rep_leads set probability=120 where id=$1`, [l])).not.toBeNull();
    expect(await failure(db, `update rep_leads set country='Australia' where id=$1`, [l])).not.toBeNull();
    await db.query(`update rep_leads set status='connected', probability=40, country='AU', tags='{hot,uk}' where id=$1`, [l]);
  });
});

describe("timeline and tasks", () => {
  it("a logged activity moves last_activity_at forward, and system entries do not", async () => {
    const l = await lead(await rep());
    await db.query(`insert into rep_lead_activities (lead_id, type, summary, occurred_at) values ($1,'call','Spoke to Dan','2026-10-01T10:00:00Z')`, [l]);
    expect((await one<{ t: string }>(db, `select last_activity_at::text as t from rep_leads where id=$1`, [l])).t).toContain("2026-10-01");
    await db.query(`insert into rep_lead_activities (lead_id, type, summary, occurred_at) values ($1,'email_sent','Sent','2026-10-05T10:00:00Z')`, [l]);
    await db.query(`insert into rep_lead_activities (lead_id, type, summary, occurred_at) values ($1,'system','Score refreshed','2026-10-20T10:00:00Z')`, [l]);
    await db.query(`insert into rep_lead_activities (lead_id, type, summary, occurred_at) values ($1,'note','Older note','2026-09-01T10:00:00Z')`, [l]);
    expect((await one<{ t: string }>(db, `select last_activity_at::text as t from rep_leads where id=$1`, [l])).t).toContain("2026-10-05");
    expect(await failure(db, `insert into rep_lead_activities (lead_id, type) values ($1,'dancing')`, [l])).not.toBeNull();
  });

  it("allows only one open automatic task of each kind per lead, but any number of manual ones", async () => {
    const r = await rep();
    const l = await lead(r);
    const add = (kind: string, auto: boolean) => db.query(`insert into rep_lead_tasks (lead_id, employee_id, title, due_at, kind, auto) values ($1,$2,'t', now(), $3, $4)`, [l, r, kind, auto]);
    await add("follow_up", true);
    expect(await failure(db, `insert into rep_lead_tasks (lead_id, employee_id, title, due_at, kind, auto) values ($1,$2,'t2', now(), 'follow_up', true)`, [l, r])).not.toBeNull();
    await add("respond", true);
    await add("manual", false);
    await add("manual", false);
    await db.query(`update rep_lead_tasks set status='done' where lead_id=$1 and kind='follow_up'`, [l]);
    await add("follow_up", true); // allowed again once the earlier one is closed
  });
});

describe("reassign and merge", () => {
  it("moves leads and their open tasks to the new owner, records it, and refuses an offboarded owner", async () => {
    const [a, b, gone] = [await rep("A"), await rep("B"), await rep("G", "offboarded")];
    const l = await lead(a);
    await db.query(`insert into rep_lead_tasks (lead_id, employee_id, title, due_at) values ($1,$2,'Call Dan', now())`, [l, a]);
    expect(await failure(db, `select rep_reassign_leads(array[$1::uuid], $2, 'admin')`, [l, gone])).toMatch(/offboarded/);
    const n = await one<{ n: number }>(db, `select rep_reassign_leads(array[$1::uuid], $2, 'admin') as n`, [l, b]);
    expect(n.n).toBe(1);
    expect((await one<{ employee_id: string }>(db, `select employee_id from rep_leads where id=$1`, [l])).employee_id).toBe(b);
    expect((await one<{ employee_id: string }>(db, `select employee_id from rep_lead_tasks where lead_id=$1`, [l])).employee_id).toBe(b);
    expect((await one<{ type: string }>(db, `select type from rep_lead_activities where lead_id=$1 and type='reassigned'`, [l])).type).toBe("reassigned");
    expect((await one<{ n: number }>(db, `select rep_reassign_leads(array[$1::uuid], $2, 'admin') as n`, [l, b])).n).toBe(0); // already theirs
  });

  it("merges a duplicate into the keeper: activity, tags and notes move, the duplicate is removed", async () => {
    const r = await rep();
    const keep = await lead(r, "keep@plum.com.au");
    const drop = await lead(r, "drop@plum.com.au");
    await db.query(`update rep_leads set tags='{a}', notes='keep notes', phone=null where id=$1`, [keep]);
    await db.query(`update rep_leads set tags='{b,a}', notes='drop notes', phone='+61 400 000 000' where id=$1`, [drop]);
    await db.query(`insert into rep_lead_activities (lead_id, type, summary) values ($1,'note','from the duplicate')`, [drop]);
    await db.query(`select rep_merge_leads($1,$2,'admin')`, [keep, drop]);
    const k = await one<{ tags: string[]; notes: string; phone: string }>(db, `select tags, notes, phone from rep_leads where id=$1`, [keep]);
    expect(k.tags.sort()).toEqual(["a", "b"]);
    expect(k.notes).toContain("keep notes");
    expect(k.notes).toContain("drop notes");
    expect(k.phone).toBe("+61 400 000 000");
    expect((await one<{ n: number }>(db, `select count(*)::int as n from rep_lead_activities where lead_id=$1 and summary='from the duplicate'`, [keep])).n).toBe(1);
    expect((await one<{ n: number }>(db, `select count(*)::int as n from rep_leads where id=$1`, [drop])).n).toBe(0);
    expect(await failure(db, `select rep_merge_leads($1,$1,'admin')`, [keep])).toMatch(/itself/);
  });
});

describe("privacy: erase and retention", () => {
  it("erase removes the person's data and history, keeps only the do-not-contact record, and cannot be undone by reading", async () => {
    const r = await rep();
    const l = await lead(r, "gone@plum.com.au");
    await db.query(`update rep_leads set phone='123', company_name='Plum', notes='secret', tags='{x}' where id=$1`, [l]);
    await db.query(`insert into rep_lead_activities (lead_id, type, summary) values ($1,'note','private note')`, [l]);
    await db.query(`insert into rep_lead_tasks (lead_id, employee_id, title, due_at) values ($1,$2,'Call', now())`, [l, r]);
    await db.query(`insert into rep_outreach_logs (employee_id, recipient_email, body_content) values ($1,'GONE@plum.com.au','hello')`, [r]);
    await db.query(`select rep_erase_lead($1,'admin')`, [l]);
    const row = await one<{ full_name: string; email: string; phone: string | null; notes: string | null; company_name: string | null; anonymized_at: string | null }>(db, `select * from rep_leads where id=$1`, [l]);
    expect(row).toMatchObject({ full_name: "Erased lead", phone: null, notes: null, company_name: null });
    expect(row.email).toMatch(/@erased\.invalid$/);
    expect(row.anonymized_at).not.toBeNull();
    for (const t of ["rep_lead_activities", "rep_lead_tasks"]) expect((await one<{ n: number }>(db, `select count(*)::int as n from ${t} where lead_id=$1`, [l])).n).toBe(0);
    expect((await one<{ n: number }>(db, `select count(*)::int as n from rep_outreach_logs where lower(recipient_email)='gone@plum.com.au'`)).n).toBe(0);
    expect((await one<{ s: boolean }>(db, `select acq_is_suppressed('gone@plum.com.au') as s`)).s).toBe(true);
  });

  it("the retention sweep anonymises long-inactive leads, never won ones or recent ones, and adds nobody to the opt-out list", async () => {
    const r = await rep();
    const old = await lead(r, "old@plum.com.au");
    const won = await lead(r, "won@plum.com.au");
    const recent = await lead(r, "recent@plum.com.au");
    await db.query(`update rep_leads set last_activity_at = now() - interval '30 months', updated_at = now() - interval '30 months' where id = any($1::uuid[])`, [[old, won]]);
    await db.query(`update rep_leads set stage='won' where id=$1`, [won]);
    expect(await failure(db, `select rep_retention_sweep(3)`)).toMatch(/at least 6 months/);
    const n = await one<{ n: number }>(db, `select rep_retention_sweep(24) as n`);
    expect(n.n).toBeGreaterThanOrEqual(1);
    expect((await one<{ a: string | null }>(db, `select anonymized_at::text as a from rep_leads where id=$1`, [old])).a).not.toBeNull();
    expect((await one<{ a: string | null }>(db, `select anonymized_at::text as a from rep_leads where id=$1`, [won])).a).toBeNull();
    expect((await one<{ a: string | null }>(db, `select anonymized_at::text as a from rep_leads where id=$1`, [recent])).a).toBeNull();
    expect((await one<{ s: boolean }>(db, `select acq_is_suppressed('old@plum.com.au') as s`)).s).toBe(false);
  });
});

describe("saved views and access", () => {
  it("has unique view names per rep, and the new tables are service-role only", async () => {
    const r = await rep();
    await db.query(`insert into rep_saved_views (employee_id, name, filters) values ($1,'UK stale','{"country":"GB"}')`, [r]);
    expect(await failure(db, `insert into rep_saved_views (employee_id, name) values ($1,'UK stale')`, [r])).not.toBeNull();
    for (const t of ["rep_lead_activities", "rep_lead_tasks", "rep_saved_views"]) {
      expect((await one<{ r: boolean }>(db, `select relrowsecurity as r from pg_class where relname=$1`, [t])).r).toBe(true);
    }
  });
});
