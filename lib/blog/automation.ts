import type { Db } from "@/lib/acquisition/db";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { log } from "@/lib/logger";
import { SITE_URL } from "@/lib/utils";
import { DEFAULT_TOPICS, type BlogTopic } from "./topics";
import { generatePost } from "./generate";
import type { GeneratedPost } from "./validate";

export const BLOG_AUTOMATION_KEY = "blog_automation";

/** "draft": a written post that failed the check and was saved as a draft for a person to fix and publish. */
export type TopicStatus = "queued" | "published" | "failed" | "skipped" | "draft";

export interface TopicState extends BlogTopic {
  status: TopicStatus;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  lastProblems?: string[];
  publishedAt?: string;
  /** The `posts` row holding this topic's draft, so fixing it in the blog editor and publishing it is noticed. */
  draftId?: string;
  /** Where the topic came from, and the evidence behind it (for example "Search Console: 84 impressions, position 14"). */
  source?: "built-in" | "search-console" | "autocomplete" | "manual";
  evidence?: string;
}

export interface Autopilot {
  /** Each week, find new topics from Search Console (and search suggestions) and add them to the queue. */
  discover: boolean;
  /** Pause publishing if Google is not indexing the automated posts. */
  brake: boolean;
  /** The most topics the weekly check may add. */
  maxNewPerWeek: number;
}

export interface LogEntry {
  at: string;
  slug: string;
  result: "published" | "rejected" | "error" | "preview" | "info";
  detail: string;
}

export interface AutomationState {
  /** Off until an admin switches it on (after previewing a post). */
  enabled: boolean;
  paused: boolean;
  weekdaysOnly: boolean;
  /** Earliest UTC hour of the day a post goes out. */
  hourUtc: number;
  topics: TopicState[];
  lastRunDate: string | null;
  log: LogEntry[];
  autopilot: Autopilot;
  /** Why the automation was paused by the safety brake (empty when paused by hand). */
  pausedReason?: string;
  lastInsightsAt: string | null;
}

export const DEFAULT_AUTOPILOT: Autopilot = { discover: true, brake: true, maxNewPerWeek: 7 };

/** A topic is retried at most this many times before it is marked failed and the queue moves on. */
export const MAX_ATTEMPTS = 3;
/** Minimum gap between automatic attempts, so a failing topic is not retried on every worker tick. */
export const RETRY_GAP_MS = 25 * 60_000;
const LOG_LIMIT = 60;

export const defaultState = (): AutomationState => ({
  enabled: false,
  paused: false,
  weekdaysOnly: true,
  hourUtc: 8,
  topics: DEFAULT_TOPICS.map((t) => ({ ...t, status: "queued" as const, attempts: 0, source: "built-in" as const })),
  lastRunDate: null,
  log: [],
  autopilot: { ...DEFAULT_AUTOPILOT },
  lastInsightsAt: null,
});

/** Saved state, with any newly added default topics appended (so adding topics in code takes effect without a reset). */
export async function loadState(db: Db): Promise<AutomationState> {
  const { data } = await db.from("acq_settings").select("value").eq("key", BLOG_AUTOMATION_KEY).maybeSingle();
  const base = defaultState();
  const saved = data?.value as Partial<AutomationState> | undefined;
  if (!saved) return base;
  const topics = Array.isArray(saved.topics) ? (saved.topics as TopicState[]) : [];
  await reconcileDrafts(db, topics);
  const have = new Set(topics.map((t) => t.slug));
  return {
    enabled: saved.enabled === true,
    paused: saved.paused === true,
    weekdaysOnly: saved.weekdaysOnly !== false,
    hourUtc: Number.isInteger(saved.hourUtc) && (saved.hourUtc as number) >= 0 && (saved.hourUtc as number) <= 23 ? (saved.hourUtc as number) : 8,
    topics: [...topics, ...base.topics.filter((t) => !have.has(t.slug))],
    lastRunDate: typeof saved.lastRunDate === "string" ? saved.lastRunDate : null,
    log: Array.isArray(saved.log) ? (saved.log as LogEntry[]).slice(-LOG_LIMIT) : [],
    autopilot: {
      discover: saved.autopilot?.discover !== false,
      brake: saved.autopilot?.brake !== false,
      maxNewPerWeek: Number.isInteger(saved.autopilot?.maxNewPerWeek) && (saved.autopilot?.maxNewPerWeek as number) >= 0 && (saved.autopilot?.maxNewPerWeek as number) <= 14 ? (saved.autopilot?.maxNewPerWeek as number) : DEFAULT_AUTOPILOT.maxNewPerWeek,
    },
    pausedReason: typeof saved.pausedReason === "string" ? saved.pausedReason : undefined,
    lastInsightsAt: typeof saved.lastInsightsAt === "string" ? saved.lastInsightsAt : null,
  };
}

export async function saveState(db: Db, state: AutomationState): Promise<void> {
  const { error } = await db.from("acq_settings").upsert({ key: BLOG_AUTOMATION_KEY, value: { ...state, log: state.log.slice(-LOG_LIMIT) } });
  if (error) throw new Error(`save blog automation: ${error.message}`);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const isWeekday = (d: Date) => d.getUTCDay() >= 1 && d.getUTCDay() <= 5;

/** Is a post due now? Pure, so the schedule rules can be tested. */
export function isDue(state: AutomationState, now: Date): { due: boolean; reason: string } {
  if (!state.enabled) return { due: false, reason: "automation is switched off" };
  if (state.paused) return { due: false, reason: "automation is paused" };
  if (state.weekdaysOnly && !isWeekday(now)) return { due: false, reason: "weekend" };
  if (now.getUTCHours() < state.hourUtc) return { due: false, reason: `before ${state.hourUtc}:00 UTC` };
  if (state.lastRunDate === ymd(now)) return { due: false, reason: "already published today" };
  return { due: true, reason: "due" };
}

/**
 * Keeps topics in step with their drafts: a draft that a person fixed and published in the blog editor marks its topic published, and a
 * draft that was deleted is forgotten. One query, and only when some topic has a draft.
 */
export async function reconcileDrafts(db: Db, topics: TopicState[]): Promise<void> {
  const withDraft = topics.filter((t) => t.draftId);
  if (withDraft.length === 0) return;
  const { data } = await db.from("posts").select("id,status,published_at").in("id", withDraft.map((t) => t.draftId as string));
  const rows = new Map(((data ?? []) as { id: string; status: string; published_at: string | null }[]).map((r) => [r.id, r]));
  for (const t of withDraft) {
    const row = rows.get(t.draftId as string);
    if (!row) {
      t.draftId = undefined;
      if (t.status === "draft") t.status = "failed";
    } else if (row.status === "published" && t.status !== "published") {
      t.status = "published";
      t.publishedAt = row.published_at ?? new Date().toISOString();
      t.lastError = undefined;
      t.lastProblems = undefined;
    }
  }
}

const readingMinutes = (words: number) => Math.max(3, Math.round(words / 200));

/** Saves (or updates) the topic's draft in `posts`, so a rejected article can be fixed in the blog editor. Returns the row id, or null. */
async function saveDraft(db: Db, topic: TopicState, p: GeneratedPost, words: number, now: Date): Promise<string | null> {
  const row = {
    slug: topic.slug,
    title: p.title || topic.title,
    excerpt: p.excerpt || p.metaDescription || topic.title,
    content: p.content || "(no content was returned)",
    cover_image: coverUrl(p.title || topic.title, topic.category, topic.author),
    author: topic.author,
    category: topic.category,
    status: "draft",
    reading_time_minutes: readingMinutes(words),
    meta_title: p.metaTitle || null,
    meta_description: p.metaDescription || null,
    updated_at: now.toISOString(),
  };
  if (topic.draftId) {
    const { error } = await db.from("posts").update(row).eq("id", topic.draftId).eq("status", "draft");
    return error ? null : topic.draftId;
  }
  const { data, error } = await db.from("posts").insert({ ...row, published_at: now.toISOString() }).select("id").single();
  if (error) {
    log("warn", { message: "blog automation: could not save the draft", error });
    return null;
  }
  return (data as { id: string }).id;
}

/** The admin's "Save as draft" on a previewed post: keeps the text and the checker's problems so it can be fixed and published later. */
export async function saveDraftFromPreview(db: Db, slug: string, post: GeneratedPost, problems: string[], now = new Date()): Promise<{ ok: boolean; draftId?: string; error?: string }> {
  const state = await loadState(db);
  const topic = state.topics.find((t) => t.slug === slug);
  if (!topic) return { ok: false, error: "That topic is not in the queue." };
  if (topic.status === "published") return { ok: false, error: "That topic is already published." };
  if (!topic.draftId) {
    const { data: existing } = await db.from("posts").select("id,status").eq("slug", slug).maybeSingle();
    const e = existing as { id: string; status: string } | null;
    if (e && e.status !== "draft") return { ok: false, error: "A post with that address already exists." };
    if (e) topic.draftId = e.id;
  }
  const words = post.content.split(/\s+/).filter(Boolean).length;
  const id = await saveDraft(db, topic, post, words, now);
  if (!id) return { ok: false, error: "The draft could not be saved." };
  topic.draftId = id;
  topic.status = "draft";
  topic.lastProblems = problems;
  topic.lastError = problems.length ? `saved as a draft with ${problems.length} problem${problems.length === 1 ? "" : "s"} to fix` : "saved as a draft";
  addLog(state, { slug, result: "rejected", detail: topic.lastError }, now);
  await saveState(db, state);
  return { ok: true, draftId: id };
}

export const nextTopic = (state: AutomationState): TopicState | undefined => state.topics.find((t) => t.status === "queued");

export const coverUrl = (title: string, category: string, author: string) =>
  `/api/og?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}&tag=${encodeURIComponent(`The Digital Dude · ${author}`)}`;

export interface RunResult {
  status: "published" | "preview" | "not_due" | "no_topics" | "no_ai" | "rejected" | "error";
  slug?: string;
  detail: string;
  post?: GeneratedPost;
  problems?: string[];
  words?: number;
}

function addLog(state: AutomationState, e: Omit<LogEntry, "at">, now: Date) {
  state.log.push({ at: now.toISOString(), ...e });
  state.log = state.log.slice(-LOG_LIMIT);
}

/**
 * Writes and (unless previewing) publishes the next queued post. One attempt per call, so it fits a serverless time limit; failures are
 * retried on later calls with the checker's feedback. Never throws.
 *  - `force`: ignore the schedule and the on/off switch (the admin's "publish next now").
 *  - `preview`: write and check the post but save nothing.
 */
export async function runBlogAutomation(db: Db, opts: { now?: Date; force?: boolean; preview?: boolean; provider?: AiProvider } = {}): Promise<RunResult> {
  const now = opts.now ?? new Date();
  try {
    const state = await loadState(db);
    if (!opts.force && !opts.preview) {
      const d = isDue(state, now);
      if (!d.due) return { status: "not_due", detail: d.reason };
    }
    const topic = nextTopic(state);
    if (!topic) return { status: "no_topics", detail: "the topic queue is empty" };

    // A topic that already has a post (written by hand) is skipped, never overwritten.
    const { data: existingRow } = await db.from("posts").select("id,status").eq("slug", topic.slug).maybeSingle();
    const existing = existingRow as { id: string; status: string } | null;
    // This topic's own earlier draft is fine to update; anything else at that address is left alone.
    if (existing && existing.status === "draft" && (!topic.draftId || topic.draftId === existing.id)) topic.draftId = existing.id;
    else if (existing) {
      topic.status = "skipped";
      topic.lastError = "a post with this address already exists";
      addLog(state, { slug: topic.slug, result: "error", detail: topic.lastError }, now);
      await saveState(db, state);
      return { status: "error", slug: topic.slug, detail: topic.lastError };
    }

    if (!opts.force && !opts.preview && topic.lastAttemptAt && now.getTime() - Date.parse(topic.lastAttemptAt) < RETRY_GAP_MS) {
      return { status: "not_due", slug: topic.slug, detail: "waiting before retrying this topic" };
    }

    const provider = opts.provider ?? (await resolveAiProvider(db, { timeoutMs: 50_000 }));
    if (!provider) return { status: "no_ai", slug: topic.slug, detail: "the AI provider is not configured" };

    const { data: pub } = await db.from("posts").select("slug").eq("status", "published");
    const extraLinks = ((pub ?? []) as { slug: string }[]).map((p) => `/blog/${p.slug}`);

    const attempt = await generatePost(provider, topic, { extraLinks, feedback: topic.lastProblems });

    const fail = async (kind: "rejected" | "error", detail: string, problems?: string[]): Promise<RunResult> => {
      if (opts.preview) return { status: kind, slug: topic.slug, detail, problems, post: attempt.post ?? undefined, words: attempt.validation?.words };
      topic.attempts += 1;
      topic.lastAttemptAt = now.toISOString();
      topic.lastError = detail;
      topic.lastProblems = problems;
      // A post that was written but rejected is kept as a draft (with its problems) so a person can fix it and publish it.
      if (kind === "rejected" && attempt.post) {
        const id = await saveDraft(db, topic, attempt.post, attempt.validation?.words ?? 0, now);
        if (id) topic.draftId = id;
      }
      if (topic.attempts >= MAX_ATTEMPTS) topic.status = topic.draftId ? "draft" : "failed";
      const gaveUp = topic.status === "failed" || topic.status === "draft";
      addLog(state, { slug: topic.slug, result: kind, detail: `${detail}${gaveUp ? ` (gave up after ${MAX_ATTEMPTS} attempts${topic.draftId ? "; saved as a draft to fix" : ""})` : ""}` }, now);
      await saveState(db, state);
      return { status: kind, slug: topic.slug, detail, problems };
    };

    if (attempt.error || !attempt.post || !attempt.validation) return fail("error", attempt.error ?? "no article was returned");
    if (!attempt.validation.ok) return fail("rejected", `rejected by the quality check: ${attempt.validation.problems.join("; ")}`, attempt.validation.problems);

    const p = attempt.post;
    if (opts.preview) return { status: "preview", slug: topic.slug, detail: "passed the quality check (not saved)", post: p, words: attempt.validation.words };

    const publishedRow = {
      slug: topic.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      cover_image: coverUrl(p.title, topic.category, topic.author),
      author: topic.author,
      category: topic.category,
      status: "published",
      reading_time_minutes: readingMinutes(attempt.validation.words),
      meta_title: p.metaTitle,
      meta_description: p.metaDescription,
      published_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const { error } = topic.draftId
      ? await db.from("posts").update(publishedRow).eq("id", topic.draftId)
      : await db.from("posts").insert(publishedRow);
    if (error) return fail("error", `could not save the post: ${error.message}`);
    topic.draftId = undefined;

    topic.status = "published";
    topic.publishedAt = now.toISOString();
    topic.lastError = undefined;
    topic.lastProblems = undefined;
    topic.attempts += 1;
    topic.lastAttemptAt = now.toISOString();
    if (!opts.force) state.lastRunDate = ymd(now);
    addLog(state, { slug: topic.slug, result: "published", detail: `${attempt.validation.words} words` }, now);
    await saveState(db, state);

    await afterPublish(`${SITE_URL}/blog/${topic.slug}`);
    return { status: "published", slug: topic.slug, detail: `published (${attempt.validation.words} words)`, post: p, words: attempt.validation.words };
  } catch (e) {
    log("error", { message: "blog automation failed", error: e });
    return { status: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Best effort: refresh the cached blog pages and tell search engines about the new URL. Never throws. */
async function afterPublish(url: string): Promise<void> {
  if (process.env.VITEST) return; // tests never ping search engines
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
  } catch {
    /* not in a Next.js request context (tests, scripts) */
  }
  try {
    const { submitToIndexNow } = await import("@/lib/pseo/indexNow");
    await submitToIndexNow([url]);
  } catch (e) {
    log("warn", { message: "blog automation: IndexNow ping failed", error: e });
  }
}
