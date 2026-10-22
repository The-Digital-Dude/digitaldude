import { NextResponse } from "next/server";
import { taskPatchSchema } from "@/lib/crm/model";
import { fail, repContext } from "@/lib/crm/api";
import { logActivity, safely } from "@/lib/crm/activity";

export const dynamic = "force-dynamic";

/** Complete, cancel, snooze or rename one of the rep's tasks. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;
    const { id } = await params;

    const parsed = taskPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid change");
    const p = parsed.data;

    const { data: task } = await db.from("rep_lead_tasks").select("id,lead_id,title,status").eq("id", id).eq("employee_id", rep.id).maybeSingle();
    if (!task) return fail("Task not found", 404);
    if (task.status !== "open") return fail("That task is already closed.", 409);

    const update: Record<string, unknown> = {};
    if (p.title !== undefined) update.title = p.title;
    if (p.dueAt !== undefined) update.due_at = p.dueAt;
    if (p.status === "done") Object.assign(update, { status: "done", completed_at: new Date().toISOString() });
    if (p.status === "cancelled") Object.assign(update, { status: "cancelled", cancel_reason: "cancelled by the rep" });
    if (Object.keys(update).length === 0) return fail("Nothing to change");

    const { error } = await db.from("rep_lead_tasks").update(update).eq("id", id).eq("employee_id", rep.id);
    if (error) return fail(error.message, 500);
    if (p.status === "done") await safely("log task", () => logActivity(db, { leadId: task.lead_id, employeeId: rep.id, type: "task_done", summary: `Done: ${task.title}` }));
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Failed to update task", 500);
  }
}
