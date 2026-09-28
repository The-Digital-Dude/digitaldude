import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, lead_id, reason } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Insert into rep_unsubscribes
    await supabase.from("rep_unsubscribes").upsert(
      {
        email: cleanEmail,
        lead_id: lead_id || null,
        reason: reason || "User 1-click opt-out",
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    // 2. Cancel all pending queue items for leads matching this email
    const { data: leads } = await supabase
      .from("rep_leads")
      .select("id")
      .eq("email", cleanEmail);

    if (leads && leads.length > 0) {
      const leadIds = leads.map((l) => l.id);

      await supabase
        .from("rep_campaign_queue")
        .update({
          status: "cancelled",
          error_message: "Recipient unsubscribed",
          updated_at: new Date().toISOString(),
        })
        .in("lead_id", leadIds)
        .eq("status", "pending");

      await supabase
        .from("rep_campaign_enrollments")
        .update({
          status: "cancelled_unsubscribed",
          updated_at: new Date().toISOString(),
        })
        .in("lead_id", leadIds)
        .eq("status", "active");
    }

    return NextResponse.json({ ok: true, message: "Successfully unsubscribed" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
