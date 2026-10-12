import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { replyReviewBody } from "@/lib/acquisition/validation";
import { applyClassification } from "@/lib/acquisition/replies/process";
import { acqEnv } from "@/lib/acquisition/env";

export const dynamic = "force-dynamic";

/** Human classification of a reply. Changing a class can add a suppression; it can never remove one. */
export const PATCH = adminRoute<{ id: string }>("review reply", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, replyReviewBody);
  if ("error" in body) return body.error;
  await applyClassification(db, params.id, { classification: body.data.classification, confidence: 1, by: "rules" }, acqEnv().operatorName);
  return NextResponse.json({ ok: true });
});
