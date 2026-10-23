import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const enabled = Boolean(body.enabled);

    // Fetch existing employee
    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, full_name, email, role_title, assigned_outreach_email, payout_details")
      .eq("id", id)
      .single();

    if (empErr || !employee) {
      return NextResponse.json({ ok: false, error: "Employee not found" }, { status: 404 });
    }

    const currentPayout = employee.payout_details && typeof employee.payout_details === "object"
      ? employee.payout_details
      : {};

    const updatedPayout = {
      ...currentPayout,
      auto_outreach_enabled: enabled,
      auto_outreach_updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from("employees")
      .update({
        payout_details: updatedPayout,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      log("error", { message: "Failed to toggle auto outreach permission", error: updateErr });
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    // Log the permission change in rep_audit_logs
    await supabase.from("rep_audit_logs").insert({
      employee_id: id,
      action_type: "auto_outreach_toggled",
      description: `Admin ${enabled ? "granted" : "revoked"} automated cold outreach permission for ${employee.full_name} (${employee.assigned_outreach_email || employee.email}).`,
      target_identifier: employee.assigned_outreach_email || employee.email,
      metadata: {
        auto_outreach_enabled: enabled,
        rep_name: employee.full_name,
        admin_action: true,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      id,
      auto_outreach_enabled: enabled,
      message: `Automated cold outreach ${enabled ? "enabled" : "disabled"} for ${employee.full_name}.`,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
