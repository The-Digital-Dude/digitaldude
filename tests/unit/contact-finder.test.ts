import { describe, it, expect, vi, afterEach } from "vitest";
import { HunterProvider, ContactFinderHttpError, type ContactFinder, type FoundEmail } from "@/lib/acquisition/providers/contacts";
import { findContactsForCompany, ownDomainOnly, toSuggestions } from "@/lib/acquisition/contacts/find";
import { getSecret, saveSecret, secretStatus } from "@/lib/acquisition/secrets";
import type { Db } from "@/lib/acquisition/db";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const hunterBody = {
  data: {
    organization: "Acme",
    emails: [
      { value: "Sales@Acme.com.au", first_name: "Sam", last_name: "Lee", position: "Property Manager", confidence: 92, sources: [{ uri: "https://acme.com.au/team" }] },
      { value: "boss@gmail.com", confidence: 70, sources: [] },
      { value: "info@mail.acme.com.au", confidence: 80, sources: [] },
      { value: "other@elsewhere.com", confidence: 99, sources: [] },
      { confidence: 10 },
    ],
  },
};

describe("HunterProvider", () => {
  it("sends the key in a header (not the URL) and maps results", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(hunterBody), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await new HunterProvider("KEY12345").domainSearch("acme.com.au", 50);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toContain("domain-search");
    expect(String(url)).toContain("domain=acme.com.au");
    expect(String(url)).toContain("limit=10"); // capped
    expect(String(url)).not.toContain("KEY12345");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("KEY12345");
    expect(r.emails).toHaveLength(4);
    expect(r.emails[0]).toMatchObject({ email: "sales@acme.com.au", firstName: "Sam", position: "Property Manager", confidence: 92, sourceUris: ["https://acme.com.au/team"] });
  });

  it("raises a typed error with the provider's message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ errors: [{ id: "authentication_failed", details: "No user found for the API key supplied" }] }), { status: 401 })));
    const e = await new HunterProvider("bad").domainSearch("acme.com.au", 10).catch((x) => x);
    expect(e).toBeInstanceOf(ContactFinderHttpError);
    expect(e).toMatchObject({ status: 401 });
    expect(e.message).not.toContain("bad");
  });

  it("reads plan and quota from the account endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { plan_name: "Free", requests: { searches: { used: 3, available: 25 } } } }), { status: 200 })));
    expect(await new HunterProvider("k").account()).toEqual({ plan: "Free", searchesUsed: 3, searchesAvailable: 25 });
  });
});

describe("own-domain filtering and suggestion mapping", () => {
  const e = (email: string): FoundEmail => ({ email, firstName: null, lastName: null, position: null, confidence: 50, sourceUris: [] });
  it("keeps the company's own domain and subdomains, drops free-mail and other domains", () => {
    const kept = ownDomainOnly([e("a@acme.com.au"), e("b@mail.acme.com.au"), e("c@gmail.com"), e("d@notacme.com.au"), e("e@acme.com.au.evil.com")], "acme.com.au");
    expect(kept.map((x) => x.email)).toEqual(["a@acme.com.au", "b@mail.acme.com.au"]);
  });
  it("labels every suggestion as Hunter-sourced with its evidence", () => {
    const [s] = toSuggestions([{ email: "sam@acme.com.au", firstName: "Sam", lastName: "Lee", position: "Principal", confidence: 88, sourceUris: ["https://acme.com.au/about"] }], "acme.com.au");
    expect(s).toMatchObject({ origin: "hunter", name: "Sam Lee", role: "Principal", confidence: 88, source_url: "https://acme.com.au/about" });
    expect(s.evidence_excerpt).toContain("Hunter");
    expect(s.evidence_excerpt).toContain("88%");
    expect(toSuggestions([e("x@acme.com.au")], "acme.com.au")[0].source_url).toBe("https://hunter.io/search/acme.com.au");
  });
});

type Row = Record<string, unknown>;
function memDb(opts: { company?: Row | null; lookupsToday?: number; contacts?: string[]; suppressed?: string[] }) {
  const inserted: Row[] = [];
  const updates: Row[] = [];
  const audits: string[] = [];
  const db = {
    rpc: async (_n: string, a: Row) => ({ data: (opts.suppressed ?? []).includes(String(a.p_email)), error: null }),
    from(table: string) {
      let mode = "select";
      let head = false;
      let eqEmail: string | null = null;
      const b: Record<string, unknown> = {
        select: (_c?: string, o?: { head?: boolean }) => ((head = !!o?.head), b),
        eq: (k: string, v: unknown) => ((k === "email_normalized" ? (eqEmail = String(v)) : null), b),
        gte: () => b,
        maybeSingle: async () => {
          if (table === "acq_companies") return { data: opts.company === undefined ? { id: "c1", name: "Acme", domain: "acme.com.au", status: "researched", contacts_looked_up_at: null } : opts.company, error: null };
          if (table === "acq_contacts") return { data: (opts.contacts ?? []).includes(eqEmail ?? "") ? { id: "x" } : null, error: null };
          return { data: null, error: null };
        },
        update: (v: Row) => ((mode = "update"), updates.push({ table, ...v }), b),
        insert: (v: Row) => {
          mode = "insert";
          if (table === "acq_audit_logs") audits.push(String(v.action));
          else inserted.push(v);
          return b;
        },
        then: (resolve: (v: unknown) => void) => resolve(table === "acq_audit_logs" && head && mode === "select" ? { count: opts.lookupsToday ?? 0, data: null, error: null } : { data: null, error: null }),
      };
      return b;
    },
  };
  return { db: db as unknown as Db, inserted, updates, audits };
}

const finder = (emails: FoundEmail[], extra: Partial<ContactFinder> = {}): ContactFinder => ({
  name: "hunter",
  domainSearch: vi.fn(async () => ({ organization: null, emails })),
  account: async () => ({ plan: "Free", searchesUsed: 4, searchesAvailable: 25 }),
  ...extra,
});
const fe = (email: string): FoundEmail => ({ email, firstName: null, lastName: null, position: "Manager", confidence: 80, sourceUris: [] });

describe("findContactsForCompany", () => {
  it("stores own-domain addresses as suggestions only (never contacts) and records the lookup", async () => {
    const { db, inserted, updates, audits } = memDb({});
    const r = await findContactsForCompany(db, "c1", { provider: finder([fe("sam@acme.com.au"), fe("x@gmail.com"), fe("y@other.com")]) });
    expect(r).toMatchObject({ status: "ok", found: 1, saved: 1 });
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ company_id: "c1", email: "sam@acme.com.au", origin: "hunter" });
    expect(updates.some((u) => u.table === "acq_companies" && "contacts_looked_up_at" in u)).toBe(true);
    expect(audits).toContain("contacts.lookup");
  });

  it("skips addresses that are already contacts or suppressed", async () => {
    const { db, inserted } = memDb({ contacts: ["have@acme.com.au"], suppressed: ["gone@acme.com.au"] });
    const r = await findContactsForCompany(db, "c1", { provider: finder([fe("have@acme.com.au"), fe("gone@acme.com.au"), fe("new@acme.com.au")]) });
    expect(r).toMatchObject({ status: "ok", saved: 1 });
    expect(inserted.map((i) => i.email)).toEqual(["new@acme.com.au"]);
  });

  it("does not spend a credit when the company was searched in the last 30 days (unless forced)", async () => {
    const recent = { id: "c1", name: "Acme", domain: "acme.com.au", status: "researched", contacts_looked_up_at: new Date(Date.now() - 5 * 86_400_000).toISOString() };
    const p = finder([fe("a@acme.com.au")]);
    expect(await findContactsForCompany(memDb({ company: recent }).db, "c1", { provider: p })).toMatchObject({ status: "cached" });
    expect(p.domainSearch).not.toHaveBeenCalled();
    expect(await findContactsForCompany(memDb({ company: recent }).db, "c1", { provider: p, force: true })).toMatchObject({ status: "ok" });
  });

  it("enforces the daily lookup cap before calling the provider", async () => {
    vi.stubEnv("ACQ_DAILY_HUNTER_LOOKUPS", "3");
    const p = finder([fe("a@acme.com.au")]);
    expect(await findContactsForCompany(memDb({ lookupsToday: 3 }).db, "c1", { provider: p })).toMatchObject({ status: "cap_reached", cap: 3 });
    expect(p.domainSearch).not.toHaveBeenCalled();
  });

  it("handles not configured, no website, and unknown or archived companies", async () => {
    expect(await findContactsForCompany(memDb({}).db, "c1", { provider: null })).toEqual({ status: "not_configured" });
    expect(await findContactsForCompany(memDb({ company: { id: "c1", name: "A", domain: null, status: "new", contacts_looked_up_at: null } }).db, "c1", { provider: finder([]) })).toEqual({ status: "no_domain" });
    expect(await findContactsForCompany(memDb({ company: null }).db, "c1", { provider: finder([]) })).toEqual({ status: "company_not_found" });
    expect(await findContactsForCompany(memDb({ company: { id: "c1", name: "A", domain: "a.com", status: "archived", contacts_looked_up_at: null } }).db, "c1", { provider: finder([]) })).toEqual({ status: "company_not_found" });
  });

  it("a provider failure does not mark the company as searched or count against the cap", async () => {
    const { db, updates, audits } = memDb({});
    const failing = finder([], { domainSearch: async () => { throw new ContactFinderHttpError(429, "slow down"); } });
    await expect(findContactsForCompany(db, "c1", { provider: failing })).rejects.toBeInstanceOf(ContactFinderHttpError);
    expect(updates).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});

describe("saved API keys", () => {
  const SECRET = "k".repeat(40);
  function settingsDb(initial: unknown = null) {
    let value = initial;
    return {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: value ? { value } : null, error: null }) }) }),
        upsert: async (row: { value: unknown }) => ((value = row.value), { error: null }),
        delete: () => ({ eq: async () => ((value = null), { error: null }) }),
      }),
    } as unknown as Db;
  }

  it("stores the key encrypted, reads it back, shows only the last four characters, and prefers it over env", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    vi.stubEnv("HUNTER_API_KEY", "envkey9999");
    const db = settingsDb();
    expect(await getSecret(db, "hunter")).toBe("envkey9999");
    expect(await secretStatus(db, "hunter")).toMatchObject({ configured: true, source: "environment", keyHint: "••••9999" });
    await saveSecret(db, "hunter", "  savedkey-27f2  ");
    expect(await getSecret(db, "hunter")).toBe("savedkey-27f2");
    expect(await secretStatus(db, "hunter")).toMatchObject({ configured: true, source: "saved", keyHint: "••••27f2" });
  });

  it("rejects junk keys and treats an unreadable saved key as not configured", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const db = settingsDb();
    await expect(saveSecret(db, "brave", "short")).rejects.toThrow(/valid API key/);
    await expect(saveSecret(db, "brave", "has spaces in it 123")).rejects.toThrow(/valid API key/);
    await saveSecret(db, "brave", "a-long-enough-key-1");
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "z".repeat(40));
    vi.stubEnv("BRAVE_SEARCH_API_KEY", "");
    expect(await getSecret(db, "brave")).toBeNull();
    expect(await secretStatus(db, "brave")).toMatchObject({ configured: false });
  });
});
