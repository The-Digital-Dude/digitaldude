import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { enrollLeadInCampaign } from "@/lib/outreachDrip";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { lead_ids } = body;

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ ok: false, error: "Please select at least one lead to enroll" }, { status: 400 });
    }

    // Cap batch size: nothing else limits how many leads can be enrolled (and
    // therefore emailed) in a single request, which combined with the queue
    // processor risks sending-domain reputation/spam issues at volume.
    const MAX_ENROLL_BATCH = 200;
    if (lead_ids.length > MAX_ENROLL_BATCH) {
      return NextResponse.json(
        { ok: false, error: `You can enroll at most ${MAX_ENROLL_BATCH} leads at once. Split this into smaller batches.` },
        { status: 400 }
      );
    }

    // Verify campaign belongs to rep
    const { data: campaign, error: campError } = await supabase
      .from("rep_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("rep_id", rep.id)
      .single();

    if (campError || !campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    let enrolledCount = 0;
    const errors: string[] = [];

    for (const leadId of lead_ids) {
      try {
        await enrollLeadInCampaign({
          campaignId,
          repId: rep.id,
          leadId,
        });
        enrolledCount++;
      } catch (err: unknown) {
        errors.push(`Lead ${leadId}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      enrolled: enrolledCount,
      total: lead_ids.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
