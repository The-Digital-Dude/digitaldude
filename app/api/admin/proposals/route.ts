import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  Proposal,
  getInMemoryProposals,
  addInMemoryProposal,
} from "@/lib/content/proposals";
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
        // Sync database records with in-memory store
        data.forEach((p) => addInMemoryProposal(p));
        return NextResponse.json({ ok: true, proposals: getInMemoryProposals() });
      }
    } catch (err) {
      log("warn", { message: "Supabase proposals list notice", error: err });
    }
  }

  // Fallback to in-memory store
  return NextResponse.json({
    ok: true,
    proposals: getInMemoryProposals(),
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

  // Add to in-memory store
  addInMemoryProposal(newProposal);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .insert(newProposal)
        .select()
        .single();

      if (!error && data) {
        addInMemoryProposal(data);
        return NextResponse.json({ ok: true, proposal: data });
      } else if (error) {
        log("warn", { message: "Supabase insert notice on proposal", error });
      }
    } catch (err) {
      log("warn", { message: "Failed inserting proposal to Supabase", error: err });
    }
  }

  return NextResponse.json({ ok: true, proposal: newProposal });
}

