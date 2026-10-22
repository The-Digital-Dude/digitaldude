import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";
import { loadChecks } from "@/lib/acquisition/verify/bulk";

export const dynamic = "force-dynamic";

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

    const { data: leads, error } = await supabase
      .from("rep_leads")
      .select("*")
      .eq("employee_id", rep.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ ok: true, leads: [] });
    }

    // Pool leads: show whether the contact has been cleared to email yet (a read-only badge; sending is gated separately).
    const rows = (leads || []) as { acq_contact_id?: string | null }[];
    const contactIds = rows.map((l) => l.acq_contact_id).filter((x): x is string => !!x);
    const status = new Map<string, string>();
    if (contactIds.length) {
      const { data: cs } = await supabase.from("acq_contacts").select("id,status").in("id", contactIds);
      for (const c of (cs ?? []) as { id: string; status: string }[]) status.set(c.id, c.status);
    }
    const checks = await loadChecks(supabase, (leads || []).map((l: { email?: string }) => l.email ?? "")).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);
    const out = rows.map((l) => ({ ...l, pool_contact_status: l.acq_contact_id ? (status.get(l.acq_contact_id) ?? null) : null, email_check: checks[String((l as { email?: string }).email ?? "").trim().toLowerCase()] ?? null }));
    return NextResponse.json({ ok: true, leads: out });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      company_name,
      job_title,
      lead_source = "Cold Outreach",
      stage = "new",
      estimated_deal_value = 0,
      notes,
    } = body;

    if (!full_name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Lead name and email are strictly required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const leadPayload = {
      employee_id: rep.id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      company_name: company_name?.trim() || null,
      job_title: job_title?.trim() || null,
      lead_source,
      stage,
      estimated_deal_value: Number(estimated_deal_value) || 0,
      currency: rep.currency || "BDT",
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newLead, error } = await supabase
      .from("rep_leads")
      .insert([leadPayload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Record audit log
    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "lead_created",
      description: `Added new lead "${leadPayload.full_name}" (${leadPayload.company_name || "No company"}) in stage "${stage}".`,
      targetIdentifier: leadPayload.email,
      metadata: {
        leadId: newLead?.id,
        stage,
        estimatedValue: leadPayload.estimated_deal_value,
      },
    });

    return NextResponse.json({ ok: true, lead: newLead });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to create lead" }, { status: 500 });
  }
}
