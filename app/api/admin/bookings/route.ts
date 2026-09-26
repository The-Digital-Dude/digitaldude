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
          status: b.status || "confirmed",
          stage: b.stage || "new_booking",
          deal_value: Number(b.deal_value) || 8500,
          lead_score: b.lead_score || "warm",
          lead_notes: b.lead_notes || "",
          admin_notes: b.admin_notes || b.lead_notes || "",
          assigned_to: b.assigned_to || "The Digital Dude Team",
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || b.created_at || new Date().toISOString(),
        }));

        formatted.forEach((lead) => addInMemoryLead(lead));
      }
    } catch (error) {
      log("warn", { message: "Supabase bookings fetch fallback notice", error });
    }
  }

  // Fallback in-memory leads
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
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store in-memory immediately so it shows up everywhere in this process
    addInMemoryLead(newLead);

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        // First try full insert with all CRM columns
        let { data, error } = await supabase
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

        // If insert failed (e.g. missing columns before migration or slot collision), retry with base schema
        if (error) {
          log("warn", { message: "Supabase full lead insert failed, attempting base column fallback", error });
          
          // If unique slot_start collision, adjust slot_start slightly
          if (error.message?.includes("slot_start") || error.code === "23505") {
            const adjustedStart = new Date(Date.now() + Math.floor(Math.random() * 60000)).toISOString();
            newLead.slot_start = adjustedStart;
            newLead.slot_end = new Date(new Date(adjustedStart).getTime() + 30 * 60000).toISOString();
          }

          const baseRes = await supabase
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
            })
            .select()
            .single();

          data = baseRes.data;
          error = baseRes.error;
        }

        if (!error && data) {
          addInMemoryLead({
            ...newLead,
            id: data.id,
          });
          log("info", { message: "Custom lead created in Supabase", context: { id: data.id, name: data.name } });
        } else if (error) {
          log("error", { message: "Failed to persist custom lead in Supabase", error });
          if (process.env.NODE_ENV === "production") {
            return NextResponse.json(
              { ok: false, error: "Database error: could not create booking record." },
              { status: 500 }
            );
          }
        }
      } catch (dbErr) {
        log("error", { message: "Supabase custom lead insert exception", error: dbErr });
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { ok: false, error: "Database exception while creating booking." },
            { status: 500 }
          );
        }
      }
    }

    // Optional Brevo welcome / discovery dispatch with custom subject/content
    if (send_welcome_email) {
      try {
        const { sendBrevoEmail, EMAIL_TEMPLATES, wrapInEmailTemplate } = await import("@/lib/emailBrevo");
        const tpl = EMAIL_TEMPLATES.find((t) => t.id === email_template_id) || EMAIL_TEMPLATES[0];
        
        const firstName = newLead.name.split(" ")[0] || "there";
        const subject =
          custom_email_subject.trim() ||
          tpl.defaultSubject
            .replace(/\{\{company_name\}\}/g, newLead.company_name)
            .replace(/\{\{first_name\}\}/g, firstName);

        let html = "";
        if (custom_email_body && custom_email_body.trim().length > 0) {
          const formattedBody = formatEmailBodyToHtml(
            custom_email_body
              .replace(/\{\{company_name\}\}/g, newLead.company_name)
              .replace(/\{\{first_name\}\}/g, firstName)
          );
          html = wrapInEmailTemplate(subject, formattedBody);
        } else {
          html = tpl.buildHtml({
            clientName: newLead.name,
            companyName: newLead.company_name,
            customNotes: newLead.lead_notes || newLead.message || undefined,
          });
        }

        await sendBrevoEmail({
          to: [{ email: newLead.work_email, name: newLead.name }],
          subject,
          htmlContent: html,
        });
        log("info", { message: "Custom lead welcome email dispatched", context: { email: newLead.work_email, subject } });
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


