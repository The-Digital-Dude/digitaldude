import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { campaignInput } from "@/lib/acquisition/validation";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** Edit a draft/rejected campaign. Once submitted for approval the database freezes the content. */
export const PATCH = adminRoute<{ id: string }>("edit campaign", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, campaignInput);
  if ("error" in body) return body.error;
  const max = acqEnv().maxDailyLimit;
  if ((body.data.daily_limit ?? 5) > max) return jsonError(`Daily limit cannot exceed ${max} (ACQ_MAX_DAILY_LIMIT)`, 422);

  const rows = must(await db.from("acq_campaigns").update(body.data).eq("id", params.id).select("id,status"), "edit campaign");
  if (!rows.length) return jsonError("Campaign not found", 404);
  return NextResponse.json({ ok: true, status: rows[0].status });
});
