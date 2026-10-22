import { fail, ownLead, repContext } from "@/lib/crm/api";

export const dynamic = "force-dynamic";

/** Everything held about one person (their lead record, timeline and tasks) as a JSON file: the data-access request answer. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;
    const { id } = await params;

    const lead = await ownLead(db, rep.id, id);
    if (!lead) return fail("Lead not found", 404);
    const email = String(lead.email);

    const [{ data: activities }, { data: tasks }, { data: outreach }] = await Promise.all([
      db.from("rep_lead_activities").select("type,outcome,summary,details,occurred_at").eq("lead_id", id).order("occurred_at", { ascending: true }),
      db.from("rep_lead_tasks").select("title,due_at,status,kind,completed_at,created_at").eq("lead_id", id).order("due_at", { ascending: true }),
      db.from("rep_outreach_logs").select("*").eq("employee_id", rep.id).ilike("recipient_email", email.replace(/[%_\\]/g, "\\$&")).order("sent_at", { ascending: true }),
    ]);

    const file = { exportedAt: new Date().toISOString(), note: "All personal data this CRM holds about this person.", lead, activities: activities ?? [], tasks: tasks ?? [], emailsSent: outreach ?? [] };
    return new Response(JSON.stringify(file, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="lead-data-${id.slice(0, 8)}.json"`, "Cache-Control": "no-store" },
    });
  } catch {
    return fail("Export failed", 500);
  }
}
