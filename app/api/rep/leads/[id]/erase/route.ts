import { NextResponse } from "next/server";
import { fail, ownLead, repContext } from "@/lib/crm/api";
import { recordRepAuditLog } from "@/lib/repAudit";

export const dynamic = "force-dynamic";

/**
 * Erases a person's data from the CRM on request (the "right to erasure"). Their address is added to the do-not-contact list first so
 * they are never emailed again, then their record is anonymised and their timeline, tasks and email log are deleted. Cannot be undone.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
    if (body?.confirm !== true) return fail("Confirm the erasure first.");

    const lead = await ownLead(db, rep.id, id, "id,email,full_name");
    if (!lead) return fail("Lead not found", 404);

    const { error } = await db.rpc("rep_erase_lead", { p_lead: id, p_actor: `rep:${rep.id}`, p_suppress: true });
    if (error) return fail(error.message, 500);

    // The audit entry deliberately holds no personal data about the person.
    await recordRepAuditLog({ employeeId: rep.id, actionType: "lead_erased", description: "Erased a lead's personal data on request.", metadata: { leadId: id } });
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Erasure failed", 500);
  }
}
