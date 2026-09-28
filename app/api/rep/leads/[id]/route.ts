import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";

export const dynamic = "force-dynamic";

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
    const body = await request.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    // Verify ownership
    const { data: existingLead } = await supabase
      .from("rep_leads")
      .select("*")
      .eq("id", id)
      .eq("employee_id", rep.id)
      .single();

    if (!existingLead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.stage !== undefined) updatePayload.stage = body.stage;
    if (body.full_name !== undefined) updatePayload.full_name = body.full_name.trim();
    if (body.email !== undefined) updatePayload.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updatePayload.phone = body.phone?.trim() || null;
    if (body.company_name !== undefined) updatePayload.company_name = body.company_name?.trim() || null;
    if (body.job_title !== undefined) updatePayload.job_title = body.job_title?.trim() || null;
    if (body.estimated_deal_value !== undefined) updatePayload.estimated_deal_value = Number(body.estimated_deal_value) || 0;
    if (body.notes !== undefined) updatePayload.notes = body.notes;
    if (body.last_contacted_at !== undefined) updatePayload.last_contacted_at = body.last_contacted_at;

    const { data: updated, error } = await supabase
      .from("rep_leads")
      .update(updatePayload)
      .eq("id", id)
      .eq("employee_id", rep.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Record audit log if stage or key info changed
    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "lead_updated",
      description: body.stage && body.stage !== existingLead.stage
        ? `Moved lead "${updated.full_name}" from stage "${existingLead.stage}" to "${body.stage}".`
        : `Updated details for lead "${updated.full_name}".`,
      targetIdentifier: updated.email,
      metadata: {
        leadId: id,
        previousStage: existingLead.stage,
        newStage: updated.stage,
      },
    });

    return NextResponse.json({ ok: true, lead: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to update lead" }, { status: 500 });
  }
}

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
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
