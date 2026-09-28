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

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.template_name !== undefined) updatePayload.template_name = body.template_name.trim();
    if (body.subject !== undefined) updatePayload.subject = body.subject.trim();
    if (body.body_content !== undefined) updatePayload.body_content = body.body_content.trim();
    if (body.is_default !== undefined) updatePayload.is_default = Boolean(body.is_default);

    const { data: updated, error } = await supabase
      .from("rep_email_templates")
      .update(updatePayload)
      .eq("id", id)
      .eq("employee_id", rep.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "template_updated",
      description: `Updated email template "${updated.template_name}".`,
      targetIdentifier: updated.template_name,
      metadata: { templateId: id },
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to update template" }, { status: 500 });
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

    const { data: existing } = await supabase
      .from("rep_email_templates")
      .select("*")
      .eq("id", id)
      .eq("employee_id", rep.id)
      .single();

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("rep_email_templates")
      .delete()
      .eq("id", id)
      .eq("employee_id", rep.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "template_deleted",
      description: `Deleted custom email template "${existing.template_name}".`,
      targetIdentifier: existing.template_name,
      metadata: { templateId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to delete template" }, { status: 500 });
  }
}
