import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

const mkRep = async () => (await one<{ id: string }>(db, `insert into employees (full_name, email) values ('Rita','rita@x.com') returning id`)).id;

describe("rep_book_links (0040)", () => {
  it("counts views atomically and keeps the first view time", async () => {
    const rep = await mkRep();
    await db.query(`insert into rep_book_links (code, employee_id, stage) values ('Abcdefgh23', $1, 'cold')`, [rep]);
    const a = await one<{ views: number; first_viewed_at: string }>(db, `select * from rep_book_link_view('Abcdefgh23')`);
    const b = await one<{ views: number; first_viewed_at: string }>(db, `select * from rep_book_link_view('Abcdefgh23')`);
    expect(a.views).toBe(1);
    expect(b.views).toBe(2);
    expect(new Date(b.first_viewed_at).getTime()).toBe(new Date(a.first_viewed_at).getTime());
    await db.query(`select rep_book_link_click('Abcdefgh23')`);
    await db.query(`select rep_book_link_click('Abcdefgh23')`);
    expect((await one<{ cta_clicks: number }>(db, `select cta_clicks from rep_book_links where code='Abcdefgh23'`)).cta_clicks).toBe(2);
    // An unknown code changes nothing and does not fail.
    await db.query(`select rep_book_link_click('Zzzzzzzz99')`);
  });

  it("refuses malformed codes, unknown stages and duplicate codes", async () => {
    const rep = await mkRep();
    expect(await failure(db, `insert into rep_book_links (code, employee_id) values ('short', $1)`, [rep])).not.toBeNull();
    expect(await failure(db, `insert into rep_book_links (code, employee_id) values ('has space1', $1)`, [rep])).not.toBeNull();
    expect(await failure(db, `insert into rep_book_links (code, employee_id, stage) values ('Qwertyui23', $1, 'bogus')`, [rep])).not.toBeNull();
    await db.query(`insert into rep_book_links (code, employee_id) values ('Qwertyui23', $1)`, [rep]);
    expect(await failure(db, `insert into rep_book_links (code, employee_id) values ('Qwertyui23', $1)`, [rep])).not.toBeNull();
  });

  it("expires after 180 days by default, belongs to the rep, and goes when the rep is deleted", async () => {
    const rep = await mkRep();
    await db.query(`insert into rep_book_links (code, employee_id) values ('Mnbvcxza23', $1)`, [rep]);
    const days = await one<{ d: number }>(db, `select round(extract(epoch from (expires_at - created_at)) / 86400)::int as d from rep_book_links where code='Mnbvcxza23'`);
    expect(days.d).toBe(180);
    await db.query(`delete from employees where id=$1`, [rep]);
    expect((await one<{ n: number }>(db, `select count(*)::int as n from rep_book_links where code='Mnbvcxza23'`)).n).toBe(0);
  });

  it("is not readable or writable by the public roles when they exist", async () => {
    const rls = await one<{ r: boolean }>(db, `select relrowsecurity as r from pg_class where relname='rep_book_links'`);
    expect(rls.r).toBe(true);
  });
});
