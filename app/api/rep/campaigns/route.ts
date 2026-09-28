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
    const { data: campaigns, error } = await supabase
      .from("rep_campaigns")
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        rep_campaign_steps (
          id,
          step_number,
          delay_days,
          subject,
          body
        ),
        rep_campaign_enrollments (
          id,
          status,
          current_step
        )
      `)
      .eq("rep_id", rep.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, campaigns: campaigns || [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { title, description, steps } = body;

    if (!title) {
      return NextResponse.json({ ok: false, error: "Campaign title is required" }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error: campError } = await supabase
      .from("rep_campaigns")
      .insert({
        rep_id: rep.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: "active",
      })
      .select("*")
      .single();

    if (campError || !campaign) {
      return NextResponse.json({ ok: false, error: campError?.message || "Failed to create campaign" }, { status: 500 });
    }

    // Default 3-step cadence if not provided
    const defaultSteps = steps && steps.length > 0 ? steps : [
      {
        step_number: 1,
        delay_days: 0,
        subject: "Quick question regarding {{company_name}}'s web platform",
        body: "Hi {{first_name}},\n\nI came across {{company_name}} and noticed a few high-impact opportunities to accelerate your digital conversion rates and platform speed.\n\nWe recently helped a similar company scale their architecture and 3x their qualified inbound pipeline.\n\nAre you open to a brief 10-minute chat this week? You can pick a time that suits you here: {{rep_booking_link}}\n\nBest,\n{{rep_name}}",
      },
      {
        step_number: 2,
        delay_days: 3,
        subject: "Follow up — {{company_name}} digital growth & tech architecture",
        body: "Hi {{first_name}},\n\nFollowing up on my note from earlier this week. I wanted to share a quick case study of our recent build for a leading team in {{industry}}.\n\nWould Thursday afternoon work for a brief 10-minute introduction?\n\n{{rep_booking_link}}\n\nBest,\n{{rep_name}}",
      },
      {
        step_number: 3,
        delay_days: 4,
        subject: "Permission to close your file, {{first_name}}?",
        body: "Hi {{first_name}},\n\nI understand you're likely flat out right now. If scaling {{company_name}}'s software platform isn't a current priority, no worries at all.\n\nFeel free to keep my contact handy whenever you're ready to explore next-gen engineering and web systems.\n\nWarm regards,\n{{rep_name}}",
      },
    ];

    const stepInserts = defaultSteps.map((s: any) => ({
      campaign_id: campaign.id,
      step_number: s.step_number,
      delay_days: s.delay_days,
      subject: s.subject,
      body: s.body,
    }));

    const { error: stepsError } = await supabase.from("rep_campaign_steps").insert(stepInserts);
    if (stepsError) {
      return NextResponse.json({ ok: false, error: stepsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
