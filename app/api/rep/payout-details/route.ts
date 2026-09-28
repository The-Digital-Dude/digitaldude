import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { log } from "@/lib/logger";
import { recordRepAuditLog } from "@/lib/repAudit";

export async function PUT(request: Request) {
  const repSession = await getAuthenticatedRep(request);
  if (!repSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { payout_details } = body;

    if (!payout_details || typeof payout_details !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payout details object." }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("employees")
      .update({
        payout_details,
        updated_at: new Date().toISOString(),
      })
      .eq("id", repSession.id)
      .select("id, payout_details")
      .single();

    if (error) {
      log("error", { message: "Failed to update rep payout details", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: repSession.id,
      actionType: "payout_updated",
      description: `Updated banking/payout details (${payout_details.method || "custom"}).`,
      targetIdentifier: repSession.email,
      metadata: { method: payout_details.method },
    });

    return NextResponse.json({ ok: true, payout_details: updated.payout_details });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
