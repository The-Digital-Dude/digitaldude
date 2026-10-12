import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
  // The rep outreach tables live outside the acquisition migrations; the function checks for them at call time.
  await db.exec(`
    create table public.rep_campaigns (id uuid primary key default gen_random_uuid(), rep_id uuid, status text default 'active');
    create table public.rep_campaign_enrollments (id uuid primary key default gen_random_uuid(), rep_id uuid, status text default 'active');
    create table public.rep_campaign_queue (id uuid primary key default gen_random_uuid(), rep_id uuid, status text default 'pending', error_message text);
  `);
});

const rep = async () => (await one<{ id: string }>(db, `insert into employees (full_name, email, status, onboarding_completed) values ('R','r@x.com','active',true) returning id`)).id;
const seed = async (r: string) => {
  await db.query(`insert into rep_campaigns (rep_id) values ($1)`, [r]);
  await db.query(`insert into rep_campaign_enrollments (rep_id) values ($1),($1)`, [r]);
  await db.query(`insert into rep_campaign_queue (rep_id) values ($1),($1),($1)`, [r]);
  await db.query(`insert into rep_campaign_queue (rep_id, status) values ($1,'sent')`, [r]);
};
const counts = async (r: string) =>
  one<{ camp: string; enr: string; pend: string; sent: string; cancelled: string }>(
    db,
    `select
       (select count(*) from rep_campaigns where rep_id=$1 and status='paused')::text as camp,
       (select count(*) from rep_campaign_enrollments where rep_id=$1 and status='cancelled_manual')::text as enr,
       (select count(*) from rep_campaign_queue where rep_id=$1 and status='pending')::text as pend,
       (select count(*) from rep_campaign_queue where rep_id=$1 and status='sent')::text as sent,
       (select count(*) from rep_campaign_queue where rep_id=$1 and status='cancelled' and error_message='Rep offboarded')::text as cancelled`,
    [r]
  );

describe("offboarding stops outreach and releases the pool", () => {
  it("pauses campaigns, cancels active drips and pending emails for ONLY that rep, and keeps sent history", async () => {
    const a = await rep();
    const b = await rep();
    await seed(a);
    await seed(b);
    await db.query(`update employees set status='offboarded' where id=$1`, [a]);
    expect(await counts(a)).toEqual({ camp: "1", enr: "2", pend: "0", sent: "1", cancelled: "3" });
    expect(await counts(b)).toEqual({ camp: "0", enr: "0", pend: "3", sent: "1", cancelled: "0" });
  });

  it("also releases their pool companies in the same step", async () => {
    const a = await rep();
    const co = await one<{ id: string }>(db, `insert into acq_companies (name, country) values ('Owned Co','AU') returning id`);
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[co.id], a]);
    await db.query(`update employees set status='offboarded' where id=$1`, [a]);
    expect(await one(db, `select owner_employee_id, pool_status from acq_companies where id=$1`, [co.id])).toMatchObject({ owner_employee_id: null, pool_status: "unassigned" });
  });

  it("deleting a rep behaves the same, and other status changes do nothing", async () => {
    const a = await rep();
    await seed(a);
    await db.query(`update employees set status='onboarding' where id=$1`, [a]);
    expect((await counts(a)).pend).toBe("3");
    await db.query(`delete from employees where id=$1`, [a]);
    expect((await counts(a)).pend).toBe("0");
  });

  it("is safe when the rep outreach tables do not exist", async () => {
    const fresh = await createDb();
    const r = (await one<{ id: string }>(fresh, `insert into employees (full_name, status) values ('X','active') returning id`)).id;
    await fresh.query(`update employees set status='offboarded' where id=$1`, [r]);
    expect((await one<{ n: number }>(fresh, `select acq_stop_rep_outreach($1) as n`, [r])).n).toBe(0);
  });
});
