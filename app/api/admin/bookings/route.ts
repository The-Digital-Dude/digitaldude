import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { DEMO_LEADS, BookingLead } from "@/lib/crm";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const stage = searchParams.get("stage") || "all";

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

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,work_email.ilike.%${search}%,company_name.ilike.%${search}%,country.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const formatted: BookingLead[] = data.map((b) => ({
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
          stage: b.stage || "new_booking",
          deal_value: Number(b.deal_value) || 8500,
          lead_score: b.lead_score || "warm",
          lead_notes: b.lead_notes || "",
          assigned_to: b.assigned_to || "The Digital Dude Team",
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || b.created_at || new Date().toISOString(),
        }));

        return NextResponse.json({ ok: true, bookings: formatted });
      }
    } catch (error) {
      log("warn", { message: "Supabase bookings fetch fallback notice", error });
    }
  }

  // Fallback demo leads
  const filteredDemos = DEMO_LEADS.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.work_email.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stage === "all" || l.stage === stage;
    return matchesSearch && matchesStage;
  });

  return NextResponse.json({ ok: true, bookings: filteredDemos });
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
      send_welcome_email = false,
    } = body;

    if (!name || !work_email || !company_name) {
      return NextResponse.json(
        { ok: false, error: "Name, Work Email, and Company Name are required." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const bookingStart = slot_start ? new Date(slot_start).toISOString() : nowIso;
    const bookingEnd = slot_end
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
      created_at: nowIso,
      updated_at: nowIso,
    };

    const supabase = getSupabaseServerClient();
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
        })
        .select()
        .single();

      if (!error && data) {
        log("info", { message: "Custom lead created in Supabase", context: { id: data.id, name: data.name } });
      } else if (error) {
        log("warn", { message: "Supabase custom lead insert warning, continuing with in-memory lead", error });
      }
    }

    // Optional Brevo welcome / discovery dispatch
    if (send_welcome_email) {
      try {
        const { sendBrevoEmail, EMAIL_TEMPLATES } = await import("@/lib/emailBrevo");
        const tpl = EMAIL_TEMPLATES.find((t) => t.id === "discovery_followup") || EMAIL_TEMPLATES[0];
        
        const html = tpl.buildHtml({
          clientName: newLead.name,
          companyName: newLead.company_name,
          customNotes: newLead.lead_notes || newLead.message || undefined,
        });

        await sendBrevoEmail({
          to: [{ email: newLead.work_email, name: newLead.name }],
          subject: tpl.defaultSubject
            .replace("{{company_name}}", newLead.company_name)
            .replace("{{first_name}}", newLead.name.split(" ")[0]),
          htmlContent: html,
        });
      } catch (emailErr) {
        log("warn", { message: "Brevo welcome email error during lead creation", error: emailErr });
      }
    }

    return NextResponse.json({ ok: true, booking: newLead });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create custom lead";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

