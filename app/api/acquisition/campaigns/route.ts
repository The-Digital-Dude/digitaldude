import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { campaignInput } from "@/lib/acquisition/validation";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list campaigns", async (_req, { db }) => {
  const campaigns = must(await db.from("acq_campaigns").select("*").order("created_at", { ascending: false }).limit(200), "list campaigns");
  return NextResponse.json({ ok: true, campaigns });
});

export const POST = adminRoute("create campaign", async (request, { db }) => {
  const body = await parseBody(request, campaignInput);
  if ("error" in body) return body.error;
  const max = acqEnv().maxDailyLimit;
  if ((body.data.daily_limit ?? 5) > max) return jsonError(`Daily limit cannot exceed ${max} (ACQ_MAX_DAILY_LIMIT)`, 422);

  const row = must(
    await db.from("acq_campaigns").insert({ ...body.data, daily_limit: body.data.daily_limit ?? Math.min(5, max) }).select("id,status").single(),
    "create campaign"
  );
  return NextResponse.json({ ok: true, id: row.id, status: row.status }, { status: 201 });
});
