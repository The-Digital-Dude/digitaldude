import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { campaignStatusBody } from "@/lib/acquisition/validation";
import { checkCampaignCompliance } from "@/lib/acquisition/compliance/templates";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

const TARGET = { submit: "pending_approval", revoke: "draft", launch: "active", pause: "paused", resume: "active", complete: "completed" } as const;

/**
 * Workflow transitions other than approve/reject (see /approvals). The database
 * state machine is authoritative; this adds the pre-submission compliance check.
 */
export const POST = adminRoute<{ id: string }>("campaign status", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, campaignStatusBody);
  if ("error" in body) return body.error;
  const { action } = body.data;

  if (action === "submit") {
    const { data: c } = await db.from("acq_campaigns").select("*").eq("id", params.id).maybeSingle();
    if (!c) return jsonError("Campaign not found", 404);
    const issues = checkCampaignCompliance(c);
    if (issues.length) return jsonError("Campaign is not ready for approval", 422, { issues });
  }

  must(await db.rpc("acq_set_campaign_status", { p_campaign_id: params.id, p_status: TARGET[action], p_actor: acqEnv().operatorName }), "campaign status");
  return NextResponse.json({ ok: true, status: TARGET[action] });
});
