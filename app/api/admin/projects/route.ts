import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { sendClientInviteEmail } from "@/lib/clientEmails";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data: projects, error } = await supabase
      .from("client_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: true, projects: [] });
    }

    return NextResponse.json({ ok: true, projects: projects || [] });
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
      client_name,
      client_email,
      company_name,
      project_title,
      description,
      tech_stack = [],
      health_status = "on_track",
      progress_percent = 0,
      start_date,
      target_delivery_date,
      total_budget = 0,
      currency = "USD",
      staging_url,
      figma_url,
      docs_url,
      github_url,
      send_invite_email = true,
    } = body;

    if (!client_name?.trim() || !client_email?.trim() || !project_title?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Client Name, Client Email, and Project Title are required." },
        { status: 400 }
      );
    }

    const cleanEmail = client_email.trim().toLowerCase();

    const { data: newProject, error } = await supabase
      .from("client_projects")
      .insert([
        {
          client_name: client_name.trim(),
          client_email: cleanEmail,
          company_name: company_name?.trim() || null,
          project_title: project_title.trim(),
          description: description?.trim() || null,
          tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
          health_status,
          progress_percent: Number(progress_percent) || 0,
          start_date: start_date || null,
          target_delivery_date: target_delivery_date || null,
          total_budget: Number(total_budget) || 0,
          currency,
          staging_url: staging_url?.trim() || null,
          figma_url: figma_url?.trim() || null,
          docs_url: docs_url?.trim() || null,
          github_url: github_url?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Create default initial milestones
    const defaultMilestones = [
      { project_id: newProject.id, title: "Discovery & Technical Architecture", description: "Database schema design, system architecture, and tech stack setup.", status: "completed", order_index: 0 },
      { project_id: newProject.id, title: "UI/UX Design & Interactive Prototypes", description: "Figma wireframes, design system tokens, and stakeholder approvals.", status: "in_progress", order_index: 1 },
      { project_id: newProject.id, title: "Core Engineering & Database Integration", description: "Backend APIs, auth layers, business logic, and UI integration.", status: "up_next", order_index: 2 },
      { project_id: newProject.id, title: "QA Testing & Staging Environment", description: "Edge case testing, security audits, and client staging sign-off.", status: "up_next", order_index: 3 },
      { project_id: newProject.id, title: "Production Deployment & Handover", description: "Custom domain configuration, telemetry, documentation, and live rollout.", status: "up_next", order_index: 4 },
    ];

    await supabase.from("client_milestones").insert(defaultMilestones);

    // Send invitation email
    if (send_invite_email) {
      try {
        await sendClientInviteEmail({
          email: cleanEmail,
          clientName: client_name.trim(),
          projectTitle: project_title.trim(),
          companyName: company_name?.trim() || undefined,
        });
      } catch (mailErr) {
        log("warn", { message: "Could not send client invite email", error: mailErr });
      }
    }

    return NextResponse.json({ ok: true, project: newProject });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
