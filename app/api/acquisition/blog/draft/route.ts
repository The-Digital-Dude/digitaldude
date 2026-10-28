import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { saveDraftFromPreview } from "@/lib/blog/automation";

export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  post: z.object({
    title: z.string().trim().min(5).max(200),
    metaTitle: z.string().trim().max(200),
    metaDescription: z.string().trim().max(400),
    excerpt: z.string().trim().max(600),
    content: z.string().min(50).max(80_000),
  }),
  problems: z.array(z.string().max(400)).max(30),
});

/** Keeps a previewed (typically rejected) post as a draft, with the checker's problems, so it can be fixed in the blog editor and published. */
export const POST = adminRoute("save blog draft", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const r = await saveDraftFromPreview(db, parsed.data.slug, parsed.data.post, parsed.data.problems);
  if (!r.ok) return jsonError(r.error ?? "Could not save the draft.", 409);
  await logAudit(db, "blog.draft_saved", "post", r.draftId ?? null, { slug: parsed.data.slug });
  return NextResponse.json({ ok: true, draftId: r.draftId });
});
