import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { loadState, saveState } from "@/lib/blog/automation";

export const dynamic = "force-dynamic";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("skip"), slug }),
  z.object({ action: z.literal("requeue"), slug }),
  z.object({ action: z.literal("up"), slug }),
  z.object({ action: z.literal("down"), slug }),
  z.object({
    action: z.literal("add"),
    slug,
    title: z.string().trim().min(10).max(120),
    keyword: z.string().trim().min(3).max(100),
    category: z.string().trim().min(3).max(60),
    author: z.enum(["Farhad Hossain", "Tanvir Ahmed Shuvo"]),
    angle: z.array(z.string().trim().min(5).max(300)).min(2).max(8),
  }),
]);

/** Manage the queue: skip a topic, put it back, reorder, or add your own with a brief. */
export const POST = adminRoute("edit blog topics", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;
  const state = await loadState(db);
  const i = state.topics.findIndex((t) => t.slug === b.slug);

  if (b.action === "add") {
    if (i >= 0) return jsonError("A topic with that address already exists.", 409);
    state.topics.push({ slug: b.slug, title: b.title, keyword: b.keyword, secondary: [], category: b.category, author: b.author, angle: b.angle, links: ["/contact"], status: "queued", attempts: 0 });
  } else {
    if (i < 0) return jsonError("Topic not found.", 404);
    const t = state.topics[i];
    if (b.action === "skip") t.status = "skipped";
    if (b.action === "requeue") Object.assign(t, { status: "queued", attempts: 0, lastError: undefined, lastProblems: undefined, lastAttemptAt: undefined });
    if (b.action === "up" || b.action === "down") {
      const j = b.action === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < state.topics.length) [state.topics[i], state.topics[j]] = [state.topics[j], state.topics[i]];
    }
  }
  await saveState(db, state);
  await logAudit(db, "blog.topics_edited", "settings", null, { action: b.action, slug: b.slug });
  return NextResponse.json({ ok: true, state });
});
