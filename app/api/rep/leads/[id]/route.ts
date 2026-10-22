import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";
import { leadPatchSchema } from "@/lib/crm/model";
import { editLead } from "@/lib/crm/edit";

export const dynamic = "force-dynamic";

const TIMELINE_LIMIT = 200;

/** One lead with its timeline and tasks, for the lead drawer. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    const { data: lead } = await supabase.from("rep_leads").select("*").eq("id", id).eq("employee_id", rep.id).maybeSingle();
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    const [{ data: activities }, { data: tasks }] = await Promise.all([
      supabase.from("rep_lead_activities").select("id,type,outcome,summary,details,occurred_at,employee_id").eq("lead_id", id).order("occurred_at", { ascending: false }).limit(TIMELINE_LIMIT),
      supabase.from("rep_lead_tasks").select("id,title,due_at,status,kind,auto,cancel_reason,completed_at").eq("lead_id", id).order("due_at", { ascending: true }).limit(100),
    ]);
    return NextResponse.json({ ok: true, lead, activities: activities ?? [], tasks: tasks ?? [] });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = leadPatchSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: issue ? `${issue.path.join(".") || "lead"}: ${issue.message}` : "Invalid lead details" }, { status: 400 });
    }
    const patch = parsed.data;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const result = await editLead(supabase, id, patch, { actorId: rep.id, scope: "rep", repId: rep.id });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error, ...(result.colleague ? { colleague: true } : {}) }, { status: result.status });
    const { lead: updated, before: existingLead, stageChanged } = result;

    // Record audit log if stage or key info changed
    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "lead_updated",
      description: stageChanged
        ? `Moved lead "${updated.full_name}" from stage "${existingLead.stage}" to "${updated.stage}".`
        : `Updated details for lead "${updated.full_name}".`,
      targetIdentifier: String(updated.email),
      metadata: {
        leadId: id,
        previousStage: existingLead.stage,
        newStage: updated.stage,
      },
    });

    return NextResponse.json({ ok: true, lead: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to update lead" }, { status: 500 });
  }
}

// The dashboard saves edits and stage changes with PUT; accept both so neither is rejected as "method not allowed".
export const PUT = PATCH;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const { data: existingLead } = await supabase
      .from("rep_leads")
      .select("*")
      .eq("id", id)
      .eq("employee_id", rep.id)
      .single();

    if (!existingLead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("rep_leads")
      .delete()
      .eq("id", id)
      .eq("employee_id", rep.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "lead_deleted",
      description: `Deleted lead "${existingLead.full_name}" (${existingLead.email}).`,
      targetIdentifier: existingLead.email,
      metadata: { leadId: id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
