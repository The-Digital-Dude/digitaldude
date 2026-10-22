import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";
import { verifyEmail } from "@/lib/acquisition/verify/email";
import { loadChecks } from "@/lib/acquisition/verify/bulk";
import { leadPatchSchema, currencyFor } from "@/lib/crm/model";
import { COLLEAGUE_MESSAGE, isWorkedByColleague, ownDuplicate, prepareLeadUpdate } from "@/lib/crm/leads";
import { computeScores, scoresAreFresh, type ScoredLead } from "@/lib/crm/refresh";
import { loadCrmSettings } from "@/lib/crm/settings";
import { needsNextStep, staleness, weightedPipeline } from "@/lib/crm/health";
import { gradeFor, nextMove, priorityScore } from "@/lib/crm/scoring";
import { logActivity, safely } from "@/lib/crm/activity";

export const dynamic = "force-dynamic";

/** The most scores recomputed in one list request, so opening the page stays quick (the rest catch up on the next load or the daily job). */
const MAX_SCORE_REFRESH = 120;

export async function GET(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    let { data: leads, error } = await supabase
      .from("rep_leads")
      .select("*")
      .eq("employee_id", rep.id)
      .is("anonymized_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      // The CRM upgrade migration (0041) may not be applied yet: fall back to the plain query so reps never lose sight of their leads.
      ({ data: leads, error } = await supabase.from("rep_leads").select("*").eq("employee_id", rep.id).order("created_at", { ascending: false }));
    }
    if (error) {
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ ok: true, leads: [] });
    }

    const rows = (leads || []) as (ScoredLead & { acq_contact_id?: string | null; stage: string; estimated_deal_value: number | null; currency: string | null; probability?: number | null })[];
    const now = new Date();
    const settings = await loadCrmSettings(supabase);

    // Pool leads: show whether the contact has been cleared to email yet (a read-only badge; sending is gated separately).
    const contactIds = rows.map((l) => l.acq_contact_id).filter((x): x is string => !!x);
    const status = new Map<string, string>();
    if (contactIds.length) {
      const { data: cs } = await supabase.from("acq_contacts").select("id,status").in("id", contactIds);
      for (const c of (cs ?? []) as { id: string; status: string }[]) status.set(c.id, c.status);
    }
    const checks = await loadChecks(supabase, rows.map((l) => l.email ?? "")).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);

    // Open tasks per lead (count and the soonest due), for the "needs a next step" flag and the list.
    const taskInfo = new Map<string, { open: number; nextDue: string | null; overdue: boolean }>();
    const { data: tasks } = await safely("list tasks", async () => await supabase.from("rep_lead_tasks").select("lead_id,due_at").eq("employee_id", rep.id).eq("status", "open")).then((r) => r ?? { data: [] });
    for (const t of (tasks ?? []) as { lead_id: string; due_at: string }[]) {
      const cur = taskInfo.get(t.lead_id) ?? { open: 0, nextDue: null, overdue: false };
      cur.open++;
      if (!cur.nextDue || t.due_at < cur.nextDue) cur.nextDue = t.due_at;
      cur.overdue = cur.overdue || Date.parse(t.due_at) < now.getTime();
      taskInfo.set(t.lead_id, cur);
    }

    // Scores: recompute the ones that are missing or old, cap the work, use saved values for the rest.
    const needScores = rows.filter((l) => !scoresAreFresh(l, now)).slice(0, MAX_SCORE_REFRESH);
    const fresh = needScores.length ? ((await safely("score leads", () => computeScores(supabase, needScores, now))) ?? new Map()) : new Map();

    const out = rows.map((l) => {
      const s = fresh.get(l.id);
      const fit = s?.fit ?? l.fit_score ?? null;
      const engagement = s?.engagement ?? l.engagement_score ?? null;
      const fitGrade = fit === null ? null : gradeFor(fit);
      const label = engagement === null ? null : engagement >= 60 ? "hot" : engagement >= 30 ? "warm" : "cold";
      const t = taskInfo.get(l.id) ?? { open: 0, nextDue: null, overdue: false };
      const stale = staleness(l as never, now, settings);
      return {
        ...l,
        fit_score: fit,
        engagement_score: engagement,
        fit_grade: fitGrade,
        engagement_label: label,
        priority: fit !== null && engagement !== null ? priorityScore(fit, engagement) : null,
        next_move: fitGrade && label ? nextMove(fitGrade, label) : null,
        open_tasks: t.open,
        next_task_due: t.nextDue,
        task_overdue: t.overdue,
        stale: stale.stale,
        days_quiet: stale.days,
        stale_after: stale.threshold,
        needs_next_step: needsNextStep(l as never, t.open),
        pool_contact_status: l.acq_contact_id ? (status.get(l.acq_contact_id) ?? null) : null,
        email_check: checks[String(l.email ?? "").trim().toLowerCase()] ?? null,
      };
    });

    const forecast = weightedPipeline(rows, settings.probabilities);
    return NextResponse.json({ ok: true, leads: out, forecast, settings: { staleDays: settings.staleDays, probabilities: settings.probabilities } });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    if (!String(body.full_name ?? "").trim() || !String(body.email ?? "").trim()) {
      return NextResponse.json({ ok: false, error: "Lead name and email are strictly required." }, { status: 400 });
    }

    const parsed = leadPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ? `${parsed.error.issues[0].path.join(".") || "lead"}: ${parsed.error.issues[0].message}` : "Invalid lead details" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const cleanEmail = String(body.email).trim().toLowerCase();

    // The same person twice in your own leads is never intended; and a contact a colleague is already working is not added again.
    const mine = await ownDuplicate(supabase, cleanEmail, rep.id);
    if (mine) return NextResponse.json({ ok: false, error: `${mine.full_name || cleanEmail} is already in your leads.`, duplicateOf: mine.id }, { status: 409 });
    if (await isWorkedByColleague(supabase, cleanEmail, rep.id)) return NextResponse.json({ ok: false, error: COLLEAGUE_MESSAGE, colleague: true }, { status: 409 });

    // Is the address real? Invalid ones (no such domain, disposable, no-reply, bad format) are refused with the reason; risky ones are
    // saved with a warning (and the composer asks before sending to them).
    const emailCheck = await verifyEmail(supabase, cleanEmail);
    if (emailCheck.status === "invalid") {
      return NextResponse.json({ ok: false, error: `That email address cannot be added: ${emailCheck.reason}`, emailCheck: { status: emailCheck.status, reason: emailCheck.reason } }, { status: 422 });
    }

    const prepared = prepareLeadUpdate({ stage: "new", status: "new", email: "", currency: rep.currency }, parsed.data);
    if (prepared.error) return NextResponse.json({ ok: false, error: prepared.error }, { status: 422 });

    const now = new Date().toISOString();
    const leadPayload = {
      lead_source: "Cold Outreach",
      stage: "new",
      estimated_deal_value: 0,
      ...prepared.update,
      employee_id: rep.id,
      email: cleanEmail,
      currency: (prepared.update.currency as string | undefined) ?? (parsed.data.country ? currencyFor(parsed.data.country) : rep.currency || "BDT"),
      created_at: now,
      updated_at: now,
    };

    const { data: newLead, error } = await supabase
      .from("rep_leads")
      .insert([leadPayload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await safely("log creation", () => logActivity(supabase, { leadId: newLead.id, employeeId: rep.id, type: "created", summary: `Added by ${rep.full_name || "the rep"} (${leadPayload.lead_source})` }));
    await safely("score new lead", () => computeScores(supabase, [newLead], new Date()));

    // Record audit log
    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "lead_created",
      description: `Added new lead "${newLead.full_name}" (${newLead.company_name || "No company"}) in stage "${newLead.stage}".`,
      targetIdentifier: newLead.email,
      metadata: {
        leadId: newLead?.id,
        stage: newLead.stage,
        estimatedValue: newLead.estimated_deal_value,
      },
    });

    return NextResponse.json({ ok: true, lead: { ...newLead, email_check: { status: emailCheck.status, reason: emailCheck.reason, source: emailCheck.source } }, emailCheck: { status: emailCheck.status, reason: emailCheck.reason } });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create lead" }, { status: 500 });
  }
}
