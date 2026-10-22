import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { acqEnv } from "@/lib/acquisition/env";
import { alertRep } from "@/lib/acquisition/alerts";

export const dynamic = "force-dynamic";

const body = z.object({ leadIds: z.array(z.string().uuid()).min(1).max(500), toEmployeeId: z.string().uuid() });

/** Moves leads (with their open tasks) to another rep. The new owner is told. */
export const POST = adminRoute("reassign leads", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const { leadIds, toEmployeeId } = parsed.data;
  const { data: target } = await db.from("employees").select("id,status,full_name").eq("id", toEmployeeId).maybeSingle();
  if (!target || target.status === "offboarded") return jsonError("Choose an active rep to receive the leads.", 422);

  const { data, error } = await db.rpc("rep_reassign_leads", { p_lead_ids: leadIds, p_to: toEmployeeId, p_actor: acqEnv().operatorName });
  if (error) return jsonError(error.message, 409);
  const moved = Number(data ?? 0);
  await logAudit(db, "crm.leads_reassigned", "rep_lead", null, { count: moved, toEmployeeId });
  if (moved > 0) await alertRep(db, toEmployeeId, { kind: "leads_reassigned", title: `${moved} ${moved === 1 ? "lead was" : "leads were"} assigned to you`, body: "Open your leads to see them and pick the next step.", dedupeKey: `reassign:${toEmployeeId}:${Date.now()}` });
  return NextResponse.json({ ok: true, moved });
});
