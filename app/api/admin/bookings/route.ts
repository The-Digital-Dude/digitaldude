import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import {
  BookingLead,
  getInMemoryLeads,
  addInMemoryLead,
} from "@/lib/crm";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const stage = searchParams.get("stage") || "all";
  const status = searchParams.get("status") || "all";
  const employeeId = searchParams.get("employee_id") || "";

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("slot_start", { ascending: false });

      if (stage !== "all") {
        query = query.eq("stage", stage);
      }

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (employeeId) {
        query = query.or(`sourced_by_employee_id.eq.${employeeId},employee_id.eq.${employeeId}`);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,work_email.ilike.%${search}%,company_name.ilike.%${search}%,country.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        log("error", { message: "Supabase bookings fetch error", error });
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      // Safe lookup for employee profiles without requiring PostgREST schema cache relationship
      let employeeMap: Record<string, { id: string; full_name: string; email: string; referral_code?: string }> = {};
      let refCodeMap: Record<string, { id: string; full_name: string; email: string; referral_code?: string }> = {};
      try {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, full_name, email, referral_code");
        if (emps) {
          emps.forEach((emp) => {
            employeeMap[emp.id] = emp;
            if (emp.referral_code) {
              refCodeMap[emp.referral_code.trim().toLowerCase()] = emp;
            }
          });
        }
      } catch {
        // ignore employee lookup failure
      }

      const formatted = (data || []).map((b) => {
        let repId = b.sourced_by_employee_id || b.employee_id || null;
        let rep = repId ? employeeMap[repId] || null : null;
        
        // Fallback: If repId was missing but referral_source was captured
        if (!rep && b.referral_source) {
          const cleanRef = String(b.referral_source).trim().toLowerCase();
          const matchedByRef = refCodeMap[cleanRef] || employeeMap[cleanRef];
          if (matchedByRef) {
            rep = matchedByRef;
            repId = matchedByRef.id;
          }
        }

        return {
          id: b.id,
          name: b.name,
          work_email: b.work_email,
          company_name: b.company_name,
          country: b.country,
          team_size: b.team_size,
          message: b.message,
          slot_start: b.slot_start,
          slot_end: b.slot_end,
          meet_url: b.meet_url,
          status: b.status || "confirmed",
          stage: b.stage || "new_booking",
          deal_value: Number(b.deal_value) || 8500,
          lead_score: b.lead_score || "warm",
          lead_notes: b.lead_notes || "",
          admin_notes: b.admin_notes || b.lead_notes || "",
          assigned_to: b.assigned_to || "The Digital Dude Team",
          sourced_by_employee_id: repId,
          sourced_by_employee: rep,
          meeting_bonus_payout_status: b.meeting_bonus_payout_status || "pending",
          deal_commission_payout_status: b.deal_commission_payout_status || "pending",
          payout_notes: b.payout_notes || "",
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || b.created_at || new Date().toISOString(),
        };
      });

      return NextResponse.json({ ok: true, bookings: formatted });
    } catch (error) {
      log("error", { message: "Supabase bookings fetch exception", error });
      return NextResponse.json({ ok: false, error: "Failed to retrieve bookings from database." }, { status: 500 });
    }
  }

  // In-memory fallback is for local/demo use only.
  if (process.env.NODE_ENV === "production") {
    log("error", { message: "Supabase not configured in production for /api/admin/bookings" });
    return NextResponse.json(
      { ok: false, error: "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const inMemory = getInMemoryLeads();
  const filtered = inMemory.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.work_email.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stage === "all" || (l.stage || "new_booking") === stage;
    const matchesStatus = status === "all" || (l.status || "confirmed") === status;
    return matchesSearch && matchesStage && matchesStatus;
  });

  return NextResponse.json({ ok: true, bookings: filtered });
}

function formatEmailBodyToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (
        lines.length > 0 &&
        lines.every((l) => l.startsWith("- ") || l.startsWith("* ") || l.startsWith("• "))
      ) {
        const items = lines
          .map(
            (l) =>
              `<li style="margin-bottom: 6px; color: #4a4a75;">${l.replace(/^[-*•]\s*/, "")}</li>`
          )
          .join("");
        return `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">${items}</ul>`;
      }
      return `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">${block.replace(
        /\n/g,
        "<br>"
      )}</p>`;
    })
    .join("");
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      work_email,
      company_name,
      country = "United Kingdom",
      team_size = "1-10",
      message = "",
      slot_start,
      slot_end,
      meet_url = "",
      stage = "new_booking",
      deal_value = 8500,
      lead_score = "warm",
      lead_notes = "",
      assigned_to = "The Digital Dude Team",
      sourced_by_employee_id = null,
      send_welcome_email = false,
      custom_email_subject = "",
      custom_email_body = "",
      email_template_id = "discovery_followup",
    } = body;

    if (!name || !work_email || !company_name) {
      return NextResponse.json(
        { ok: false, error: "Name, Work Email, and Company Name are required." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    let bookingStart = slot_start ? new Date(slot_start).toISOString() : nowIso;
    let bookingEnd = slot_end
      ? new Date(slot_end).toISOString()
      : new Date(new Date(bookingStart).getTime() + 30 * 60000).toISOString();

    const newLead: BookingLead = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      work_email: String(work_email).trim().toLowerCase(),
      company_name: String(company_name).trim(),
      country: String(country).trim(),
      team_size: String(team_size).trim(),
      message: String(message || "").trim(),
      slot_start: bookingStart,
      slot_end: bookingEnd,
      meet_url: meet_url ? String(meet_url).trim() : undefined,
      stage: stage || "new_booking",
      deal_value: Number(deal_value) || 8500,
      lead_score: lead_score || "warm",
      lead_notes: String(lead_notes || "").trim(),
      assigned_to: String(assigned_to || "The Digital Dude Team").trim(),
      sourced_by_employee_id: sourced_by_employee_id || null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const supabase = getSupabaseServerClient();
    let createdLeadRecord: BookingLead = newLead;

    if (supabase) {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          id: newLead.id,
          name: newLead.name,
          work_email: newLead.work_email,
          company_name: newLead.company_name,
          country: newLead.country,
          team_size: newLead.team_size,
          message: newLead.message,
          slot_start: newLead.slot_start,
          slot_end: newLead.slot_end,
          meet_url: newLead.meet_url,
          stage: newLead.stage,
          deal_value: newLead.deal_value,
          lead_score: newLead.lead_score,
          lead_notes: newLead.lead_notes,
          assigned_to: newLead.assigned_to,
          sourced_by_employee_id: newLead.sourced_by_employee_id,
        })
        .select("*")
        .single();

      if (error) {
        log("error", { message: "Failed to persist custom lead in Supabase", error });
        if (error.code === "23505" || error.message?.includes("slot_start") || error.message?.includes("unique")) {
          return NextResponse.json(
            { ok: false, error: "The selected appointment slot is already booked. Please choose a different time." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { ok: false, error: error.message || "Database error: could not create booking record." },
          { status: 500 }
        );
      }

      if (data) {
        createdLeadRecord = {
          ...newLead,
          id: data.id,
        };
        addInMemoryLead(createdLeadRecord);
        log("info", { message: "Custom lead created in Supabase", context: { id: data.id, name: data.name } });
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        log("error", { message: "Supabase not configured in production for POST /api/admin/bookings" });
        return NextResponse.json(
          { ok: false, error: "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
          { status: 503 }
        );
      }
      addInMemoryLead(newLead);
    }

    if (send_welcome_email) {
      try {
        const { sendBrevoEmail, EMAIL_TEMPLATES, wrapInEmailTemplate } = await import("@/lib/emailBrevo");
        const tpl = EMAIL_TEMPLATES.find((t) => t.id === email_template_id) || EMAIL_TEMPLATES[0];
        
        const firstName = createdLeadRecord.name.split(" ")[0] || "there";
        const subject =
          custom_email_subject.trim() ||
          tpl.defaultSubject
            .replace(/\{\{company_name\}\}/g, createdLeadRecord.company_name)
            .replace(/\{\{first_name\}\}/g, firstName);

        let html = "";
        if (custom_email_body && custom_email_body.trim().length > 0) {
          const formattedBody = formatEmailBodyToHtml(
            custom_email_body
              .replace(/\{\{company_name\}\}/g, createdLeadRecord.company_name)
              .replace(/\{\{first_name\}\}/g, firstName)
          );
          html = wrapInEmailTemplate(subject, formattedBody);
        } else {
          html = tpl.buildHtml({
            clientName: createdLeadRecord.name,
            companyName: createdLeadRecord.company_name,
            customNotes: createdLeadRecord.lead_notes || createdLeadRecord.message || undefined,
          });
        }

        await sendBrevoEmail({
          to: [{ email: createdLeadRecord.work_email, name: createdLeadRecord.name }],
          subject,
          htmlContent: html,
        });
        log("info", { message: "Custom lead welcome email dispatched", context: { email: createdLeadRecord.work_email, subject } });
      } catch (emailErr) {
        log("warn", { message: "Brevo welcome email error during lead creation", error: emailErr });
      }
    }

    return NextResponse.json({ ok: true, booking: createdLeadRecord });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create custom lead";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
