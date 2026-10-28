import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { runBlogAutomation } from "@/lib/blog/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ mode: z.enum(["preview", "publish"]) });

/** "Preview" writes and checks the next post without saving it. "Publish" writes it and publishes it now, ignoring the schedule. */
export const POST = adminRoute("run blog automation", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const preview = parsed.data.mode === "preview";
  const result = await runBlogAutomation(db, preview ? { preview: true } : { force: true });
  if (!preview) await logAudit(db, "blog.published_now", "post", null, { status: result.status, slug: result.slug ?? null });
  return NextResponse.json({ ok: result.status !== "error" && result.status !== "no_ai", result });
});
