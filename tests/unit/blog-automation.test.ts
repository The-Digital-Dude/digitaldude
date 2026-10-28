import { describe, it, expect } from "vitest";
import { validatePost, type GeneratedPost } from "@/lib/blog/validate";
import { extractFigures } from "@/lib/blog/facts";
import { DEFAULT_TOPICS } from "@/lib/blog/topics";
import { defaultState, isDue, loadState, nextTopic, runBlogAutomation, MAX_ATTEMPTS } from "@/lib/blog/automation";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { fakeDb } from "./helpers/fakedb";

const topic = DEFAULT_TOPICS[0]; // can-a-spreadsheet-be-a-crm

const filler = (n: number) => Array.from({ length: n }, (_, i) => `Teams often keep customer details in one place and then find that people edit the same rows at the same time, which makes the history hard to trust (${i}).`).join(" ");

function goodContent(): string {
  return [
    `Can a spreadsheet be a CRM? For a very small team with a simple process, yes, and this guide explains when that stops being true.`,
    filler(3),
    `## When a spreadsheet CRM works\n\n${filler(6)}\n\n- Simple process\n- Few people\n- Low volume`,
    `## The signs it is breaking\n\n${filler(6)}\n\nRead [why growing service businesses outgrow spreadsheets](/blog/why-growing-service-businesses-outgrow-spreadsheets) for more.`,
    `## What a real CRM adds\n\n${filler(6)}\n\nSee the [cost guide](/blog/custom-crm-development-cost-uk) and our [CRM development service](/services/crm-development).`,
    `## A short checklist\n\n${filler(6)}`,
    `## Frequently Asked Questions\n\n### Can a spreadsheet replace a CRM?\n\n${filler(2)}\n\n### When should I move on?\n\n${filler(2)}\n\n### Is a custom CRM expensive?\n\nA focused CRM is typically roughly $5,500 to $12,000. ${filler(1)}\n\n### What about data protection?\n\n${filler(2)}`,
    `## Next step\n\nIf you would like to talk it through, [book a discovery call](/contact).`,
  ].join("\n\n");
}

const goodPost = (): GeneratedPost => ({
  title: "Can a Spreadsheet Be a CRM? When It Works and When to Move On",
  metaTitle: "Can a Spreadsheet Be a CRM? When to Move On",
  metaDescription: "Can a spreadsheet be a CRM? Learn when a spreadsheet is enough for a small team, the signs it is breaking, and what a real CRM adds.",
  excerpt: "A spreadsheet can work as a CRM for a very small team. Here are the signs it is breaking and what to do next.",
  content: goodContent(),
});

describe("quality check", () => {
  it("accepts a well-formed post", () => {
    const v = validatePost(goodPost(), topic);
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
    expect(v.words).toBeGreaterThan(1000);
  });

  it("rejects invented figures but allows the published price bands", () => {
    const p = goodPost();
    p.content += "\n\nOne team cut its admin time by 63% and saved £48,000 a year.";
    const v = validatePost(p, topic);
    expect(v.ok).toBe(false);
    expect(v.problems.join(" ")).toMatch(/figures that are not in the fact sheet.*63%/);
    expect(extractFigures("roughly $5,500 to $12,000 and 10 per cent")).toEqual(["$5,500", "$12,000", "10%"]);
    expect(validatePost(goodPost(), topic).problems.join(" ")).not.toMatch(/\$5,500/); // allowed: it is in the fact sheet
  });

  it("rejects external links, unknown internal links, missing call to action and too few links", () => {
    const p = goodPost();
    p.content = p.content.replace("(/contact)", "(https://example.com)").replace("(/services/crm-development)", "(/made-up-page)");
    const v = validatePost(p, topic);
    expect(v.problems.join(" | ")).toMatch(/no external links/);
    expect(v.problems.join(" | ")).toMatch(/pages that do not exist: \/made-up-page/);
    expect(v.problems.join(" | ")).toMatch(/call to action linking to "\/contact"/);
  });

  it("rejects hype, guarantees, unnamed studies, client anecdotes, placeholders and a title heading", () => {
    for (const bad of ["We guarantee results.", "This is a revolutionary approach.", "Studies show most teams fail.", "One of our clients doubled sales.", "See [INTERNAL LINK: /x].", "# A title"]) {
      const p = goodPost();
      p.content += `\n\n${bad}`;
      expect(validatePost(p, topic).ok, bad).toBe(false);
    }
  });

  it("rejects missing structure: short text, no FAQ, wrong meta lengths", () => {
    const short: GeneratedPost = { ...goodPost(), content: "## One\n\nShort.\n\n[a](/contact)" };
    const v = validatePost(short, topic);
    expect(v.problems.join(" | ")).toMatch(/too short/);
    expect(v.problems.join(" | ")).toMatch(/at least 4/);
    expect(v.problems.join(" | ")).toMatch(/Frequently Asked Questions/);
    expect(validatePost({ ...goodPost(), metaDescription: "too short" }, topic).problems.join()).toMatch(/metaDescription/);
    expect(validatePost({ ...goodPost(), metaTitle: "x".repeat(80) }, topic).problems.join()).toMatch(/metaTitle/);
  });
});

describe("schedule", () => {
  const on = { ...defaultState(), enabled: true };
  const at = (iso: string) => new Date(iso);

  it("is off by default and when paused", () => {
    expect(isDue(defaultState(), at("2026-10-28T09:00:00Z")).due).toBe(false);
    expect(isDue({ ...on, paused: true }, at("2026-10-28T09:00:00Z")).reason).toMatch(/paused/);
  });
  it("publishes on weekdays after the chosen hour, once a day", () => {
    expect(isDue(on, at("2026-10-28T09:00:00Z")).due).toBe(true); // Wednesday 09:00
    expect(isDue(on, at("2026-10-28T07:59:00Z")).reason).toMatch(/before/);
    expect(isDue(on, at("2026-10-31T09:00:00Z")).reason).toMatch(/weekend/); // Saturday
    expect(isDue({ ...on, lastRunDate: "2026-10-28" }, at("2026-10-28T15:00:00Z")).reason).toMatch(/already/);
    expect(isDue({ ...on, weekdaysOnly: false }, at("2026-10-31T09:00:00Z")).due).toBe(true);
  });
  it("the default queue is well-formed and in order", () => {
    const slugs = DEFAULT_TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of DEFAULT_TOPICS) {
      expect(t.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(t.angle.length).toBeGreaterThanOrEqual(2);
    }
    expect(nextTopic(defaultState())?.slug).toBe(DEFAULT_TOPICS[0].slug);
  });
});

const providerReturning = (post: GeneratedPost): AiProvider => ({ name: "stub", model: "stub", completeJson: async () => JSON.stringify(post) });

describe("publishing flow", () => {
  const monday = new Date("2026-10-26T09:00:00Z");

  it("does nothing while switched off", async () => {
    const { db, tables } = fakeDb({ acq_settings: [], posts: [] });
    const r = await runBlogAutomation(db, { now: monday, provider: providerReturning(goodPost()) });
    expect(r.status).toBe("not_due");
    expect(tables.posts).toHaveLength(0);
  });

  it("publishes the next topic once enabled, records it, and will not publish a second post the same day", async () => {
    const state = { ...defaultState(), enabled: true };
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: state }], posts: [] });
    const r = await runBlogAutomation(db, { now: monday, provider: providerReturning(goodPost()) });
    expect(r.status).toBe("published");
    expect(tables.posts).toHaveLength(1);
    expect(tables.posts[0]).toMatchObject({ slug: topic.slug, status: "published", author: "Farhad Hossain", category: "CRM Development" });
    expect(String(tables.posts[0].cover_image)).toMatch(/^\/api\/og\?title=/);
    const saved = await loadState(db);
    expect(saved.topics[0]).toMatchObject({ status: "published" });
    expect(saved.lastRunDate).toBe("2026-10-26");
    const again = await runBlogAutomation(db, { now: new Date("2026-10-26T15:00:00Z"), provider: providerReturning(goodPost()) });
    expect(again.status).toBe("not_due");
    expect(tables.posts).toHaveLength(1);
  });

  it("a post that fails the check is not published; it is retried later and given up after the maximum attempts", async () => {
    const bad: GeneratedPost = { ...goodPost(), content: "Far too short." };
    const state = { ...defaultState(), enabled: true };
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: state }], posts: [] });
    let t = monday.getTime();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const r = await runBlogAutomation(db, { now: new Date(t), provider: providerReturning(bad) });
      expect(r.status).toBe("rejected");
      t += 30 * 60_000; // past the retry gap
    }
    expect(tables.posts).toHaveLength(1); // one draft, updated on each attempt, never published
    expect(tables.posts[0]).toMatchObject({ slug: topic.slug, status: "draft" });
    const saved = await loadState(db);
    expect(saved.topics[0]).toMatchObject({ status: "draft", attempts: MAX_ATTEMPTS });
    expect(saved.topics[1].status).toBe("queued"); // the queue moves on
    expect(saved.log.some((l) => /gave up/.test(l.detail))).toBe(true);
  });

  it("waits before retrying a failed topic", async () => {
    const bad: GeneratedPost = { ...goodPost(), content: "Far too short." };
    const { db } = fakeDb({ acq_settings: [{ key: "blog_automation", value: { ...defaultState(), enabled: true } }], posts: [] });
    expect((await runBlogAutomation(db, { now: monday, provider: providerReturning(bad) })).status).toBe("rejected");
    expect((await runBlogAutomation(db, { now: new Date(monday.getTime() + 5 * 60_000), provider: providerReturning(bad) })).status).toBe("not_due");
  });

  it("preview saves nothing, and an unreadable AI answer is an error not a post", async () => {
    const { db, tables } = fakeDb({ acq_settings: [], posts: [] });
    const p = await runBlogAutomation(db, { preview: true, provider: providerReturning(goodPost()) });
    expect(p.status).toBe("preview");
    expect(tables.posts).toHaveLength(0);
    const broken: AiProvider = { name: "x", model: "x", completeJson: async () => "not json at all" };
    expect((await runBlogAutomation(db, { preview: true, provider: broken })).status).toBe("error");
  });

  it("never overwrites a post that already exists at that address", async () => {
    const state = { ...defaultState(), enabled: true };
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: state }], posts: [{ id: "p1", slug: topic.slug, status: "published" }] });
    const r = await runBlogAutomation(db, { now: monday, provider: providerReturning(goodPost()) });
    expect(r.status).toBe("error");
    expect(tables.posts).toHaveLength(1);
    expect((await loadState(db)).topics[0].status).toBe("skipped");
  });
});
