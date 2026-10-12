import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

const patch = z.object({ enabled: z.boolean().optional(), delete: z.boolean().optional() });

/** Enable/disable or delete a rule (POST/PATCH with JSON; delete=true removes it). Rules never touch already-assigned companies. */
export const PATCH = adminRoute<{ id: string }>("update rule", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const parsed = await parseBody(request, patch);
  if ("error" in parsed) return parsed.error;
  if (parsed.data.delete) {
    must(await db.from("acq_assignment_rules").delete().eq("id", params.id).select("id"), "delete rule");
    await logAudit(db, "rule.deleted", "rule", params.id, {});
    return NextResponse.json({ ok: true });
  }
  if (parsed.data.enabled === undefined) return jsonError("Nothing to update", 422);
  must(await db.from("acq_assignment_rules").update({ enabled: parsed.data.enabled }).eq("id", params.id).select("id"), "update rule");
  await logAudit(db, parsed.data.enabled ? "rule.enabled" : "rule.disabled", "rule", params.id, {});
  return NextResponse.json({ ok: true });
});
