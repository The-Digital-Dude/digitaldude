import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

describe("migration 0023 (auto research)", () => {
  it("auto research is OFF by default and companies default to manual source", async () => {
    const s = await one<{ value: boolean }>(db, `select value from acq_settings where key='auto_research_enabled'`);
    expect(s.value).toBe(false);
    const c = await one<{ source: string }>(db, `insert into acq_companies (name) values ('Manual Co') returning source`);
    expect(c.source).toBe("manual");
  });

  it("rejects an unknown company source", async () => {
    expect(await failure(db, `insert into acq_companies (name, source) values ('X','scraped')`)).not.toBeNull();
  });

  it("suggestions are unique per company+email and validated", async () => {
    const co = await one<{ id: string }>(db, `insert into acq_companies (name, source) values ('Acme','ai_discovery') returning id`);
    const ins = (email: string) => failure(db, `insert into acq_contact_suggestions (company_id, email, source_url, evidence_excerpt) values ($1,$2,'https://acme.com.au','excerpt')`, [co.id, email]);
    expect(await ins("pm@acme.com.au")).toBeNull();
    expect(await ins("PM@acme.com.au")).toMatch(/acq_suggestion_unique|duplicate/);
    expect(await ins("not-an-email")).toMatch(/acq_suggestion_email_format/);
  });

  it("a suggestion is not a contact: accepting creates a non-eligible contact that cannot be forced eligible", async () => {
    const co = await one<{ id: string }>(db, `insert into acq_companies (name) values ('Beta') returning id`);
    const c = await one<{ id: string; status: string }>(db, `insert into acq_contacts (company_id, email, source_type, status) values ($1,'x@beta.com.au','company_website','needs_review') returning id, status`, [co.id]);
    expect(c.status).toBe("needs_review");
    expect(await failure(db, `update acq_contacts set status='eligible' where id=$1`, [c.id])).toMatch(/no reviewed consent/);
  });
});

describe("migration 0030 (contact finder)", () => {
  it("suggestions record their origin and confidence, with bounds", async () => {
    const co = await one<{ id: string }>(db, `insert into acq_companies (name) values ('Finder Co') returning id`);
    const ins = (email: string, origin: string, conf: number | null) =>
      failure(db, `insert into acq_contact_suggestions (company_id, email, source_url, evidence_excerpt, origin, confidence) values ($1,$2,'https://x','e',$3,$4)`, [co.id, email, origin, conf]);
    expect(await ins("a@finder.com", "hunter", 92)).toBeNull();
    expect(await ins("b@finder.com", "website", null)).toBeNull();
    expect(await ins("c@finder.com", "scraped", 50)).toMatch(/origin_check/);
    expect(await ins("d@finder.com", "hunter", 101)).toMatch(/confidence_check/);
    const d = await one<{ origin: string }>(db, `insert into acq_contact_suggestions (company_id, email, source_url, evidence_excerpt) values ($1,'e@finder.com','https://x','e') returning origin`, [co.id]);
    expect(d.origin).toBe("website");
  });
  it("tracks when a company was last looked up", async () => {
    const co = await one<{ at: string | null }>(db, `insert into acq_companies (name) values ('Lookup Co') returning contacts_looked_up_at as at`);
    expect(co.at).toBeNull();
  });
});
