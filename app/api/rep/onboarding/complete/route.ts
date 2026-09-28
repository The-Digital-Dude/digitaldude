import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const { error } = await supabase
      .from("employees")
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq("id", rep.id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "onboarding_completed",
      description: `Completed mandatory Sales Rep Onboarding & Training modules.`,
      targetIdentifier: rep.email,
    });

    return NextResponse.json({ ok: true, onboarding_completed: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to update onboarding status" }, { status: 500 });
  }
}
