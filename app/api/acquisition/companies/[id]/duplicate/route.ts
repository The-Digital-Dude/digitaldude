import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { duplicateBody } from "@/lib/acquisition/validation";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/**
 * Review a flagged near-duplicate. `merge` folds this company into the keeper (contacts, research and
 * suggestions move; this record is archived, never deleted). `dismiss` records that it is a different company.
 */
export const POST = adminRoute<{ id: string }>("review duplicate", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, duplicateBody);
  if ("error" in body) return body.error;

  if (body.data.action === "dismiss") {
    must(await db.from("acq_companies").update({ possible_duplicate_of: null, duplicate_dismissed: true }).eq("id", params.id).select("id"), "dismiss duplicate");
    await logAudit(db, "company.duplicate_dismissed", "company", params.id, {});
    return NextResponse.json({ ok: true });
  }

  must(await db.rpc("acq_merge_companies", { p_keeper: body.data.keeperId, p_dup: params.id, p_actor: acqEnv().operatorName }), "merge companies");
  return NextResponse.json({ ok: true, keeperId: body.data.keeperId });
});
