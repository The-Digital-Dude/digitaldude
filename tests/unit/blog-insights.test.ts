import { describe, it, expect } from "vitest";
import { BRAKE_AGE_DAYS, BRAKE_MIN_SAMPLE, MAX_QUEUED, evaluateBrake, isIndexed, loadReport, runInsights, seedsForWeek } from "@/lib/blog/insights";
import { defaultState, loadState, type TopicState } from "@/lib/blog/automation";
import type { GscClient } from "@/lib/blog/gsc";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { fakeDb } from "./helpers/fakedb";

const now = new Date("2026-11-02T07:00:00Z"); // a Monday
const daysBefore = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

describe("safety brake", () => {
  const post = (ageDays: number, indexed: boolean) => ({ ageDays, indexed });
  it("needs enough old posts before it judges anything", () => {
    expect(evaluateBrake([post(30, false), post(30, false)])).toMatchObject({ triggered: false, indexedShare: null });
    expect(evaluateBrake(Array.from({ length: 10 }, () => post(5, false))).triggered).toBe(false); // too young to judge
  });
  it("triggers when Google has indexed too few of the old posts, and not otherwise", () => {
    const bad = Array.from({ length: BRAKE_MIN_SAMPLE }, (_, i) => post(BRAKE_AGE_DAYS + i, i === 0));
    const r = evaluateBrake(bad);
    expect(r.triggered).toBe(true);
    expect(r.reason).toMatch(/paused/);
    expect(evaluateBrake(Array.from({ length: 8 }, (_, i) => post(25, i < 5))).triggered).toBe(false);
  });
  it("reads Google's verdicts", () => {
    expect(isIndexed({ verdict: "PASS", coverage: "Submitted and indexed" })).toBe(true);
    expect(isIndexed({ verdict: "NEUTRAL", coverage: "Discovered - currently not indexed" })).toBe(false);
    expect(isIndexed({ verdict: "NEUTRAL", coverage: "Indexed, not submitted in sitemap" })).toBe(true);
  });
  it("rotates search-suggestion seeds by week", () => {
    expect(seedsForWeek(now)).toHaveLength(4);
    expect(seedsForWeek(now)).not.toEqual(seedsForWeek(new Date(now.getTime() + 7 * 86_400_000)));
    expect(seedsForWeek(now)).toEqual(seedsForWeek(now));
  });
});

const topic = (slug: string, over: Partial<TopicState> = {}): TopicState => ({
  slug, title: `Title of ${slug} for the reader`, keyword: `keyword ${slug}`, secondary: [], category: "CRM Development", author: "Farhad Hossain", angle: ["a point", "another point"], links: ["/contact"], status: "queued", attempts: 0, ...over,
});

const fakeGsc = (over: Partial<GscClient> = {}): GscClient & { resubmitted: number } => {
  const c = {
    resubmitted: 0,
    async query(dim: string) {
      return dim === "query"
        ? [{ key: "crm for estate agents", clicks: 0, impressions: 90, position: 8 }, { key: "digital dude", clicks: 3, impressions: 46, position: 5 }, { key: "custom crm development cost", clicks: 0, impressions: 30, position: 14 }]
        : [{ key: "https://www.digitaldude.co.uk/", clicks: 20, impressions: 800, position: 19 }];
    },
    async totals(start: string) { return start < "2026-09-20" ? { clicks: 5, impressions: 400, position: 30 } : { clicks: 9, impressions: 700, position: 25 }; },
    async inspect() { return { verdict: "PASS", coverage: "Submitted and indexed", lastCrawl: daysBefore(2), inSitemap: true }; },
    async sitemap() { return { lastDownloaded: daysBefore(20), lastSubmitted: daysBefore(20), errors: 0, pending: false }; },
    async resubmitSitemap() { c.resubmitted++; return true; },
    ...over,
  };
  return c as GscClient & { resubmitted: number };
};

const providerFor = (topics: unknown[]): AiProvider => ({ name: "s", model: "s", completeJson: async () => JSON.stringify({ topics }) });
const brief = (keyword: string, slug: string) => ({ keyword, title: `A Helpful Guide About ${keyword} for Teams`, slug, category: "Custom Software", angle: ["First point", "Second point", "Third point"], links: ["/services/crm-development", "/compare", "/how-we-work"] });
const noNetwork = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;

function setup(topics: TopicState[], extra: Record<string, unknown> = {}) {
  const done = defaultState().topics.map((t) => ({ ...t, status: "skipped" as const }));
  const state = { ...defaultState(), enabled: true, topics: [...done, ...topics], ...extra };
  return fakeDb({ acq_settings: [{ key: "blog_automation", value: state }], posts: [] });
}

describe("the weekly check", () => {
  it("reads Search Console, adds search-backed topics to the FRONT of the queue, and saves a report", async () => {
    const { db } = setup([topic("older-queued")]);
    const r = await runInsights(db, { now, gsc: fakeGsc(), provider: providerFor([brief("crm for estate agents", "crm-for-estate-agents")]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.gsc).toBe("ok");
    expect(r.totals?.current.clicks).toBe(9);
    expect(r.discovery.added.map((a) => a.slug)).toEqual(["crm-for-estate-agents"]);
    expect(r.topQueries[0].key).toBe("crm for estate agents");
    const state = await loadState(db);
    const queue = state.topics.filter((t) => t.status === "queued");
    expect(queue[0]).toMatchObject({ slug: "crm-for-estate-agents", source: "search-console" });
    expect(queue[0].evidence).toMatch(/90 impressions/);
    expect(queue[1].slug).toBe("older-queued");
    expect(state.lastInsightsAt).toBe(now.toISOString());
    expect((await loadReport(db))?.at).toBe(now.toISOString());
  });

  it("only runs once a week unless forced", async () => {
    const { db } = setup([topic("a")], { lastInsightsAt: daysBefore(2) });
    expect(await runInsights(db, { now, gsc: fakeGsc(), provider: providerFor([]), fetcher: noNetwork })).toEqual({ skipped: "already ran this week" });
    const forced = await runInsights(db, { now, force: true, gsc: fakeGsc(), provider: providerFor([]), fetcher: noNetwork });
    expect("skipped" in forced).toBe(false);
  });

  it("checks indexing of published posts older than two days and resubmits a stale sitemap", async () => {
    const gsc = fakeGsc();
    const { db } = setup([topic("published-old", { status: "published", publishedAt: daysBefore(6) }), topic("published-new", { status: "published", publishedAt: daysBefore(1) }), topic("q")]);
    const r = await runInsights(db, { now, gsc, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.posts.map((p) => p.slug)).toEqual(["published-old"]); // the one-day-old post is too new to judge
    expect(r.posts[0]).toMatchObject({ indexed: true, ageDays: 6 });
    expect(r.sitemapResubmitted).toBe(true); // posts were published after Google last read the sitemap
    expect(gsc.resubmitted).toBe(1);
  });

  it("does not resubmit a sitemap Google read after the newest post", async () => {
    const gsc = fakeGsc({ sitemap: async () => ({ lastDownloaded: daysBefore(1), lastSubmitted: daysBefore(1), errors: 0, pending: false }) });
    const { db } = setup([topic("p", { status: "published", publishedAt: daysBefore(5) })]);
    const r = await runInsights(db, { now, gsc, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.sitemapResubmitted).toBe(false);
  });

  it("pauses publishing when Google is not indexing the automated posts, and says why", async () => {
    const posts = Array.from({ length: BRAKE_MIN_SAMPLE }, (_, i) => topic(`p${i}`, { status: "published", publishedAt: daysBefore(BRAKE_AGE_DAYS + 3 + i) }));
    const gsc = fakeGsc({ inspect: async () => ({ verdict: "NEUTRAL", coverage: "Crawled - currently not indexed", lastCrawl: daysBefore(10), inSitemap: true }) });
    const { db } = setup(posts);
    const r = await runInsights(db, { now, gsc, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.brake.triggered).toBe(true);
    const state = await loadState(db);
    expect(state.paused).toBe(true);
    expect(state.pausedReason).toMatch(/only 0% of the 6/);
  });

  it("does not pause when the brake is switched off", async () => {
    const posts = Array.from({ length: BRAKE_MIN_SAMPLE }, (_, i) => topic(`p${i}`, { status: "published", publishedAt: daysBefore(BRAKE_AGE_DAYS + 3 + i) }));
    const gsc = fakeGsc({ inspect: async () => ({ verdict: "NEUTRAL", coverage: "Crawled - currently not indexed", lastCrawl: null, inSitemap: true }) });
    const { db } = setup(posts, { autopilot: { discover: false, brake: false, maxNewPerWeek: 7 } });
    const r = await runInsights(db, { now, gsc, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.brake.triggered).toBe(true); // reported
    expect((await loadState(db)).paused).toBe(false); // but not acted on
  });

  it("adds nothing when discovery is off, when the queue is full, or when the limit is zero", async () => {
    const off = setup([topic("a")], { autopilot: { discover: false, brake: true, maxNewPerWeek: 7 } });
    const r1 = await runInsights(off.db, { now, gsc: fakeGsc(), provider: providerFor([brief("crm for estate agents", "x-guide")]), fetcher: noNetwork });
    if ("skipped" in r1) throw new Error(r1.skipped);
    expect(r1.discovery.added).toEqual([]);

    const full = setup(Array.from({ length: MAX_QUEUED }, (_, i) => topic(`q${i}`)));
    const r2 = await runInsights(full.db, { now, gsc: fakeGsc(), provider: providerFor([brief("crm for estate agents", "x-guide")]), fetcher: noNetwork });
    if ("skipped" in r2) throw new Error(r2.skipped);
    expect(r2.discovery.note).toMatch(/already has 40 topics/);

    const zero = setup([topic("a")], { autopilot: { discover: true, brake: true, maxNewPerWeek: 0 } });
    const r3 = await runInsights(zero.db, { now, gsc: fakeGsc(), provider: providerFor([brief("crm for estate agents", "x-guide")]), fetcher: noNetwork });
    if ("skipped" in r3) throw new Error(r3.skipped);
    expect(r3.discovery.added).toEqual([]);
  });

  it("copes with Search Console being unavailable or failing, and with no AI provider", async () => {
    const a = setup([topic("a")]);
    const noGsc = await runInsights(a.db, { now, gsc: null, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in noGsc) throw new Error(noGsc.skipped);
    expect(noGsc.gsc).toBe("not_connected");
    expect(noGsc.warnings.join(" ")).toMatch(/not connected/);

    const b = setup([topic("a")]);
    const broken = fakeGsc({ totals: async () => { throw new Error("403 forbidden"); } });
    const r = await runInsights(b.db, { now, gsc: broken, provider: providerFor([]), fetcher: noNetwork });
    if ("skipped" in r) throw new Error(r.skipped);
    expect(r.gsc).toBe("error");
    expect(r.warnings.join(" ")).toMatch(/403/);

    const c = setup([topic("a")]);
    const noAi = await runInsights(c.db, { now, gsc: fakeGsc(), provider: null, fetcher: noNetwork });
    if ("skipped" in noAi) throw new Error(noAi.skipped);
    expect(noAi.warnings.join(" ")).toMatch(/AI provider is not configured/);
  });
});
