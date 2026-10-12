import { describe, it, expect, vi, afterEach } from "vitest";
import { extractOwnDomainEmails } from "@/lib/acquisition/research/emails";
import { candidatesFromResults, queriesForDay, isDeniedDomain, runDiscovery } from "@/lib/acquisition/discovery/discover";
import { enqueueDailyAuto } from "@/lib/acquisition/queue/daily";
import { saveContactSuggestions } from "@/lib/acquisition/research/pipeline";
import type { SearchProvider } from "@/lib/acquisition/providers/search";
import type { Db } from "@/lib/acquisition/db";

afterEach(() => vi.unstubAllEnvs());

describe("own-domain email extraction", () => {
  const site = "https://acme.com.au";
  it("takes mailto links and visible text on the company's own domain only", () => {
    const html = '<a href="mailto:Sales@Acme.com.au?subject=hi">x</a> <a href="mailto:me@gmail.com">y</a>';
    const text = "Contact us: pm@acme.com.au or other@elsewhere.com.au. Free: person@gmail.com";
    expect(extractOwnDomainEmails(html, text, site).map((e) => e.email).sort()).toEqual(["pm@acme.com.au", "sales@acme.com.au"]);
  });
  it("accepts subdomains, rejects placeholders, tool addresses and image false positives", () => {
    const text = "a@mail.acme.com.au noreply@acme.com.au logo@2x.acme.com.au.png test@acme.com.au real@acme.com.au";
    expect(extractOwnDomainEmails("", text, site).map((e) => e.email).sort()).toEqual(["a@mail.acme.com.au", "real@acme.com.au"]);
  });
  it("includes a verbatim excerpt containing the address", () => {
    const [e] = extractOwnDomainEmails("", "Reach our property managers at pm@acme.com.au any weekday.", site);
    expect(e.excerpt).toContain("pm@acme.com.au");
  });
  it("returns nothing for an invalid website", () => {
    expect(extractOwnDomainEmails("", "a@acme.com.au", "not a url ::")).toEqual([]);
  });
});

describe("discovery filtering", () => {
  it("rotates queries deterministically by day", () => {
    expect(queriesForDay(3, 5)).toEqual(queriesForDay(3, 5));
    expect(queriesForDay(3, 5)[0].text).not.toBe(queriesForDay(4, 5)[0].text);
    expect(queriesForDay(0, 5)).toHaveLength(5);
  });
  it("keeps unique .au businesses, drops portals/social/non-AU/duplicates", () => {
    const r = [
      { url: "https://www.acme.com.au/about", title: "Acme Property Management | Brisbane", description: "" },
      { url: "https://acme.com.au/other", title: "dup", description: "" },
      { url: "https://www.realestate.com.au/agency/x", title: "portal", description: "" },
      { url: "https://www.facebook.com/acme", title: "fb", description: "" },
      { url: "https://example.com/x", title: "non au", description: "" },
      { url: "https://pm.gov.au/x", title: "gov", description: "" },
      { url: "https://harbour.net.au", title: "Harbour Realty - Sydney", description: "" },
    ];
    const c = candidatesFromResults(r, "QLD");
    expect(c.map((x) => x.domain)).toEqual(["acme.com.au", "harbour.net.au"]);
    expect(c[0].name).toBe("Acme Property Management");
    expect(isDeniedDomain("sub.realestate.com.au")).toBe(true);
  });
});

type Row = Record<string, unknown>;

/** Tiny in-memory fake of the supabase client covering the query shapes used here. */
function memDb(seed: Record<string, Row[]> = {}, rpc: Record<string, (a: Row) => unknown> = {}) {
  const tables: Record<string, Row[]> = JSON.parse(JSON.stringify(seed));
  let id = 0;
  const isDup = (table: string, rows: Row[], v: Row) =>
    (table === "acq_companies" && rows.some((r) => r.domain === v.domain)) ||
    (table === "acq_jobs" && rows.some((r) => r.idempotency_key === v.idempotency_key)) ||
    (table === "acq_contact_suggestions" && rows.some((r) => r.company_id === v.company_id && r.email === v.email));
  const db = {
    rpc: async (name: string, args: Row) => ({ data: rpc[name]?.(args) ?? false, error: null }),
    from(table: string) {
      const rows = (tables[table] ??= []);
      const filters: ((r: Row) => boolean)[] = [];
      let mode: "select" | "insert" = "select";
      let inserted: Row | null = null;
      let err: { code: string; message: string } | null = null;
      let limit = Infinity;
      const match = () => rows.filter((r) => filters.every((f) => f(r)));
      const b: Record<string, unknown> = {
        select: () => b,
        eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
        in: (k: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[k])), b),
        not: () => b,
        or: () => b,
        order: () => b,
        limit: (n: number) => ((limit = n), b),
        insert: (v: Row) => {
          mode = "insert";
          if (isDup(table, rows, v)) err = { code: "23505", message: "dup" };
          else {
            inserted = { id: `id${++id}`, ...v };
            rows.push(inserted);
          }
          return b;
        },
        single: async () => (err ? { data: null, error: err } : { data: inserted ?? match()[0] ?? null, error: null }),
        maybeSingle: async () => ({ data: match()[0] ?? null, error: null }),
        then: (resolve: (v: unknown) => void) => resolve(mode === "insert" ? { data: inserted, error: err } : { data: match().slice(0, limit), error: null }),
      };
      return b;
    },
  };
  return { db: db as unknown as Db, tables };
}

const fakeSearch = (urls: string[]): SearchProvider => ({ name: "t", search: async () => urls.map((u) => ({ url: u, title: `T ${u}`, description: "" })) });

describe("runDiscovery", () => {
  it("adds new companies as ai_discovery, skips known and suppressed domains, enqueues research", async () => {
    vi.stubEnv("ACQ_DAILY_SEARCH_QUERIES", "1");
    vi.stubEnv("ACQ_DAILY_NEW_COMPANIES", "10");
    const { db, tables } = memDb({
      acq_companies: [{ id: "c0", domain: "known.com.au" }],
      acq_suppressions: [{ company_domain: "optout.com.au" }],
    });
    const r = await runDiscovery(db, { search: fakeSearch(["https://known.com.au", "https://optout.com.au", "https://fresh.com.au", "https://realestate.com.au/x"]), now: new Date("2026-10-13T00:00:00Z") });
    expect(r.created).toBe(1);
    const added = tables.acq_companies.find((c) => c.domain === "fresh.com.au")!;
    expect(added).toMatchObject({ source: "ai_discovery" });
    expect(tables.acq_jobs.filter((j) => j.type === "research")).toHaveLength(1);
  });
  it("respects the daily new-company cap", async () => {
    vi.stubEnv("ACQ_DAILY_SEARCH_QUERIES", "1");
    vi.stubEnv("ACQ_DAILY_NEW_COMPANIES", "2");
    const { db, tables } = memDb();
    const urls = ["a", "b", "c", "d"].map((x) => `https://${x}.com.au`);
    expect((await runDiscovery(db, { search: fakeSearch(urls) })).created).toBe(2);
    expect(tables.acq_companies).toHaveLength(2);
  });
});

describe("enqueueDailyAuto", () => {
  it("does nothing unless the owner turned it on", async () => {
    const { db, tables } = memDb({ acq_settings: [{ key: "auto_research_enabled", value: false }] });
    expect(await enqueueDailyAuto(db)).toEqual({ discover: false, research: 0 });
    expect(tables.acq_jobs ?? []).toHaveLength(0);
  });
  it("does nothing without an AI provider even when on", async () => {
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_MODEL", "");
    const { db } = memDb({ acq_settings: [{ key: "auto_research_enabled", value: true }] });
    expect(await enqueueDailyAuto(db)).toEqual({ discover: false, research: 0 });
  });
});

describe("saveContactSuggestions", () => {
  const pages = [
    {
      url: "https://acme.com.au/contact",
      text: "x",
      emails: [
        { email: "pm@acme.com.au", excerpt: "pm@acme.com.au" },
        { email: "gone@acme.com.au", excerpt: "gone@acme.com.au" },
        { email: "have@acme.com.au", excerpt: "have@acme.com.au" },
      ],
    },
  ];
  it("stores suggestions only, skipping suppressed and existing contacts, and never creates contacts", async () => {
    const { db, tables } = memDb({ acq_contacts: [{ email_normalized: "have@acme.com.au" }] }, { acq_is_suppressed: (a) => a.p_email === "gone@acme.com.au" });
    expect(await saveContactSuggestions(db, "co1", pages)).toBe(1);
    expect(tables.acq_contact_suggestions.map((s) => s.email)).toEqual(["pm@acme.com.au"]);
    expect(tables.acq_contacts).toHaveLength(1);
  });
  it("is idempotent across runs", async () => {
    const { db } = memDb();
    await saveContactSuggestions(db, "co1", pages);
    expect(await saveContactSuggestions(db, "co1", pages)).toBe(0);
  });
});
