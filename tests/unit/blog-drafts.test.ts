import { describe, it, expect } from "vitest";
import { defaultState, loadState, runBlogAutomation, saveDraftFromPreview, MAX_ATTEMPTS } from "@/lib/blog/automation";
import { DEFAULT_TOPICS } from "@/lib/blog/topics";
import type { GeneratedPost } from "@/lib/blog/validate";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { fakeDb } from "./helpers/fakedb";
import { goodPost } from "./helpers/blogFixtures";

const topic = DEFAULT_TOPICS[0];
const monday = new Date("2026-10-26T09:00:00Z");
const bad: GeneratedPost = { title: "Can a Spreadsheet Be a CRM? When It Works and When to Move On", metaTitle: "Can a Spreadsheet Be a CRM? When to Move On", metaDescription: "Can a spreadsheet be a CRM? Learn when a spreadsheet is enough for a small team, the signs it is breaking, and what a real CRM adds.", excerpt: "A spreadsheet can work as a CRM for a very small team. Here are the signs it is breaking and what to do next.", content: "Too short to publish." };
const provider = (p: GeneratedPost): AiProvider => ({ name: "stub", model: "stub", completeJson: async () => JSON.stringify(p) });
const on = () => ({ ...defaultState(), enabled: true });

describe("rejected posts are kept as drafts", () => {
  it("a rejected post is saved as a draft with its problems recorded on the topic", async () => {
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: on() }], posts: [] });
    const r = await runBlogAutomation(db, { now: monday, provider: provider(bad) });
    expect(r.status).toBe("rejected");
    expect(tables.posts).toHaveLength(1);
    expect(tables.posts[0]).toMatchObject({ slug: topic.slug, status: "draft", content: "Too short to publish.", author: "Farhad Hossain" });
    const saved = await loadState(db);
    expect(saved.topics[0].draftId).toBe(tables.posts[0].id);
    expect(saved.topics[0].lastProblems?.join(" ")).toMatch(/too short/);
  });

  it("a draft is not reachable as published, and repeated rejections update the same draft instead of adding more", async () => {
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: on() }], posts: [] });
    let t = monday.getTime();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await runBlogAutomation(db, { now: new Date(t), provider: provider({ ...bad, content: `Attempt ${i} is still too short.` }) });
      t += 30 * 60_000;
    }
    expect(tables.posts).toHaveLength(1);
    expect(tables.posts[0]).toMatchObject({ status: "draft", content: `Attempt ${MAX_ATTEMPTS - 1} is still too short.` });
    expect((await loadState(db)).topics[0]).toMatchObject({ status: "draft", attempts: MAX_ATTEMPTS });
  });

  it("when a person fixes the draft and publishes it in the blog editor, the topic is marked published", async () => {
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: on() }], posts: [] });
    await runBlogAutomation(db, { now: monday, provider: provider(bad) });
    tables.posts[0].status = "published"; // what the blog editor does
    tables.posts[0].published_at = "2026-10-27T10:00:00Z";
    const state = await loadState(db);
    expect(state.topics[0]).toMatchObject({ status: "published", publishedAt: "2026-10-27T10:00:00Z" });
  });

  it("a deleted draft is forgotten and the topic can be written again", async () => {
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: on() }], posts: [] });
    let t = monday.getTime();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await runBlogAutomation(db, { now: new Date(t), provider: provider(bad) });
      t += 30 * 60_000;
    }
    tables.posts.splice(0, tables.posts.length);
    const state = await loadState(db);
    expect(state.topics[0].draftId).toBeUndefined();
    expect(state.topics[0].status).toBe("failed");
  });
});

describe("saving a previewed post as a draft", () => {
  it("keeps the text and the problems, and marks the topic as a draft", async () => {
    const { db, tables } = fakeDb({ acq_settings: [], posts: [] });
    const r = await saveDraftFromPreview(db, topic.slug, bad, ["excerpt must be 80-260 characters (is 369)"], monday);
    expect(r.ok).toBe(true);
    expect(tables.posts[0]).toMatchObject({ slug: topic.slug, status: "draft", title: bad.title });
    const state = await loadState(db);
    expect(state.topics[0]).toMatchObject({ status: "draft", draftId: r.draftId, lastProblems: ["excerpt must be 80-260 characters (is 369)"] });
    expect(state.log.at(-1)?.detail).toMatch(/saved as a draft with 1 problem/);
  });

  it("refuses an unknown topic, an already published topic, or an address used by a published post", async () => {
    const { db } = fakeDb({ acq_settings: [], posts: [{ id: "p1", slug: topic.slug, status: "published" }] });
    expect((await saveDraftFromPreview(db, "no-such-topic", bad, [])).ok).toBe(false);
    const r = await saveDraftFromPreview(db, topic.slug, bad, []);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already exists/);
  });

  it("a later successful rewrite publishes into the same row (no duplicate address)", async () => {
    const { db, tables } = fakeDb({ acq_settings: [{ key: "blog_automation", value: on() }], posts: [] });
    await runBlogAutomation(db, { now: monday, provider: provider(bad) });
    const draftId = tables.posts[0].id;
    const good = goodPost();
    const r = await runBlogAutomation(db, { now: new Date(monday.getTime() + 40 * 60_000), provider: provider(good) });
    expect(r.status).toBe("published");
    expect(tables.posts).toHaveLength(1);
    expect(tables.posts[0]).toMatchObject({ id: draftId, status: "published" });
    expect((await loadState(db)).topics[0].draftId).toBeUndefined();
  });
});
