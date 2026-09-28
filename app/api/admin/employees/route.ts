import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { sendOnboardingWelcomeEmail } from "@/lib/recruitingEmails";

const DEFAULT_ONBOARDING_CHECKLIST = [
  { task: "Contract & Commission Agreement signed", done: false, done_at: null },
  { task: "NDA & Confidentiality agreement signed", done: false, done_at: null },
  { task: "Payment/bank details (bKash/Nagad/Bank) collected", done: false, done_at: null },
  { task: "Email & Outreach tools (Apollo/LinkedIn) provisioned", done: false, done_at: null },
  { task: "Sales Playbook & Pitch Deck review completed", done: false, done_at: null },
  { task: "Intro 1-on-1 Strategy Call completed with CEO", done: false, done_at: null },
];

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    let query = supabase.from("employees").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      log("error", { message: "Failed to fetch employees", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, employees: data || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      full_name,
      email,
      role_title = "",
      employment_type = "commission",
      currency = "BDT",
      referral_code,
      meeting_bonus_min = 1000,
      meeting_bonus_max = 2000,
      deal_commission_percent_min = 10,
      deal_commission_percent_max = 15,
      source_application_id = null,
      onboarding_checklist,
      send_welcome_email = true,
      custom_welcome_notes = "",
    } = body;

    if (!full_name || !email) {
      return NextResponse.json({ ok: false, error: "Full name and email are required." }, { status: 400 });
    }

    const generatedRefCode = (referral_code || slugifyName(full_name)).trim().toLowerCase();

    const { data, error } = await supabase
      .from("employees")
      .insert({
        full_name,
        email,
        role_title,
        employment_type,
        currency,
        referral_code: generatedRefCode,
        meeting_bonus_min,
        meeting_bonus_max,
        deal_commission_percent_min,
        deal_commission_percent_max,
        source_application_id,
        onboarding_checklist: onboarding_checklist || DEFAULT_ONBOARDING_CHECKLIST,
      })
      .select()
      .single();

    if (error) {
      log("error", { message: "Failed to create employee", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (source_application_id) {
      await supabase
        .from("job_applications")
        .update({ status: "hired", updated_at: new Date().toISOString() })
        .eq("id", source_application_id);
    }

    // Dispatch welcome email if enabled
    if (send_welcome_email) {
      try {
        await sendOnboardingWelcomeEmail({
          fullName: full_name,
          email,
          roleTitle: role_title,
          referralCode: generatedRefCode,
          currency,
          meetingBonusMin: meeting_bonus_min,
          meetingBonusMax: meeting_bonus_max,
          dealCommissionMin: deal_commission_percent_min,
          dealCommissionMax: deal_commission_percent_max,
          employmentType: employment_type,
          customNotes: custom_welcome_notes,
        });
      } catch (mailErr) {
        log("warn", { message: "Failed to send onboarding welcome email", error: mailErr });
      }
    }

    log("info", { message: "Employee created", context: { id: data.id, email } });
    return NextResponse.json({ ok: true, employee: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
