import type { Db } from "@/lib/acquisition/db";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { log } from "@/lib/logger";
import { SITE_URL } from "@/lib/utils";
import { loadState, saveState, type AutomationState, type TopicState } from "./automation";
import { candidatesFromGsc, candidatesFromSuggestions, fetchSuggestions, proposeTopics, type Candidate, type Existing, type Fetcher } from "./discovery";
import { daysAgo, getGscClient, isoDay, type GscClient, type GscRow, type GscTotals, type Inspection, type SitemapInfo } from "./gsc";

export const BLOG_INSIGHTS_KEY = "blog_insights";

/** The queue never grows beyond this many waiting topics. */
export const MAX_QUEUED = 40;
/** The weekly check runs at most once in this many days. */
const MIN_GAP_DAYS = 6;
/** The safety brake needs at least this many automated posts old enough to have been judged. */
export const BRAKE_MIN_SAMPLE = 6;
/** A post is "old enough" to be judged after this many days. */
export const BRAKE_AGE_DAYS = 21;
/** If less than this share of the old-enough posts is indexed, publishing is paused. */
export const BRAKE_MIN_INDEXED_SHARE = 0.3;

export interface PostIndexing {
  slug: string;
  title: string;
  publishedAt: string;
  ageDays: number;
  verdict: string;
  coverage: string;
  lastCrawl: string | null;
  inSitemap: boolean;
  indexed: boolean;
}

export interface InsightsReport {
  at: string;
  gsc: "ok" | "not_connected" | "error";
  gscError?: string;
  totals: { current: GscTotals; previous: GscTotals } | null;
  topQueries: GscRow[];
  topPages: GscRow[];
  posts: PostIndexing[];
  sitemap: SitemapInfo | null;
  sitemapResubmitted: boolean;
  discovery: { added: { slug: string; title: string; keyword: string; evidence: string }[]; considered: number; dropped: string[]; note?: string };
  brake: { triggered: boolean; sample: number; indexedShare: number | null; reason?: string };
  warnings: string[];
}

export const isIndexed = (i: Pick<Inspection, "verdict" | "coverage">) => i.verdict === "PASS" || /^(submitted and )?indexed/i.test(i.coverage);

/** Pure: should the safety brake pause publishing? Only judges posts old enough for Google to have decided. */
export function evaluateBrake(posts: Pick<PostIndexing, "ageDays" | "indexed">[]): InsightsReport["brake"] {
  const old = posts.filter((p) => p.ageDays >= BRAKE_AGE_DAYS);
  if (old.length < BRAKE_MIN_SAMPLE) return { triggered: false, sample: old.length, indexedShare: null };
  const share = old.filter((p) => p.indexed).length / old.length;
  if (share < BRAKE_MIN_INDEXED_SHARE) {
    return { triggered: true, sample: old.length, indexedShare: share, reason: `Google has indexed only ${Math.round(share * 100)}% of the ${old.length} automated posts that are over ${BRAKE_AGE_DAYS} days old. Publishing was paused so more pages are not added while quality or indexing is in doubt.` };
  }
  return { triggered: false, sample: old.length, indexedShare: share };
}

/** Weekly seed phrases for search suggestions, rotated by week number so each run explores a different part of the field. */
const SEEDS = ["custom crm", "crm for small business", "marketplace app", "saas development", "workflow automation", "client portal", "booking system", "ai chatbot for business", "erp for small business", "crm migration", "stripe marketplace", "software development cost"];
export const seedsForWeek = (now: Date, n = 4): string[] => {
  const week = Math.floor(now.getTime() / (7 * 86_400_000));
  return Array.from({ length: n }, (_, i) => SEEDS[(week * n + i) % SEEDS.length]);
};

export async function loadReport(db: Db): Promise<InsightsReport | null> {
  const { data } = await db.from("acq_settings").select("value").eq("key", BLOG_INSIGHTS_KEY).maybeSingle();
  return (data?.value as InsightsReport | undefined) ?? null;
}

async function inChunks<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

export interface InsightsOptions {
  now?: Date;
  /** Run even if the weekly gap has not passed (the admin's "run now"). */
  force?: boolean;
  gsc?: GscClient | null;
  provider?: AiProvider | null;
  fetcher?: Fetcher;
}

/**
 * The weekly check: reads Search Console, tracks how the automated posts are being indexed, resubmits the sitemap when it is stale,
 * adds new topics to the queue, and pauses publishing if Google is not indexing the posts. Never throws.
 */
export async function runInsights(db: Db, opts: InsightsOptions = {}): Promise<InsightsReport | { skipped: string }> {
  const now = opts.now ?? new Date();
  try {
    const state = await loadState(db);
    if (!opts.force && state.lastInsightsAt && now.getTime() - Date.parse(state.lastInsightsAt) < MIN_GAP_DAYS * 86_400_000) return { skipped: "already ran this week" };

    const report: InsightsReport = {
      at: now.toISOString(), gsc: "ok", totals: null, topQueries: [], topPages: [], posts: [], sitemap: null, sitemapResubmitted: false,
      discovery: { added: [], considered: 0, dropped: [] }, brake: { triggered: false, sample: 0, indexedShare: null }, warnings: [],
    };

    const gsc = opts.gsc === undefined ? getGscClient() : opts.gsc;
    let queries: GscRow[] = [];
    if (!gsc) {
      report.gsc = "not_connected";
      report.warnings.push("Search Console is not connected (GOOGLE_SERVICE_ACCOUNT_KEY is missing or unreadable), so no search data was used this week.");
    } else {
      try {
        const curEnd = isoDay(daysAgo(now, 2));
        const curStart = isoDay(daysAgo(now, 29));
        const prevEnd = isoDay(daysAgo(now, 30));
        const prevStart = isoDay(daysAgo(now, 57));
        const [current, previous, q, pages] = await Promise.all([gsc.totals(curStart, curEnd), gsc.totals(prevStart, prevEnd), gsc.query("query", curStart, curEnd, 500), gsc.query("page", curStart, curEnd, 25)]);
        report.totals = { current, previous };
        queries = q;
        report.topQueries = [...q].sort((a, b) => b.impressions - a.impressions).slice(0, 15);
        report.topPages = pages.slice(0, 15).map((p) => ({ ...p, key: p.key.replace(SITE_URL.replace(/\/$/, ""), "") || "/" }));
      } catch (e) {
        report.gsc = "error";
        report.gscError = e instanceof Error ? e.message.slice(0, 200) : String(e);
        report.warnings.push(`Search Console could not be read: ${report.gscError}`);
      }

      // Indexing state of the posts the automation published (inspected a few at a time).
      const allPublished = state.topics.filter((t) => t.status === "published" && t.publishedAt);
      const ageOf = (t: TopicState) => (now.getTime() - Date.parse(t.publishedAt as string)) / 86_400_000;
      const recent = allPublished.filter((t) => ageOf(t) >= 2).sort((a, b) => Date.parse(b.publishedAt as string) - Date.parse(a.publishedAt as string)).slice(0, 12);
      const inspected = await inChunks(recent, 4, async (t: TopicState) => {
        try {
          const i = await gsc.inspect(`${SITE_URL.replace(/\/$/, "")}/blog/${t.slug}`);
          const ageDays = Math.floor((now.getTime() - Date.parse(t.publishedAt as string)) / 86_400_000);
          return { slug: t.slug, title: t.title, publishedAt: t.publishedAt as string, ageDays, verdict: i.verdict, coverage: i.coverage, lastCrawl: i.lastCrawl, inSitemap: i.inSitemap, indexed: isIndexed(i) } satisfies PostIndexing;
        } catch {
          return null;
        }
      });
      report.posts = inspected.filter((p): p is PostIndexing => p !== null);

      // Keep the sitemap fresh: if posts were published since Google last read it, ask it to read it again.
      try {
        report.sitemap = await gsc.sitemap();
        const lastRead = report.sitemap?.lastDownloaded ? Date.parse(report.sitemap.lastDownloaded) : 0;
        const newest = allPublished.reduce((m, t) => Math.max(m, Date.parse(t.publishedAt as string)), 0);
        if (newest > lastRead) report.sitemapResubmitted = await gsc.resubmitSitemap();
        if (report.sitemap && report.sitemap.errors > 0) report.warnings.push(`Google reports ${report.sitemap.errors} error(s) on the sitemap.`);
      } catch (e) {
        log("warn", { message: "blog insights: sitemap check failed", error: e });
      }
    }

    // Safety brake.
    report.brake = evaluateBrake(report.posts);
    if (report.brake.triggered) {
      report.warnings.push(report.brake.reason as string);
      if (state.autopilot.brake && state.enabled && !state.paused) {
        state.paused = true;
        state.pausedReason = report.brake.reason;
        state.log.push({ at: now.toISOString(), slug: "autopilot", result: "info", detail: `paused by the safety brake: ${report.brake.reason}` });
      }
    }

    // Discovery: add new topics to the queue.
    if (state.autopilot.discover) await discover(db, state, queries, report, opts, now);

    state.lastInsightsAt = now.toISOString();
    await saveState(db, state);
    await db.from("acq_settings").upsert({ key: BLOG_INSIGHTS_KEY, value: report });
    return report;
  } catch (e) {
    log("error", { message: "blog insights failed", error: e });
    return { skipped: `failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function discover(db: Db, state: AutomationState, queries: GscRow[], report: InsightsReport, opts: InsightsOptions, now: Date): Promise<void> {
  const queued = state.topics.filter((t) => t.status === "queued").length;
  const room = Math.min(state.autopilot.maxNewPerWeek, MAX_QUEUED - queued);
  if (room <= 0) {
    report.discovery.note = `the queue already has ${queued} topics waiting, so nothing was added`;
    return;
  }

  const { data: posts } = await db.from("posts").select("slug,title");
  const existing: Existing[] = [
    ...((posts ?? []) as { slug: string; title: string }[]).map((p) => ({ slug: p.slug, title: p.title, keyword: p.title })),
    ...state.topics.map((t) => ({ slug: t.slug, title: t.title, keyword: t.keyword })),
  ];
  const extraLinks = ((posts ?? []) as { slug: string }[]).map((p) => `/blog/${p.slug}`);

  let cands: Candidate[] = candidatesFromGsc(queries);
  if (cands.length < 8) {
    for (const seed of seedsForWeek(now)) {
      cands = cands.concat(candidatesFromSuggestions(await fetchSuggestions(seed, opts.fetcher), seed));
    }
  }
  // Drop what the site already covers and any duplicates, then keep the strongest.
  const seen = new Set<string>();
  const fresh = cands.filter((c) => {
    if (seen.has(c.keyword)) return false;
    seen.add(c.keyword);
    return true;
  });
  report.discovery.considered = fresh.length;
  if (fresh.length === 0) {
    report.discovery.note = "no new relevant search phrases were found this week";
    return;
  }

  const provider = opts.provider === undefined ? await resolveAiProvider(db, { timeoutMs: 35_000 }) : opts.provider;
  if (!provider) {
    report.warnings.push("The AI provider is not configured, so new topics could not be written up.");
    return;
  }
  const result = await proposeTopics(provider, fresh, existing, extraLinks, room);
  report.discovery.dropped = result.dropped.slice(0, 20);
  if (result.error) {
    report.warnings.push(`Topic discovery could not run: ${result.error}`);
    return;
  }

  const firstQueued = state.topics.findIndex((t) => t.status === "queued");
  const fromSearch: TopicState[] = [];
  const fromSuggestions: TopicState[] = [];
  for (const t of result.topics) {
    const { evidence, source, ...topic } = t;
    const ts: TopicState = { ...topic, status: "queued", attempts: 0, source, evidence };
    (source === "search-console" ? fromSearch : fromSuggestions).push(ts);
    report.discovery.added.push({ slug: t.slug, title: t.title, keyword: t.keyword, evidence });
  }
  // Topics backed by real impressions go to the front of the queue; search suggestions go to the end.
  if (fromSearch.length) state.topics.splice(firstQueued >= 0 ? firstQueued : state.topics.length, 0, ...fromSearch);
  state.topics.push(...fromSuggestions);
  for (const a of report.discovery.added) state.log.push({ at: now.toISOString(), slug: a.slug, result: "info", detail: `topic added automatically: ${a.evidence}` });
}
