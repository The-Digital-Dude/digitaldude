import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createDb, one } from "./db";

const sql0025 = readFileSync(path.resolve(__dirname, "../../supabase/migrations/0025_rep_security_shared_suppression.sql"), "utf8");

describe("migration 0025 (rep security + shared suppression)", () => {
  it("copies legacy rep unsubscribes into the shared list, idempotently, and enables RLS on rep tables", async () => {
    const db = await createDb();
    await db.exec(`
      create table public.rep_unsubscribes (id uuid primary key default gen_random_uuid(), email text unique not null);
      create table public.rep_leads (id uuid primary key default gen_random_uuid(), email text);
      insert into public.rep_unsubscribes (email) values (' Gone@Acme.com '), ('other@beta.com');
    `);
    await db.exec(sql0025);
    await db.exec(sql0025); // re-runnable

    const rows = await db.query<{ normalized_email: string; reason: string; source: string }>(`select normalized_email, reason, source from acq_suppressions order by normalized_email`);
    expect(rows.rows.map((r) => r.normalized_email)).toEqual(["gone@acme.com", "other@beta.com"]);
    expect(rows.rows[0]).toMatchObject({ reason: "unsubscribe", source: "legacy_rep_unsubscribe" });
    expect((await one<{ s: boolean }>(db, `select acq_is_suppressed('GONE@acme.com') as s`)).s).toBe(true);

    const rls = await db.query<{ relname: string; relrowsecurity: boolean }>(`select relname, relrowsecurity from pg_class where relname in ('rep_unsubscribes','rep_leads') order by relname`);
    expect(rls.rows.every((r) => r.relrowsecurity)).toBe(true);
  });

  it("seeds a default sender identity without overwriting an edited one", async () => {
    const db = await createDb();
    await db.exec(sql0025);
    expect((await one<{ v: { business: string } }>(db, `select value as v from acq_settings where key='sender_identity'`)).v.business).toBe("The Digital Dude");
    await db.exec(`update acq_settings set value = '{"business":"Edited","postalAddress":"1 St"}'::jsonb where key='sender_identity'`);
    await db.exec(sql0025);
    expect((await one<{ v: { business: string } }>(db, `select value as v from acq_settings where key='sender_identity'`)).v.business).toBe("Edited");
  });
});
