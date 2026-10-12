import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, type Db } from "./db";

let db: Db;
let marketId: string;
let otherMarketId: string;
beforeAll(async () => {
  db = await createDb();
  marketId = (await one<{ id: string }>(db, `select id from acq_markets where name='Property management - Australia'`)).id;
  otherMarketId = (await one<{ id: string }>(db, `insert into acq_markets (name, industry, country) values ('Law - GB','Law','GB') returning id`)).id;
});

let n = 0;
const rep = async (opts: { status?: string; onboarded?: boolean } = {}) =>
  (await one<{ id: string }>(db, `insert into employees (full_name, email, status, onboarding_completed) values ($1,$2,$3,$4) returning id`, [`Rep ${++n}`, `rep${n}@x.com`, opts.status ?? "active", opts.onboarded ?? true])).id;
const company = async (market: string | null = marketId, extra = "") =>
  (await one<{ id: string }>(db, `insert into acq_companies (name, country, market_id${extra ? ", fit_score" : ""}) values ($1,'AU',$2${extra ? ", " + extra : ""}) returning id`, [`Co ${++n}`, market])).id;
const claim = (c: string, e: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_claim_company($1,$2)`, [c, e]);
const owner = (c: string) => one<{ owner_employee_id: string | null; pool_status: string; assignment_source: string | null }>(db, `select owner_employee_id, pool_status, assignment_source from acq_companies where id=$1`, [c]);

describe("admin bulk assignment", () => {
  it("assigns many companies in one call, sets status, and logs each change", async () => {
    const r = await rep();
    const ids = [await company(), await company(), await company()];
    expect((await one<{ n: number }>(db, `select acq_assign_companies($1::uuid[], $2, 'neil') as n`, [ids, r])).n).toBe(3);
    for (const id of ids) expect(await owner(id)).toMatchObject({ owner_employee_id: r, pool_status: "assigned", assignment_source: "admin" });
    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_assignment_log where to_employee_id=$1 and action='assign'`, [r])).c).toBe("3");
  });

  it("reassigns and unassigns, keeping history; finished companies keep their outcome", async () => {
    const a = await rep();
    const b = await rep();
    const c = await company();
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[c], a]);
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[c], b]);
    expect((await owner(c)).owner_employee_id).toBe(b);
    await db.query(`select acq_assign_companies($1::uuid[], null, 'neil')`, [[c]]);
    expect(await owner(c)).toMatchObject({ owner_employee_id: null, pool_status: "unassigned" });
    const log = await db.query<{ action: string }>(`select action from acq_assignment_log where company_id=$1 order by created_at, id`, [c]);
    expect(log.rows.map((r) => r.action)).toEqual(["assign", "assign", "unassign"]);

    const won = await company();
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[won], a]);
    await db.query(`update acq_companies set pool_status='won' where id=$1`, [won]);
    await db.query(`select acq_assign_companies($1::uuid[], null, 'neil')`, [[won]]);
    expect((await owner(won)).pool_status).toBe("won");
  });

  it("refuses an offboarded employee and skips archived companies", async () => {
    const gone = await rep({ status: "offboarded" });
    expect(await failure(db, `select acq_assign_companies($1::uuid[], $2, 'neil')`, [[await company()], gone])).toMatch(/offboarded/);
    const r = await rep();
    const arch = await company();
    await db.query(`update acq_companies set status='archived' where id=$1`, [arch]);
    expect((await one<{ n: number }>(db, `select acq_assign_companies($1::uuid[], $2, 'neil') as n`, [[arch], r])).n).toBe(0);
  });

  it("an owned company can never be 'unassigned' and an unowned one cannot be 'contacted'", async () => {
    const r = await rep();
    const c = await company();
    expect(await failure(db, `update acq_companies set pool_status='contacted' where id=$1`, [c])).toMatch(/owner_status_check/);
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[c], r]);
    expect(await failure(db, `update acq_companies set pool_status='unassigned' where id=$1`, [c])).toMatch(/owner_status_check/);
  });
});

describe("rep claiming", () => {
  it("lets an onboarded rep claim an unowned company in an allowed market, exactly once", async () => {
    const r1 = await rep();
    const r2 = await rep();
    await db.query(`insert into acq_rep_markets (employee_id, market_id) values ($1,$3),($2,$3)`, [r1, r2, marketId]);
    const c = await company();
    expect(await claim(c, r1)).toMatchObject({ ok: true });
    expect(await owner(c)).toMatchObject({ owner_employee_id: r1, assignment_source: "claim" });
    expect(await claim(c, r2)).toMatchObject({ ok: false, reason: "already_owned" });
  });

  it("refuses markets the rep is not allowed in, companies with no market, inactive and not-onboarded reps", async () => {
    const r = await rep();
    await db.query(`insert into acq_rep_markets (employee_id, market_id) values ($1,$2)`, [r, marketId]);
    expect(await claim(await company(otherMarketId), r)).toMatchObject({ ok: false, reason: "market_not_allowed" });
    expect(await claim(await company(null), r)).toMatchObject({ ok: false, reason: "no_market" });
    expect(await claim(await company(), await rep({ onboarded: false }))).toMatchObject({ ok: false, reason: "rep_not_active" });
    expect(await claim(await company(), await rep({ status: "offboarded" }))).toMatchObject({ ok: false, reason: "rep_not_active" });
    expect(await claim(await company(), (await one<{ id: string }>(db, `select gen_random_uuid() as id`)).id)).toMatchObject({ ok: false, reason: "rep_not_active" });
  });

  it("enforces the claim cap on open companies, and finishing one frees a slot", async () => {
    const r = await rep();
    await db.query(`insert into acq_rep_markets (employee_id, market_id, claim_cap) values ($1,$2,2)`, [r, marketId]);
    const [a, b, c] = [await company(), await company(), await company()];
    expect(await claim(a, r)).toMatchObject({ ok: true });
    expect(await claim(b, r)).toMatchObject({ ok: true });
    expect(await claim(c, r)).toMatchObject({ ok: false, reason: "claim_cap_reached" });
    await db.query(`update acq_companies set pool_status='lost' where id=$1`, [a]);
    expect(await claim(c, r)).toMatchObject({ ok: true });
  });

  it("a zero cap means no claiming", async () => {
    const r = await rep();
    await db.query(`insert into acq_rep_markets (employee_id, market_id, claim_cap) values ($1,$2,0)`, [r, marketId]);
    expect(await claim(await company(), r)).toMatchObject({ ok: false, reason: "claim_cap_reached" });
  });
});

describe("assignment rules", () => {
  it("assigns a new company to the first matching enabled rule by priority and score", async () => {
    const low = await rep();
    const top = await rep();
    await db.query(`insert into acq_assignment_rules (employee_id, market_id, priority) values ($1,$3,50),($2,$3,10)`, [low, top, otherMarketId]);
    await db.query(`insert into acq_assignment_rules (employee_id, market_id, min_fit_score, priority) values ($1,$2,70,5)`, [low, marketId]);
    const mid = await company(marketId, "60");
    expect((await one<{ e: string | null }>(db, `select acq_apply_assignment_rules($1) as e`, [mid])).e).toBeNull(); // score below 70
    const high = await company(marketId, "85");
    expect((await one<{ e: string | null }>(db, `select acq_apply_assignment_rules($1) as e`, [high])).e).toBe(low);
    expect(await owner(high)).toMatchObject({ assignment_source: "rule", pool_status: "assigned" });
    const gb = await company(otherMarketId);
    expect((await one<{ e: string | null }>(db, `select acq_apply_assignment_rules($1) as e`, [gb])).e).toBe(top);
  });

  it("never reassigns an owned company and ignores disabled rules and offboarded reps", async () => {
    const owner1 = await rep();
    const gone = await rep({ status: "offboarded" });
    const m = (await one<{ id: string }>(db, `insert into acq_markets (name, industry, country) values ('Rules - X','X','AU') returning id`)).id;
    await db.query(`insert into acq_assignment_rules (employee_id, market_id, priority) values ($1,$2,1)`, [gone, m]);
    await db.query(`insert into acq_assignment_rules (employee_id, market_id, priority, enabled) values ($1,$2,2,false)`, [owner1, m]);
    const c = await company(m);
    expect((await one<{ e: string | null }>(db, `select acq_apply_assignment_rules($1) as e`, [c])).e).toBeNull();
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[c], owner1]);
    await db.query(`insert into acq_assignment_rules (employee_id, market_id, priority) values ($1,$2,0)`, [await rep(), m]);
    expect((await one<{ e: string | null }>(db, `select acq_apply_assignment_rules($1) as e`, [c])).e).toBeNull();
    expect((await owner(c)).owner_employee_id).toBe(owner1);
  });

  it("a rule must have at least one criterion", async () => {
    expect(await failure(db, `insert into acq_assignment_rules (employee_id) values ($1)`, [await rep()])).toMatch(/has_criteria/);
  });
});

describe("offboarding keeps pool data", () => {
  it("offboarding a rep returns their open companies to the pool and logs it", async () => {
    const r = await rep();
    const [open, won] = [await company(), await company()];
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[open, won], r]);
    await db.query(`update acq_companies set pool_status='won' where id=$1`, [won]);
    await db.query(`update employees set status='offboarded' where id=$1`, [r]);
    expect(await owner(open)).toMatchObject({ owner_employee_id: null, pool_status: "unassigned" });
    expect(await owner(won)).toMatchObject({ owner_employee_id: null, pool_status: "won" });
    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_assignment_log where from_employee_id=$1 and action='release'`, [r])).c).toBe("2");
  });

  it("deleting an employee releases their companies instead of deleting or blocking", async () => {
    const r = await rep();
    const c = await company();
    await db.query(`select acq_assign_companies($1::uuid[], $2, 'neil')`, [[c], r]);
    await db.query(`delete from employees where id=$1`, [r]);
    expect(await owner(c)).toMatchObject({ owner_employee_id: null, pool_status: "unassigned" });
  });
});

describe("contact_count", () => {
  it("tracks contacts added, moved and removed so the 'needs contact' queue is filterable", async () => {
    const a = await company();
    const b = await company();
    const count = async (id: string) => (await one<{ contact_count: number }>(db, `select contact_count from acq_companies where id=$1`, [id])).contact_count;
    expect(await count(a)).toBe(0);
    const k = await one<{ id: string }>(db, `insert into acq_contacts (company_id, email) values ($1,$2) returning id`, [a, `cc${++n}@x.com.au`]);
    await db.query(`insert into acq_contacts (company_id, email) values ($1,$2)`, [a, `cc${++n}@x.com.au`]);
    expect(await count(a)).toBe(2);
    await db.query(`update acq_contacts set company_id=$1 where id=$2`, [b, k.id]);
    expect([await count(a), await count(b)]).toEqual([1, 1]);
    await db.query(`delete from acq_contacts where id=$1`, [k.id]);
    expect(await count(b)).toBe(0);
  });
});
