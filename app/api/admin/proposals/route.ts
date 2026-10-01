import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  Proposal,
  getInMemoryProposals,
  addInMemoryProposal,
} from "@/lib/content/proposals";
import { log } from "@/lib/logger";
import { parsePageParams, isRangeNotSatisfiableError } from "@/lib/adminPagination";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();
  const { page, pageSize, from, to } = parsePageParams(searchParams);

  // Return real Supabase data directly when configured — never merge it into
  // the shared in-memory store, which is permanently seeded with a fake demo
  // proposal (Alex Morgan / Morgan Logistics) that would otherwise show up
  // alongside real client proposals in the admin list (confirmed live: this
  // was happening on every request, not just when the table was empty).
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase
        .from("proposals")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (status && status !== "all") query = query.eq("status", status);
      if (search) {
        query = query.or(
          `project_title.ilike.%${search}%,company_name.ilike.%${search}%,client_name.ilike.%${search}%,slug.ilike.%${search}%`
        );
      }

      query = query.range(from, to);
      let { data, error, count } = await query;

      if (error && isRangeNotSatisfiableError(error)) {
        ({ count } = await query.range(0, 0));
        data = [];
        error = null;
      }

      if (!error) {
        return NextResponse.json({ ok: true, proposals: data || [], totalCount: count || 0, page, pageSize });
      }
      log("error", { message: "Failed to fetch proposals in admin", error });
    } catch (err) {
      log("warn", { message: "Supabase proposals list notice", error: err });
    }
  }

  // Only fall back to the demo-seeded in-memory store when Supabase is
  // genuinely unconfigured/unreachable (local/demo use).
  const inMemory = getInMemoryProposals();
  return NextResponse.json({
    ok: true,
    proposals: inMemory,
    totalCount: inMemory.length,
    page: 1,
    pageSize: inMemory.length || 25,
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
    budget_range = "$6,000 – $15,000",
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

  const newProposal: Proposal = {
    id: crypto.randomUUID(),
    slug,
    booking_id,
    client_name: String(client_name).trim(),
    client_email: String(client_email).trim(),
    company_name: String(company_name).trim(),
    country: String(country).trim(),
    project_title: String(project_title).trim(),
    system_type: String(system_type).trim(),
    scope_summary: String(scope_summary).trim(),
    problem_statement: String(problem_statement || "").trim(),
    target_timeline: String(target_timeline).trim(),
    budget_range: String(budget_range).trim(),
    tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
    architecture_modules: Array.isArray(architecture_modules) ? architecture_modules : [],
    deliverable_phases: Array.isArray(deliverable_phases) ? deliverable_phases : [],
    status: status || "draft",
    valid_until: validUntilDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .insert(newProposal)
        .select()
        .single();

      if (error) {
        log("error", { message: "Supabase insert error on proposal", error });
        return NextResponse.json({ ok: false, error: error.message || "Failed to create proposal in database." }, { status: 500 });
      }

      if (data) {
        addInMemoryProposal(data);
        return NextResponse.json({ ok: true, proposal: data });
      }
    } catch (err) {
      log("error", { message: "Failed inserting proposal to Supabase", error: err });
      return NextResponse.json({ ok: false, error: "Database exception while creating proposal." }, { status: 500 });
    }
  }

  // Local development fallback
  addInMemoryProposal(newProposal);
  return NextResponse.json({ ok: true, proposal: newProposal });
}

