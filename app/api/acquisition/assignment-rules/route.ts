import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { assignmentRuleInput } from "@/lib/acquisition/validation";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list rules", async (_req, { db }) => {
  const rules = must(await db.from("acq_assignment_rules").select("*").order("priority").order("created_at"), "rules");
  return NextResponse.json({ ok: true, rules });
});

/** e.g. "UK law firms with fit score >= 60 go to Rep A". The lowest priority number that matches wins. */
export const POST = adminRoute("create rule", async (request, { db }) => {
  const parsed = await parseBody(request, assignmentRuleInput);
  if ("error" in parsed) return parsed.error;
  const r = parsed.data;
  const { data: rep } = await db.from("employees").select("id,status").eq("id", r.employeeId).maybeSingle();
  if (!rep || rep.status === "offboarded") return jsonError("Rep not found or offboarded", 404);
  const row = must(
    await db.from("acq_assignment_rules").insert({ employee_id: r.employeeId, market_id: r.marketId ?? null, country: r.country ?? null, min_fit_score: r.minFitScore ?? null, priority: r.priority }).select("id").single(),
    "create rule"
  );
  await logAudit(db, "rule.created", "rule", row.id, { employeeId: r.employeeId });
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
});
