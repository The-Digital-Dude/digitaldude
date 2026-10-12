import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError } from "@/lib/acquisition/http";
import { acqEnv } from "@/lib/acquisition/env";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import { loadReplyContext, NO_SUGGESTION, suggestReply } from "@/lib/acquisition/replies/suggest";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Drafts a reply for a person to review. Nothing is sent: the text is shown, edited and sent by a human. */
export const POST = adminRoute<{ id: string }>("suggest reply", async (_request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const ctx = await loadReplyContext(db, params.id);
  if (!ctx) return jsonError("Reply not found", 404);
  if (NO_SUGGESTION.has(ctx.classification)) return jsonError("This kind of reply (opt-out, bounce or out-of-office) is not answered.", 409);
  const ai = await resolveAiProvider(db);
  if (!ai) return jsonError("No AI key is set up (Safety & settings > AI).", 409);
  const suggestion = await suggestReply(ai, ctx, { senderName: acqEnv().operatorName });
  if (!suggestion) return jsonError("The AI could not produce a safe suggestion. Please write the reply yourself.", 422);
  return NextResponse.json({ ok: true, suggestion, to: ctx.contactEmail });
});
