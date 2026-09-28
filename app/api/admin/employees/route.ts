import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

const DEFAULT_ONBOARDING_CHECKLIST = [
  { task: "Contract signed", done: false, done_at: null },
  { task: "NDA signed", done: false, done_at: null },
  { task: "Payment/bank details collected", done: false, done_at: null },
  { task: "Email & tool access provisioned", done: false, done_at: null },
  { task: "Intro call completed", done: false, done_at: null },
];

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
      meeting_bonus_min = null,
      meeting_bonus_max = null,
      deal_commission_percent_min = null,
      deal_commission_percent_max = null,
      source_application_id = null,
    } = body;

    if (!full_name || !email) {
      return NextResponse.json({ ok: false, error: "Full name and email are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert({
        full_name,
        email,
        role_title,
        employment_type,
        meeting_bonus_min,
        meeting_bonus_max,
        deal_commission_percent_min,
        deal_commission_percent_max,
        source_application_id,
        onboarding_checklist: DEFAULT_ONBOARDING_CHECKLIST,
      })
      .select()
      .single();

    if (error) {
      log("error", { message: "Failed to create employee", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // If this employee was converted from a hired application, reflect that
    // on the application record too, so the ATS list shows it's been acted on.
    if (source_application_id) {
      await supabase
        .from("job_applications")
        .update({ status: "hired", updated_at: new Date().toISOString() })
        .eq("id", source_application_id);
    }

    log("info", { message: "Employee created", context: { id: data.id, email } });
    return NextResponse.json({ ok: true, employee: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
