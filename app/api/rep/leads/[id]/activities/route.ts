import { NextResponse } from "next/server";
import { activityInputSchema } from "@/lib/crm/model";
import { fail, ownLead, repContext } from "@/lib/crm/api";
import { logActivity } from "@/lib/crm/activity";
import { refreshScores } from "@/lib/crm/refresh";
import { safely } from "@/lib/crm/activity";

export const dynamic = "force-dynamic";

/** A rep logs something they did by hand: a call, a meeting, a LinkedIn or WhatsApp message, or a note. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;
    const { id } = await params;

    const parsed = activityInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid activity");
    const a = parsed.data;

    const lead = await ownLead(db, rep.id, id, "id,status,stage");
    if (!lead) return fail("Lead not found", 404);

    // Nothing can be logged as having happened in the future.
    const when = a.occurredAt && Date.parse(a.occurredAt) <= Date.now() ? a.occurredAt : new Date().toISOString();
    await logActivity(db, { leadId: id, employeeId: rep.id, type: a.type, outcome: a.outcome ?? null, summary: a.summary, occurredAt: when });

    // A conversation moves the status along: a connected call or meeting means "connected"; any first attempt means "attempted".
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const status = String(lead.status);
    const connected = (a.type === "call" && a.outcome === "connected") || (a.type === "meeting" && ["held", "booked"].includes(a.outcome ?? "")) || (["linkedin", "whatsapp"].includes(a.type) && a.outcome === "reply_received");
    if (connected && ["new", "attempted"].includes(status)) patch.status = "connected";
    else if (a.type !== "note" && status === "new") patch.status = "attempted";
    if (a.type !== "note") patch.last_contacted_at = when;
    if (Object.keys(patch).length > 1) await db.from("rep_leads").update(patch).eq("id", id);

    await safely("refresh scores", () => refreshScores(db, [id]));
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Failed to log activity", 500);
  }
}
