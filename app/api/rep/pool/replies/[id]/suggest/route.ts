import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import { loadReplyContext, NO_SUGGESTION, suggestReply } from "@/lib/acquisition/replies/suggest";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Drafts a reply to a contact's answer, for the rep to edit and send through the normal outreach composer.
 * Only for replies from contacts at companies this rep owns. Nothing is sent from here.
 */
export const POST = repRoute<{ id: string }>("suggest reply", async (_request, { rep, db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return repJsonError("Invalid id", 400);
  if (!rateLimit(`rep_reply_suggest:${rep.id}`, 30, 60 * 60 * 1000).ok) return repJsonError("Too many suggestions this hour.", 429);
  const ctx = await loadReplyContext(db, params.id, { employeeId: rep.id });
  if (!ctx || ctx.ownerEmployeeId !== rep.id) return repJsonError("Reply not found", 404);
  if (NO_SUGGESTION.has(ctx.classification)) return repJsonError("This kind of reply is not answered.", 409);
  const ai = await resolveAiProvider(db);
  if (!ai) return repJsonError("The AI is not set up yet. Ask the admin.", 409);
  const { data: me } = await db.from("employees").select("outreach_display_name,full_name").eq("id", rep.id).maybeSingle();
  const suggestion = await suggestReply(ai, ctx, { senderName: ((me?.outreach_display_name as string | null) || (me?.full_name as string | null) || "").trim() });
  if (!suggestion) return repJsonError("The AI could not produce a safe suggestion. Please write the reply yourself.", 422);
  return NextResponse.json({ ok: true, suggestion, to: ctx.contactEmail, name: ctx.contactName, company: ctx.companyName });
});
