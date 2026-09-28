import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data: queueItems, error } = await supabase
      .from("rep_campaign_queue")
      .select(`
        id,
        scheduled_for,
        status,
        step_number,
        dispatched_at,
        error_message,
        rep_leads (
          id,
          full_name,
          email,
          company_name
        ),
        rep_campaigns (
          id,
          title
        ),
        rep_campaign_steps (
          id,
          subject
        )
      `)
      .eq("rep_id", rep.id)
      .order("scheduled_for", { ascending: true })
      .limit(100);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, queue: queueItems || [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { queue_id, action } = body;

    if (!queue_id) {
      return NextResponse.json({ ok: false, error: "Queue ID is required" }, { status: 400 });
    }

    if (action === "cancel") {
      const { error } = await supabase
        .from("rep_campaign_queue")
        .update({
          status: "cancelled",
          error_message: "Cancelled by sales rep",
          updated_at: new Date().toISOString(),
        })
        .eq("id", queue_id)
        .eq("rep_id", rep.id);

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, message: "Queue item updated" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
