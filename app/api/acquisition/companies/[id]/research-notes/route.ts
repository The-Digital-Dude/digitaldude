import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { researchNoteInput } from "@/lib/acquisition/validation";
import { rescoreCompany } from "@/lib/acquisition/research/pipeline";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/** Manual research fallback: record a sourced fact yourself; the score is recomputed from all records. */
export const POST = adminRoute<{ id: string }>("add research note", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, researchNoteInput);
  if ("error" in body) return body.error;

  const { data: company } = await db.from("acq_companies").select("id").eq("id", params.id).maybeSingle();
  if (!company) return jsonError("Company not found", 404);

  const note = must(
    await db.from("acq_research_records").insert({ company_id: params.id, ...body.data, model_version: "manual" }).select("id").single(),
    "save note"
  );
  const score = await rescoreCompany(params.id, db);
  await logAudit(db, "research.note_added", "company", params.id, { noteId: note.id, category: body.data.category });
  return NextResponse.json({ ok: true, score: score.score, band: score.band }, { status: 201 });
});
