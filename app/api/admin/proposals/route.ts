import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { DEMO_PROPOSAL, Proposal } from "@/lib/content/proposals";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ ok: true, proposals: data });
      }
    } catch (err) {
      log("warn", { message: "Supabase proposals list notice", error: err });
    }
  }

  // Fallback demo proposals
  return NextResponse.json({
    ok: true,
    proposals: [DEMO_PROPOSAL],
  });
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_name,
    client_email,
    company_name,
    country = "United Kingdom",
    project_title,
    system_type = "Custom Web Application",
    scope_summary,
    problem_statement = "",
    target_timeline = "4–8 Weeks",
    budget_range = "£6,000 – £15,000",
    tech_stack = [],
    architecture_modules = [],
    deliverable_phases = [],
    status = "draft",
    valid_until,
    booking_id = null,
  } = body || {};

  if (!client_name || !client_email || !company_name || !project_title || !scope_summary) {
    return NextResponse.json({ ok: false, error: "Missing required proposal fields." }, { status: 400 });
  }

  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const slug = `TDD-SPEC-${new Date().getFullYear()}-${code}`;
  const validUntilDate = valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const proposalRecord: Partial<Proposal> = {
    slug,
    booking_id,
    client_name,
    client_email,
    company_name,
    country,
    project_title,
    system_type,
    scope_summary,
    problem_statement,
    target_timeline,
    budget_range,
    tech_stack,
    architecture_modules,
    deliverable_phases,
    status,
    valid_until: validUntilDate,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .insert(proposalRecord)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, proposal: data });
      } else if (error) {
        log("error", { message: "Supabase insert error on proposal", error });
      }
    } catch (err) {
      log("error", { message: "Failed inserting proposal", error: err });
    }
  }

  // Fallback return
  const fallbackCreated: Proposal = {
    id: `prop-${Date.now()}`,
    slug,
    booking_id,
    client_name,
    client_email,
    company_name,
    country,
    project_title,
    system_type,
    scope_summary,
    problem_statement,
    target_timeline,
    budget_range,
    tech_stack,
    architecture_modules,
    deliverable_phases,
    status,
    valid_until: validUntilDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, proposal: fallbackCreated });
}
