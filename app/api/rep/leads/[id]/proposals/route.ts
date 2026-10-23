import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import {
  PROPOSAL_BLUEPRINTS,
  generateProposalSlug,
  tailorProposalWithAi,
} from "@/lib/crm/proposals";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createProposalSchema = z.object({
  blueprintId: z.string().optional(),
  projectTitle: z.string().min(1).max(200),
  systemType: z.string().min(1).max(120),
  scopeSummary: z.string().min(10).max(5000),
  problemStatement: z.string().max(5000).optional(),
  targetTimeline: z.string().min(1).max(80),
  budgetRange: z.string().min(1).max(80),
  techStack: z.array(z.string()).min(1),
  architectureModules: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string(),
      deliverables: z.array(z.string()),
      phase: z.string(),
    })
  ),
  deliverablePhases: z.array(
    z.object({
      phase: z.string(),
      duration: z.string(),
      milestones: z.array(z.string()),
    })
  ),
  status: z.enum(["draft", "sent"]).default("sent"),
  tailorWithAi: z.boolean().optional(),
});

/** List all proposals attached to this lead. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id: leadId } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    const { data: proposals, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      log("warn", { message: "Failed to list lead proposals", error });
      return NextResponse.json({ ok: false, error: "Could not fetch proposals" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, proposals: proposals ?? [] });
  } catch (err) {
    log("error", { message: "Lead proposals GET error", error: err });
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

/** Create and attach a new proposal to this lead. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id: leadId } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    // Verify lead ownership
    const { data: lead } = await supabase
      .from("rep_leads")
      .select("*")
      .eq("id", leadId)
      .eq("employee_id", rep.id)
      .maybeSingle();

    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    const raw = await request.json().catch(() => ({}));

    // If client requested AI synthesis before saving
    if (raw.synthesizeOnly) {
      const blueprint = PROPOSAL_BLUEPRINTS.find((b) => b.id === raw.blueprintId) || PROPOSAL_BLUEPRINTS[0];
      const tailored = await tailorProposalWithAi({
        blueprint,
        lead: {
          fullName: lead.full_name,
          companyName: lead.company_name,
          jobTitle: lead.job_title,
          notes: lead.notes,
          estimatedDealValue: lead.estimated_deal_value,
          currency: lead.currency,
          country: lead.country,
        },
      });
      return NextResponse.json({ ok: true, tailored });
    }

    const parsed = createProposalSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid proposal data" },
        { status: 400 }
      );
    }

    const p = parsed.data;
    const company = lead.company_name || lead.full_name;
    const slug = generateProposalSlug(company);

    // Calculate current version
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId);
    const version = (count ?? 0) + 1;

    // Deactivate previous proposals for this lead if newly active
    await supabase.from("proposals").update({ is_active: false }).eq("lead_id", leadId);

    const newProposal = {
      slug,
      lead_id: leadId,
      created_by_rep_id: rep.id,
      is_active: true,
      version,
      client_name: lead.full_name,
      client_email: lead.email,
      company_name: company,
      country: lead.country || "United Kingdom",
      project_title: p.projectTitle,
      system_type: p.systemType,
      scope_summary: p.scopeSummary,
      problem_statement: p.problemStatement || null,
      target_timeline: p.targetTimeline,
      budget_range: p.budgetRange,
      tech_stack: p.techStack,
      architecture_modules: p.architectureModules,
      deliverable_phases: p.deliverablePhases,
      status: p.status,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("proposals")
      .insert(newProposal)
      .select("*")
      .single();

    if (insertErr || !inserted) {
      log("error", { message: "Failed to insert lead proposal", error: insertErr });
      return NextResponse.json({ ok: false, error: "Failed to create proposal" }, { status: 500 });
    }

    // Log timeline activity on lead
    await supabase.from("rep_lead_activities").insert({
      lead_id: leadId,
      employee_id: rep.id,
      type: "system",
      outcome: p.status === "sent" ? "proposal_sent" : "proposal_drafted",
      summary: `Created ${p.status === "sent" ? "and published" : "draft"} specification: "${p.projectTitle}" (${slug})`,
      details: { slug, version, budget: p.budgetRange },
    });

    // Touch lead activity timestamp
    await supabase
      .from("rep_leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", leadId);

    return NextResponse.json({ ok: true, proposal: inserted });
  } catch (err) {
    log("error", { message: "Lead proposals POST error", error: err });
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
