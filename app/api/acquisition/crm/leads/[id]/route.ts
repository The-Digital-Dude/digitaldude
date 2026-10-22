import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { leadPatchSchema } from "@/lib/crm/model";
import { editLead } from "@/lib/crm/edit";

export const dynamic = "force-dynamic";

/** One lead with its whole timeline and tasks (admin view). */
export const GET = adminRoute<{ id: string }>("load crm lead", async (_request, { params, db }) => {
  const { data: lead } = await db.from("rep_leads").select("*, employees(full_name,email)").eq("id", params.id).maybeSingle();
  if (!lead) return jsonError("Lead not found", 404);
  const [{ data: activities }, { data: tasks }] = await Promise.all([
    db.from("rep_lead_activities").select("id,type,outcome,summary,details,occurred_at,employee_id").eq("lead_id", params.id).order("occurred_at", { ascending: false }).limit(300),
    db.from("rep_lead_tasks").select("id,title,due_at,status,kind,auto,cancel_reason,completed_at").eq("lead_id", params.id).order("due_at", { ascending: true }).limit(100),
  ]);
  return NextResponse.json({ ok: true, lead, activities: activities ?? [], tasks: tasks ?? [] });
});

/** Edit any field of any lead (same rules as the rep: a lost deal needs a reason, a changed address is verified). */
export const PATCH = adminRoute<{ id: string }>("edit crm lead", async (request, { params, db }) => {
  const parsed = leadPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "lead"}: ${parsed.error.issues[0].message}` : "Invalid lead details", 400);
  const result = await editLead(db, params.id, parsed.data, { actorId: null, scope: "admin" });
  if (!result.ok) return jsonError(result.error, result.status);
  await logAudit(db, "crm.lead_edited", "rep_lead", params.id, { fields: Object.keys(parsed.data) });
  return NextResponse.json({ ok: true, lead: result.lead });
});
