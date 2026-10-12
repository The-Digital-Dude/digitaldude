import { describe, it, expect, beforeAll } from "vitest";
import { createDb, one, failure, eligibleContact, draftCampaign, approveAndActivate, unpause, type Db } from "./db";

let db: Db;
beforeAll(async () => {
  db = await createDb();
});

// RETURNING sees the row before the AFTER trigger flags it, so read it back.
const company = async (name: string, country = "AU", domain: string | null = null) => {
  const ins = await one<{ id: string }>(db, `insert into acq_companies (name, country, domain) values ($1,$2,$3) returning id`, [name, country, domain]);
  return one<{ id: string; name_key: string; possible_duplicate_of: string | null }>(db, `select id, name_key, possible_duplicate_of from acq_companies where id=$1`, [ins.id]);
};

describe("markets and country rules", () => {
  it("seeds the Australian property-management market", async () => {
    const m = await one<{ country: string; domain_suffixes: string[]; enabled: boolean }>(db, `select country, domain_suffixes, enabled from acq_markets where name='Property management - Australia'`);
    expect(m).toMatchObject({ country: "AU", domain_suffixes: [".au"], enabled: true });
  });

  it("allows AU/GB/US and blocks every other country until enabled", async () => {
    const allowed = async (c: string) => (await one<{ a: boolean }>(db, `select acq_country_allowed($1) as a`, [c])).a;
    expect(await allowed("AU")).toBe(true);
    expect(await allowed("gb")).toBe(true);
    expect(await allowed("US")).toBe(true);
    expect(await allowed("FR")).toBe(false);
    expect(await allowed("BD")).toBe(false);
    await db.query(`insert into acq_country_rules (country, name, email_allowed) values ('SE','Sweden',false)`);
    expect(await allowed("SE")).toBe(false);
    await db.query(`update acq_country_rules set email_allowed = true where country='SE'`);
    expect(await allowed("SE")).toBe(true);
  });

  it("validates market country codes", async () => {
    expect(await failure(db, `insert into acq_markets (name, industry, country) values ('Bad','x','Australia')`)).not.toBeNull();
    expect(await failure(db, `insert into acq_markets (name, industry, country, search_phrases) values ('UK law firms','Legal','GB','{law firm}')`)).toBeNull();
  });

  it("companies are no longer limited to Australian states", async () => {
    expect(await failure(db, `insert into acq_companies (name, state, country) values ('Berlin GmbH','Berlin','DE')`)).toBeNull();
    expect(await failure(db, `insert into acq_companies (name, country) values ('Bad Country','Germany')`)).not.toBeNull();
  });
});

describe("near-duplicate detection", () => {
  it("normalises names: case, punctuation and legal suffixes", async () => {
    const k = async (n: string) => (await one<{ k: string }>(db, `select acq_name_key($1) as k`, [n])).k;
    expect(await k("Acme Property Management Pty. Ltd.")).toBe("acme property management");
    expect(await k("ACME Property Management")).toBe("acme property management");
    expect(await k("The Smith & Co Group Pty Ltd")).toBe("smith group");
  });

  it("flags a same-name company on a different domain, without merging or blocking it", async () => {
    const a = await company("Harbour Realty Pty Ltd", "AU", "harbourrealty.com.au");
    const b = await company("Harbour Realty", "AU", "harbour-realty.com.au");
    expect(a.possible_duplicate_of).toBeNull();
    expect(b.possible_duplicate_of).toBe(a.id);
    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_companies where name_key='harbour realty'`)).c).toBe("2");
  });

  it("does not flag the same name in a different country", async () => {
    await company("Orion Estates", "AU", "orion.com.au");
    const uk = await company("Orion Estates Ltd", "GB", "orion.co.uk");
    expect(uk.possible_duplicate_of).toBeNull();
  });

  it("a dismissed flag stays dismissed", async () => {
    const a = await company("Zeta Lettings", "GB", "zeta1.co.uk");
    const b = await company("Zeta Lettings Limited", "GB", "zeta2.co.uk");
    expect(b.possible_duplicate_of).toBe(a.id);
    await db.query(`update acq_companies set possible_duplicate_of=null, duplicate_dismissed=true where id=$1`, [b.id]);
    expect((await one<{ k: string | null }>(db, `select acq_flag_duplicate($1) as k`, [b.id])).k).toBeNull();
  });
});

describe("merging duplicates", () => {
  it("moves contacts, research and suggestions to the keeper and archives (never deletes) the duplicate", async () => {
    const keep = await company("Merge Keep Pty Ltd", "AU", "keep.com.au");
    const dup = await company("Merge Keep", "AU", "keep2.com.au");
    await db.query(`insert into acq_contacts (company_id, email) values ($1,'a@keep2.com.au')`, [dup.id]);
    await db.query(`insert into acq_research_records (company_id, source_url, observed_fact, evidence_excerpt) values ($1,'https://keep2.com.au','fact','excerpt text here')`, [dup.id]);
    await db.query(`insert into acq_contact_suggestions (company_id, email, source_url, evidence_excerpt) values ($1,'same@x.com.au','https://a','e'),($2,'same@x.com.au','https://b','e'),($2,'only@x.com.au','https://b','e')`, [keep.id, dup.id]);

    await db.query(`select acq_merge_companies($1,$2,'neil')`, [keep.id, dup.id]);

    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_contacts where company_id=$1`, [keep.id])).c).toBe("1");
    expect((await one<{ c: string }>(db, `select count(*)::text as c from acq_research_records where company_id=$1`, [keep.id])).c).toBe("1");
    const sug = await db.query<{ email: string }>(`select email from acq_contact_suggestions where company_id=$1 order by email`, [keep.id]);
    expect(sug.rows.map((r) => r.email)).toEqual(["only@x.com.au", "same@x.com.au"]);
    const d = await one<{ status: string; domain: string | null }>(db, `select status, domain from acq_companies where id=$1`, [dup.id]);
    expect(d).toMatchObject({ status: "archived", domain: null });
    const audit = await one<{ c: string }>(db, `select count(*)::text as c from acq_audit_logs where action='company.merged' and entity_id=$1`, [keep.id]);
    expect(audit.c).toBe("1");
  });

  it("refuses to merge a company into itself or into something that does not exist", async () => {
    const c = await company("Solo Co", "AU", "solo.com.au");
    expect(await failure(db, `select acq_merge_companies($1,$1,'neil')`, [c.id])).toMatch(/itself/);
    expect(await failure(db, `select acq_merge_companies($1,gen_random_uuid(),'neil')`, [c.id])).toMatch(/not found/);
  });
});

describe("country gate on sending", () => {
  const reserve = (id: string) => one<{ ok: boolean; reason: string | null }>(db, `select * from acq_reserve_send($1)`, [id]);
  const setup = async (country: string | null, n: string) => {
    const contact = await eligibleContact(db, `gate-${n}@example.com.au`);
    await db.query(`update acq_companies set country = $1 where id = (select company_id from acq_contacts where id=$2)`, [country, contact]);
    const camp = await draftCampaign(db, [contact]);
    await approveAndActivate(db, camp.campaignId);
    await unpause(db);
    return camp.messages[0];
  };

  it("sends for an allowed country", async () => {
    expect(await reserve(await setup("AU", "au"))).toMatchObject({ ok: true });
  });
  it("blocks a country with no enabled rule, and an unknown country (fail closed)", async () => {
    expect(await reserve(await setup("FR", "fr"))).toMatchObject({ ok: false, reason: "country_blocked" });
    expect(await reserve(await setup(null, "null"))).toMatchObject({ ok: false, reason: "country_blocked" });
  });
  it("refuses contacts at an archived or lost/dead company", async () => {
    for (const [n, set] of [["arch", "status='archived'"], ["lost", "pool_status='lost'"], ["dead", "pool_status='dead'"]] as const) {
      const m = await setup("AU", `closed-${n}`);
      await db.query(`update acq_companies set ${set} where id = (select c.company_id from acq_contacts c join acq_campaign_leads l on l.contact_id=c.id join acq_email_messages e on e.campaign_lead_id=l.id where e.id=$1)`, [m]);
      expect(await reserve(m)).toMatchObject({ ok: false, reason: "company_closed" });
    }
  });
  it("allows the country once the owner enables it", async () => {
    const m = await setup("NO", "no");
    expect(await reserve(m)).toMatchObject({ ok: false, reason: "country_blocked" });
    await db.query(`insert into acq_country_rules (country, name, email_allowed) values ('NO','Norway',true)`);
    expect(await reserve(m)).toMatchObject({ ok: true });
  });
});
