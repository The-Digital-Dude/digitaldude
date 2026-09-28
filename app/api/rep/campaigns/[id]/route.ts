import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data: campaign, error } = await supabase
      .from("rep_campaigns")
      .select(`
        *,
        rep_campaign_steps (*),
        rep_campaign_enrollments (
          id,
          lead_id,
          current_step,
          status,
          enrolled_at,
          last_dispatched_at,
          rep_leads (
            id,
            full_name,
            email,
            company_name,
            status
          )
        )
      `)
      .eq("id", id)
      .eq("rep_id", rep.id)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { title, description, status, steps } = body;

    // Update campaign header
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description;
    if (status) updatePayload.status = status;

    await supabase
      .from("rep_campaigns")
      .update(updatePayload)
      .eq("id", id)
      .eq("rep_id", rep.id);

    // If steps provided, upsert them
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        if (step.id) {
          await supabase
            .from("rep_campaign_steps")
            .update({
              subject: step.subject,
              body: step.body,
              delay_days: step.delay_days,
              updated_at: new Date().toISOString(),
            })
            .eq("id", step.id)
            .eq("campaign_id", id);
        } else {
          await supabase.from("rep_campaign_steps").insert({
            campaign_id: id,
            step_number: step.step_number,
            delay_days: step.delay_days || 0,
            subject: step.subject,
            body: step.body,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, message: "Campaign updated" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    await supabase.from("rep_campaigns").delete().eq("id", id).eq("rep_id", rep.id);
    return NextResponse.json({ ok: true, message: "Campaign deleted" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
