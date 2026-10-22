import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { acqEnv } from "@/lib/acquisition/env";
import { refreshScores } from "@/lib/crm/refresh";

export const dynamic = "force-dynamic";

const body = z.object({ keepId: z.string().uuid(), dropId: z.string().uuid() });

/** Merges a duplicate lead into the one to keep: timeline, open tasks, tags and missing details move across, then the duplicate is removed. */
export const POST = adminRoute("merge leads", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const { keepId, dropId } = parsed.data;
  const { error } = await db.rpc("rep_merge_leads", { p_keep: keepId, p_drop: dropId, p_actor: acqEnv().operatorName });
  if (error) return jsonError(error.message, 409);
  await logAudit(db, "crm.leads_merged", "rep_lead", keepId, { droppedId: dropId });
  await refreshScores(db, [keepId]).catch(() => undefined);
  return NextResponse.json({ ok: true });
});
