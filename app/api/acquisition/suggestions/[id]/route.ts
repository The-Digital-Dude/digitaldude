import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { suggestionBody } from "@/lib/acquisition/validation";
import { acqEnv } from "@/lib/acquisition/env";
import { reviewSuggestions } from "@/lib/acquisition/contacts/review";

export const dynamic = "force-dynamic";

/**
 * Accept or dismiss an AI-found address suggestion. Accepting creates an ordinary contact in
 * `needs_review`: it still has no consent record, so it cannot join a campaign or be emailed
 * until a person records a consent review.
 */
export const PATCH = adminRoute<{ id: string }>("review suggestion", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, suggestionBody);
  if ("error" in body) return body.error;

  const [r] = await reviewSuggestions(db, [params.id], body.data.action === "dismiss" ? "dismiss" : "accept", acqEnv().operatorName);
  if (r.status === "skipped") return jsonError(r.note === "not found" ? "Suggestion not found" : "Suggestion was already reviewed", r.note === "not found" ? 404 : 409);
  return NextResponse.json({ ok: true, status: r.status, contactId: r.contactId ?? null });
});
