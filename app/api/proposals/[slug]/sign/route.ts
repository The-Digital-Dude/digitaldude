import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getClientIp } from "@/lib/rateLimit";
import { createAgreementHash } from "@/lib/crm/proposals";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const signSchema = z.object({
  signedByName: z.string().trim().min(2, "Full legal name is required").max(120),
  signedByTitle: z.string().trim().min(2, "Job title is required").max(100),
  signedSignatureData: z.string().min(10, "Valid signature is required"),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of engagement to proceed",
  }),
});

function parseNumericBudget(budgetRange: string): number {
  const matches = budgetRange.replace(/,/g, "").match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  // If a range is provided e.g. "8000 - 14000", take the higher end
  return Number(matches[matches.length - 1]);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });

    const raw = await request.json().catch(() => ({}));
    const parsed = signSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: issue.message }, { status: 400 });
    }

    const { signedByName, signedByTitle, signedSignatureData } = parsed.data;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    const { data: proposal, error: getErr } = await supabase
      .from("proposals")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (getErr || !proposal) {
      return NextResponse.json({ ok: false, error: "Specification not found" }, { status: 404 });
    }

    if (proposal.signed_at) {
      return NextResponse.json(
        { ok: false, error: "This specification has already been executed." },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const signedAt = new Date().toISOString();

    const agreementHash = createAgreementHash({
      slug,
      clientName: signedByName,
      clientEmail: proposal.client_email,
      signedAt,
      signedIp: clientIp || "unknown",
      budgetRange: proposal.budget_range || "",
    });

    // 1. Update proposal to accepted state
    const { error: updatePropErr } = await supabase
      .from("proposals")
      .update({
        status: "accepted",
        signed_at: signedAt,
        signed_by_name: signedByName,
        signed_by_title: signedByTitle,
        signed_signature_data: signedSignatureData,
        signed_ip: clientIp,
        signed_user_agent: userAgent,
        legal_agreement_hash: agreementHash,
      })
      .eq("id", proposal.id);

    if (updatePropErr) {
      log("error", { message: "Failed to update proposal signature", error: updatePropErr });
      return NextResponse.json({ ok: false, error: "Could not execute agreement" }, { status: 500 });
    }

    let createdProjectId: string | null = null;

    // 2. Automated Pipeline & Project Provisioning
    if (proposal.lead_id) {
      const leadId = proposal.lead_id;

      // Update lead stage to Won
      await supabase
        .from("rep_leads")
        .update({
          stage: "won",
          status: "connected",
          probability: 100,
          last_activity_at: signedAt,
        })
        .eq("id", leadId);

      // Log timeline activity
      await supabase.from("rep_lead_activities").insert({
        lead_id: leadId,
        employee_id: proposal.created_by_rep_id || null,
        type: "system",
        outcome: "won",
        summary: `Agreement executed! "${proposal.project_title}" digitally signed by ${signedByName} (${signedByTitle}). Deal Won! 🏆`,
        details: {
          slug,
          signedAt,
          agreementHash,
          budget: proposal.budget_range,
        },
      });

      // Create rep kickoff task
      const tomorrowIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      if (proposal.created_by_rep_id) {
        await supabase.from("rep_lead_tasks").insert({
          lead_id: leadId,
          employee_id: proposal.created_by_rep_id,
          title: `Conduct project kickoff meeting & onboard ${proposal.company_name} to Client Portal`,
          due_at: tomorrowIso,
          kind: "manual",
          auto: true,
        });

        // Rep in-app notification bell
        await supabase.from("acq_notifications").insert({
          recipient_employee_id: proposal.created_by_rep_id,
          kind: "proposal_signed",
          title: "🎉 Deal Closed & Signed!",
          body: `${signedByName} (${proposal.company_name}) has digitally signed "${proposal.project_title}". Deal automatically marked Won!`,
          link: `/rep/dashboard?leadId=${leadId}`,
        });
      }

      // Auto-provision Client Portal Project
      const totalBudget = parseNumericBudget(proposal.budget_range);
      const currency = proposal.country === "Australia" ? "AUD" : proposal.country === "United Kingdom" ? "GBP" : "USD";
      const techStackArr = Array.isArray(proposal.tech_stack) ? proposal.tech_stack : [];

      const { data: project, error: projErr } = await supabase
        .from("client_projects")
        .insert({
          client_name: signedByName,
          client_email: proposal.client_email,
          company_name: proposal.company_name,
          project_title: proposal.project_title,
          description: proposal.scope_summary,
          tech_stack: techStackArr,
          health_status: "on_track",
          progress_percent: 5,
          start_date: new Date().toISOString().slice(0, 10),
          total_budget: totalBudget,
          currency,
        })
        .select("id")
        .single();

      if (!projErr && project) {
        createdProjectId = project.id;
        // Link project back to proposal
        await supabase.from("proposals").update({ project_id: project.id }).eq("id", proposal.id);

        // Auto-provision milestones from deliverable_phases
        const phases = Array.isArray(proposal.deliverable_phases) ? proposal.deliverable_phases : [];
        if (phases.length > 0) {
          const milestonesToInsert = phases.map((phase: any, index: number) => ({
            project_id: project.id,
            title: phase.phase || `Phase ${index + 1}`,
            description: Array.isArray(phase.milestones) ? phase.milestones.join(" • ") : phase.duration || "",
            status: index === 0 ? "in_progress" : "up_next",
            order_index: index,
          }));

          await supabase.from("client_milestones").insert(milestonesToInsert);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      signedCopyUrl: `/proposals/${slug}`,
      agreementHash,
      projectId: createdProjectId,
      signedAt,
    });
  } catch (err) {
    log("error", { message: "Proposal sign execution error", error: err });
    return NextResponse.json({ ok: false, error: "Internal error processing signature" }, { status: 500 });
  }
}
