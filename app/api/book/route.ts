import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendNotification } from "@/lib/sendNotification";
import { createGoogleCalendarMeeting, getBusyIntervals } from "@/lib/googleCalendar";
import { SLOT_MINUTES, generateSlotsForDate, isDateWithinBookingWindow } from "@/lib/availability";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

import { generateProposalFromBooking } from "@/lib/content/proposals";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Rate limit: 10 booking attempts per IP per hour.
  const ip = getClientIp(request);
  const rl = rateLimit(`book:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await request.json();
  const { name, workEmail, companyName, country, teamSize, message, slotStart, company, systemType } = body ?? {};

  // Hidden honeypot field: real visitors never fill this in.
  if (typeof company === "string" && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !workEmail || !companyName || !country || !slotStart) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(String(workEmail).trim())) {
    return NextResponse.json({ ok: false, error: "Please enter a valid work email address." }, { status: 400 });
  }

  const start = new Date(slotStart);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "That time isn't available anymore. Please pick another." },
      { status: 400 }
    );
  }

  // Validate that the submitted slot is one of the real generated slots for
  // that day — prevents arbitrary timestamps from being inserted.
  const dateStr = start.toISOString().slice(0, 10);
  if (!isDateWithinBookingWindow(dateStr)) {
    return NextResponse.json(
      { ok: false, error: "That date is outside the booking window." },
      { status: 400 }
    );
  }
  const validSlots = new Set(generateSlotsForDate(dateStr));
  if (!validSlots.has(start.toISOString())) {
    return NextResponse.json(
      { ok: false, error: "That is not a valid booking slot." },
      { status: 400 }
    );
  }

  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);

  // Re-check the real calendar right before booking — closes the race window
  // between a visitor loading availability and submitting, e.g. someone else
  // adding a manual calendar event in between.
  const busy = await getBusyIntervals(start.toISOString(), end.toISOString());
  if (busy && busy.length > 0) {
    return NextResponse.json(
      { ok: false, error: "That slot was just taken. Please pick another time." },
      { status: 409 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Booking isn't connected to a database yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("bookings").insert({
    name,
    work_email: workEmail,
    company_name: companyName,
    country,
    team_size: teamSize || null,
    message: message || null,
    slot_start: start.toISOString(),
    slot_end: end.toISOString(),
  });

  if (error) {
    // Unique constraint violation on slot_start: someone else just took it.
    if (error.code === "23505") {
      log("warn", { message: "Booking conflict: slot already taken", context: { ip, slotStart: start.toISOString() } });
      return NextResponse.json(
        { ok: false, error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    log("error", { message: "Supabase insert error on booking", error, context: { ip, workEmail } });
    return NextResponse.json({ ok: false, error: "Could not save your booking." }, { status: 500 });
  }

  log("info", { message: "Booking saved successfully", context: { companyName, slotStart: start.toISOString() } });

  // Create Google Calendar event with dynamic Google Meet video link
  const calendarMeeting = await createGoogleCalendarMeeting({
    name,
    workEmail,
    companyName,
    slotStart: start.toISOString(),
    slotEnd: end.toISOString(),
    message,
  });

  if (calendarMeeting?.meetUrl) {
    try {
      await supabase
        .from("bookings")
        .update({ meet_url: calendarMeeting.meetUrl })
        .eq("work_email", workEmail)
        .eq("slot_start", start.toISOString());
    } catch (e) {
      log("warn", { message: "Could not persist meet_url to booking record", error: e });
    }
  }

  // Auto-generate Architecture Spec & Project Proposal
  const autoProposal = generateProposalFromBooking({
    name,
    email: workEmail,
    company: companyName,
    country,
    systemType,
    teamSize,
    message,
  });

  let persistedProposalSlug: string | null = null;
  try {
    const { error: pErr } = await supabase.from("proposals").insert({
      slug: autoProposal.slug,
      client_name: autoProposal.client_name,
      client_email: autoProposal.client_email,
      company_name: autoProposal.company_name,
      country: autoProposal.country,
      project_title: autoProposal.project_title,
      system_type: autoProposal.system_type,
      scope_summary: autoProposal.scope_summary,
      problem_statement: autoProposal.problem_statement,
      target_timeline: autoProposal.target_timeline,
      budget_range: autoProposal.budget_range,
      tech_stack: autoProposal.tech_stack,
      architecture_modules: autoProposal.architecture_modules,
      deliverable_phases: autoProposal.deliverable_phases,
      status: "sent",
      valid_until: autoProposal.valid_until,
    });

    if (!pErr) {
      persistedProposalSlug = autoProposal.slug;
      const { addInMemoryProposal } = await import("@/lib/content/proposals");
      addInMemoryProposal({
        ...autoProposal,
        status: "sent",
      });
    } else {
      log("warn", { message: "Could not persist auto proposal record", error: pErr });
    }
  } catch (pErr) {
    log("warn", { message: "Could not persist auto proposal record", error: pErr });
  }

  await sendNotification({
    name,
    workEmail,
    companyName,
    country,
    teamSize,
    message: message || `(No message provided — booked a call for ${start.toISOString()})`,
    slotStart: start.toISOString(),
    slotEnd: end.toISOString(),
    meetUrl: calendarMeeting?.meetUrl,
  });

  return NextResponse.json({
    ok: true,
    firstName: String(name).split(" ")[0],
    slotStart: start.toISOString(),
    meetUrl: calendarMeeting?.meetUrl || null,
    proposalSlug: persistedProposalSlug,
  });
}
