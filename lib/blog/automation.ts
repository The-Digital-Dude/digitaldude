import type { Db } from "@/lib/acquisition/db";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { log } from "@/lib/logger";
import { SITE_URL } from "@/lib/utils";
import { DEFAULT_TOPICS, type BlogTopic } from "./topics";
import { generatePost } from "./generate";
import type { GeneratedPost } from "./validate";

export const BLOG_AUTOMATION_KEY = "blog_automation";

export type TopicStatus = "queued" | "published" | "failed" | "skipped";

export interface TopicState extends BlogTopic {
  status: TopicStatus;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  lastProblems?: string[];
  publishedAt?: string;
}

export interface LogEntry {
  at: string;
  slug: string;
  result: "published" | "rejected" | "error" | "preview";
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
}

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
  topics: DEFAULT_TOPICS.map((t) => ({ ...t, status: "queued" as const, attempts: 0 })),
  lastRunDate: null,
  log: [],
});

/** Saved state, with any newly added default topics appended (so adding topics in code takes effect without a reset). */
export async function loadState(db: Db): Promise<AutomationState> {
  const { data } = await db.from("acq_settings").select("value").eq("key", BLOG_AUTOMATION_KEY).maybeSingle();
  const base = defaultState();
  const saved = data?.value as Partial<AutomationState> | undefined;
  if (!saved) return base;
  const topics = Array.isArray(saved.topics) ? (saved.topics as TopicState[]) : [];
  const have = new Set(topics.map((t) => t.slug));
  return {
    enabled: saved.enabled === true,
    paused: saved.paused === true,
    weekdaysOnly: saved.weekdaysOnly !== false,
    hourUtc: Number.isInteger(saved.hourUtc) && (saved.hourUtc as number) >= 0 && (saved.hourUtc as number) <= 23 ? (saved.hourUtc as number) : 8,
    topics: [...topics, ...base.topics.filter((t) => !have.has(t.slug))],
    lastRunDate: typeof saved.lastRunDate === "string" ? saved.lastRunDate : null,
    log: Array.isArray(saved.log) ? (saved.log as LogEntry[]).slice(-LOG_LIMIT) : [],
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
    const { data: existing } = await db.from("posts").select("id").eq("slug", topic.slug).maybeSingle();
    if (existing) {
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
      if (topic.attempts >= MAX_ATTEMPTS) topic.status = "failed";
      addLog(state, { slug: topic.slug, result: kind, detail: `${detail}${topic.status === "failed" ? " (gave up after " + MAX_ATTEMPTS + " attempts)" : ""}` }, now);
      await saveState(db, state);
      return { status: kind, slug: topic.slug, detail, problems };
    };

    if (attempt.error || !attempt.post || !attempt.validation) return fail("error", attempt.error ?? "no article was returned");
    if (!attempt.validation.ok) return fail("rejected", `rejected by the quality check: ${attempt.validation.problems.join("; ")}`, attempt.validation.problems);

    const p = attempt.post;
    if (opts.preview) return { status: "preview", slug: topic.slug, detail: "passed the quality check (not saved)", post: p, words: attempt.validation.words };

    const { error } = await db.from("posts").insert({
      slug: topic.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      cover_image: coverUrl(p.title, topic.category, topic.author),
      author: topic.author,
      category: topic.category,
      status: "published",
      reading_time_minutes: Math.max(3, Math.round(attempt.validation.words / 200)),
      meta_title: p.metaTitle,
      meta_description: p.metaDescription,
      published_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    if (error) return fail("error", `could not save the post: ${error.message}`);

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
