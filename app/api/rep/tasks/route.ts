import { NextResponse } from "next/server";
import { taskInputSchema } from "@/lib/crm/model";
import { fail, ownLead, repContext } from "@/lib/crm/api";
import { createTask } from "@/lib/crm/activity";

export const dynamic = "force-dynamic";

/** The rep's open tasks (soonest first) with the lead each belongs to, plus what they finished in the last week. */
export async function GET(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;

    const [{ data: open }, { data: done }] = await Promise.all([
      db.from("rep_lead_tasks").select("id,lead_id,title,due_at,kind,auto,rep_leads(full_name,company_name,stage)").eq("employee_id", rep.id).eq("status", "open").order("due_at", { ascending: true }).limit(300),
      db.from("rep_lead_tasks").select("id,lead_id,title,completed_at,rep_leads(full_name)").eq("employee_id", rep.id).eq("status", "done").gte("completed_at", new Date(Date.now() - 7 * 86_400_000).toISOString()).order("completed_at", { ascending: false }).limit(50),
    ]);
    return NextResponse.json({ ok: true, open: open ?? [], done: done ?? [] });
  } catch {
    return fail("Failed to load tasks", 500);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;

    const parsed = taskInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid task");
    if (!(await ownLead(db, rep.id, parsed.data.leadId, "id"))) return fail("Lead not found", 404);

    await createTask(db, { leadId: parsed.data.leadId, employeeId: rep.id, title: parsed.data.title, dueAt: new Date(parsed.data.dueAt) });
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Failed to create task", 500);
  }
}
