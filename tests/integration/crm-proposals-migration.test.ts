import { describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Database Migration: 0042_crm_proposals_closing", () => {
  it("applies cleanly, creates columns & indexes, enforces foreign keys, and is idempotent", async () => {
    const db = new PGlite();

    // 1. Create base tables that migrations 0005, 0010, 0013, 0014 create
    await db.exec(`
      create table public.employees (
        id uuid primary key default gen_random_uuid(),
        full_name text not null,
        email text not null,
        status text not null default 'active'
      );

      create table public.bookings (
        id uuid primary key default gen_random_uuid(),
        name text,
        email text,
        created_at timestamptz default now()
      );

      create table public.rep_leads (
        id uuid primary key default gen_random_uuid(),
        employee_id uuid references public.employees(id) on delete cascade,
        full_name text not null,
        email text not null,
        company_name text,
        stage text not null default 'new',
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );

      create table public.client_projects (
        id uuid primary key default gen_random_uuid(),
        client_name text not null,
        client_email text not null,
        company_name text,
        project_title text not null,
        created_at timestamptz default now()
      );
    `);

    // 2. Apply 0005_proposals.sql
    const sql0005 = readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/0005_proposals.sql"),
      "utf8"
    );
    await db.exec(sql0005);

    // 3. Apply 0042_crm_proposals_closing.sql
    const sql0042 = readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/0042_crm_proposals_closing.sql"),
      "utf8"
    );
    await db.exec(sql0042);

    // 4. Verify columns exist on public.proposals
    const colsResult = await db.query<{ column_name: string; data_type: string }>(`
      select column_name, data_type 
      from information_schema.columns 
      where table_schema = 'public' and table_name = 'proposals'
      order by column_name;
    `);
    const colNames = colsResult.rows.map((r) => r.column_name);

    expect(colNames).toContain("lead_id");
    expect(colNames).toContain("created_by_rep_id");
    expect(colNames).toContain("is_active");
    expect(colNames).toContain("version");
    expect(colNames).toContain("view_count");
    expect(colNames).toContain("last_viewed_at");
    expect(colNames).toContain("signed_at");
    expect(colNames).toContain("signed_by_name");
    expect(colNames).toContain("signed_by_title");
    expect(colNames).toContain("signed_signature_data");
    expect(colNames).toContain("signed_ip");
    expect(colNames).toContain("signed_user_agent");
    expect(colNames).toContain("legal_agreement_hash");
    expect(colNames).toContain("project_id");

    // 5. Verify indexes exist
    const idxResult = await db.query<{ indexname: string }>(`
      select indexname from pg_indexes where tablename = 'proposals';
    `);
    const idxNames = idxResult.rows.map((r) => r.indexname);
    expect(idxNames).toContain("idx_proposals_lead_id");
    expect(idxNames).toContain("idx_proposals_rep_id");
    expect(idxNames).toContain("idx_proposals_signed_at");

    // 6. Test insertion with linkage & execution metadata
    const emp = await db.query<{ id: string }>(
      `insert into public.employees (full_name, email) values ('Sarah Rep', 'sarah@test.com') returning id;`
    );
    const empId = emp.rows[0].id;

    const lead = await db.query<{ id: string }>(
      `insert into public.rep_leads (employee_id, full_name, email, company_name) values ($1, 'Client CEO', 'ceo@acme.com', 'Acme Corp') returning id;`,
      [empId]
    );
    const leadId = lead.rows[0].id;

    const proj = await db.query<{ id: string }>(
      `insert into public.client_projects (client_name, client_email, project_title) values ('Client CEO', 'ceo@acme.com', 'Acme Logistics Portal') returning id;`
    );
    const projId = proj.rows[0].id;

    await db.query(`
      insert into public.proposals (
        slug, client_name, client_email, company_name, project_title, scope_summary,
        lead_id, created_by_rep_id, project_id, is_active, version, view_count,
        signed_at, signed_by_name, signed_by_title, signed_signature_data, legal_agreement_hash
      ) values (
        'tdd-prop-acme-1234', 'Client CEO', 'ceo@acme.com', 'Acme Corp', 'Acme Logistics Portal', 'Full Portal',
        $1, $2, $3, true, 1, 3,
        now(), 'Client CEO', 'CEO', 'data:image/png;base64,sample', 'sha256hash123'
      );
    `, [leadId, empId, projId]);

    const inserted = await db.query<{ slug: string; lead_id: string; project_id: string; view_count: number }>(
      `select slug, lead_id, project_id, view_count from public.proposals where slug = 'tdd-prop-acme-1234';`
    );
    expect(inserted.rows[0].lead_id).toBe(leadId);
    expect(inserted.rows[0].project_id).toBe(projId);
    expect(inserted.rows[0].view_count).toBe(3);

    // 7. Verify ON DELETE SET NULL on lead_id
    await db.query(`delete from public.rep_leads where id = $1;`, [leadId]);
    const afterLeadDelete = await db.query<{ lead_id: string | null }>(
      `select lead_id from public.proposals where slug = 'tdd-prop-acme-1234';`
    );
    expect(afterLeadDelete.rows[0].lead_id).toBeNull();

    // 8. Verify Idempotency: Running 0042 a second time succeeds without error
    await expect(db.exec(sql0042)).resolves.not.toThrow();
  });
});
