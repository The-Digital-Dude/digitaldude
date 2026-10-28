import { describe, it, expect } from "vitest";
import { candidatesFromGsc, candidatesFromSuggestions, fetchSuggestions, isCandidateQuery, isCovered, proposeTopics, topicsFromAi, type Candidate } from "@/lib/blog/discovery";
import type { AiProvider } from "@/lib/acquisition/providers/ai";

describe("which search queries are worth a post", () => {
  it("accepts real, relevant phrases", () => {
    for (const q of ["custom crm development cost", "excel to web app", "3 sided marketplace", "can a spreadsheet be a crm", "how to build a multi vendor marketplace website"]) expect(isCandidateQuery(q), q).toBe(true);
  });

  it("rejects brand searches, operators and scraped junk (taken from the site's real Search Console data)", () => {
    const junk = [
      "digital dude",
      "digitaldude crm",
      '"answer engine optimization"',
      '(intitle:supabase or supabase) -"stock price" -"investor relations" site:.co.uk',
      "-site:facebook.com -site:fb.me -site:youtube.com ( \"llm monitoring\" or",
      ":https://www.mediafire.com/file/c98b1au0nie9e24/tiktok.apk",
      '"geo" seo -geographics',
      "about us",
      "4,web development birmingham",
      "crm", // too short / one word
      "a".repeat(90),
    ];
    for (const q of junk) expect(isCandidateQuery(q), q).toBe(false);
  });

  it("recognises what the site already covers, and what it does not", () => {
    const existing = [{ keyword: "crm vs spreadsheet", title: "CRM vs Spreadsheet: A Decision Checklist for Growing Teams" }, { keyword: "saas development cost", title: "SaaS Development Cost in the UK" }];
    expect(isCovered("spreadsheet vs crm", existing)).toBe(true);
    expect(isCovered("saas development costs uk", existing)).toBe(true);
    expect(isCovered("crm for recruitment agencies", existing)).toBe(false);
    expect(isCovered("stripe connect marketplace fees", existing)).toBe(false);
  });

  it("ranks Search Console queries by opportunity and drops weak or irrelevant ones", () => {
    const rows = [
      { key: "custom crm development cost", clicks: 0, impressions: 40, position: 12 },
      { key: "excel to web app", clicks: 0, impressions: 90, position: 8 },
      { key: "digital dude", clicks: 3, impressions: 46, position: 5 },
      { key: "saas development cost", clicks: 0, impressions: 1, position: 20 }, // below the minimum
      { key: "about us", clicks: 0, impressions: 50, position: 5 },
    ];
    const c = candidatesFromGsc(rows);
    expect(c.map((x) => x.keyword)).toEqual(["excel to web app", "custom crm development cost"]);
    expect(c[0].evidence).toMatch(/90 impressions/);
  });
});

const cands: Candidate[] = [
  { keyword: "excel to web app", impressions: 90, position: 8, source: "search-console", evidence: "Search Console: 90 impressions, average position 8" },
  { keyword: "crm for estate agents", impressions: 12, position: 20, source: "search-console", evidence: "Search Console: 12 impressions, average position 20" },
  { keyword: "google ads for b2b saas", impressions: 0, position: 0, source: "autocomplete", evidence: 'Search suggestion for "google ads for software company"' },
];
const topic = (over: Record<string, unknown> = {}) => ({ keyword: "excel to web app", title: "Excel to Web App: How to Turn a Spreadsheet Into Software", slug: "excel-to-web-app-guide", category: "Custom Software", angle: ["What changes", "Step by step", "Common mistakes"], links: ["/services/crm-development", "/blog/custom-crm-development-cost-uk", "/not-a-page"], ...over });

describe("validating the AI's topic briefs", () => {
  it("keeps a good brief, filters unknown links, adds the contact link and picks the author by category", () => {
    const r = topicsFromAi({ topics: [topic(), topic({ keyword: "google ads for b2b saas", title: "Google Ads for B2B SaaS: Where to Start With Intent", slug: "google-ads-b2b-saas", category: "Google Ads & PPC" })] }, cands, [], [], 5);
    expect(r.topics).toHaveLength(2);
    expect(r.topics[0].links).toEqual(["/services/crm-development", "/blog/custom-crm-development-cost-uk", "/contact"]);
    expect(r.topics[0]).toMatchObject({ author: "Farhad Hossain", source: "search-console" });
    expect(r.topics[1]).toMatchObject({ author: "Tanvir Ahmed Shuvo", source: "autocomplete" });
  });

  it("drops invented keywords, duplicates, bad slugs, unknown categories, empty briefs and anything over the limit", () => {
    const existing = [{ keyword: "excel to web app", title: "Excel to Web App", slug: "excel-to-web-app" }];
    const bad = [
      topic({ keyword: "made up phrase" }), // not a candidate
      topic({ slug: "Bad Slug!" }),
      topic({ category: "Cooking" }),
      topic({ angle: ["only one"] }),
      topic({ title: "Too short" }),
      topic(), // covered by the existing post
      topic({ keyword: "crm for estate agents", title: "CRM for Estate Agents: What to Look For in 2026", slug: "crm-estate-agents" }),
    ];
    const r = topicsFromAi({ topics: bad }, cands, existing, [], 1);
    expect(r.topics.map((t) => t.keyword)).toEqual(["crm for estate agents"]);
    expect(r.dropped.length).toBeGreaterThanOrEqual(5);
    expect(topicsFromAi({ topics: [topic(), topic({ keyword: "crm for estate agents", title: "CRM for Estate Agents: What to Look For in 2026", slug: "crm-estate-agents" })] }, cands, [], [], 1).topics).toHaveLength(1); // limit
  });

  it("proposeTopics reads the model's JSON, and reports a failure instead of throwing", async () => {
    const ok: AiProvider = { name: "s", model: "s", completeJson: async () => JSON.stringify({ topics: [topic()] }) };
    expect((await proposeTopics(ok, cands, [], [], 3)).topics).toHaveLength(1);
    const broken: AiProvider = { name: "s", model: "s", completeJson: async () => { throw new Error("503 busy"); } };
    const r = await proposeTopics(broken, cands, [], [], 3);
    expect(r.topics).toEqual([]);
    expect(r.error).toMatch(/503/);
    expect((await proposeTopics(ok, [], [], [], 3)).topics).toEqual([]); // nothing to choose from
  });
});

describe("search suggestions", () => {
  it("turns relevant suggestions into candidates and skips the seed itself", () => {
    const c = candidatesFromSuggestions(["custom crm", "custom crm development cost", "custom crm free download", "crm", "digital dude crm"], "custom crm");
    expect(c.map((x) => x.keyword)).toEqual(["custom crm development cost", "custom crm free download"]);
    expect(c[0].source).toBe("autocomplete");
  });

  it("fetchSuggestions follows the three-step protocol and never throws", async () => {
    const calls: string[] = [];
    const f = (async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { method: string };
      calls.push(body.method);
      if (body.method === "initialize") return new Response("{}", { status: 200, headers: { "mcp-session-id": "abc" } });
      if (body.method === "tools/call") return new Response(JSON.stringify({ result: { structuredContent: { data: [{ string: "Custom CRM Cost" }, { string: "custom crm uk" }] } } }), { status: 200 });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await fetchSuggestions("custom crm", f)).toEqual(["custom crm cost", "custom crm uk"]);
    expect(calls).toEqual(["initialize", "notifications/initialized", "tools/call"]);
    const down = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    expect(await fetchSuggestions("custom crm", down)).toEqual([]);
    const noSession = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
    expect(await fetchSuggestions("custom crm", noSession)).toEqual([]);
  });
});
