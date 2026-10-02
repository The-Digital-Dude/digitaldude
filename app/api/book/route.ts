import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendNotification } from "@/lib/sendNotification";
import { createGoogleCalendarMeeting, getBusyIntervals } from "@/lib/googleCalendar";
import { SLOT_MINUTES, generateSlotsForDate, isDateWithinBookingWindow } from "@/lib/availability";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

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

  const cookieHeader = request.headers.get("cookie") || "";
  let refCode = body?.ref ? String(body.ref).trim().toLowerCase() : "";
  if (!refCode && cookieHeader) {
    const match = cookieHeader.match(/tdd_rep_ref=([^;]+)/);
    if (match) {
      try {
        refCode = decodeURIComponent(match[1]).trim().toLowerCase();
      } catch {}
    }
  }

  let sourcedByEmployeeId: string | null = null;
  let matchedEmployeeName: string | null = null;
  if (refCode && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refCode);
      let empQuery = supabase.from("employees").select("id, full_name, email, referral_code");
      if (isUuid) {
        empQuery = empQuery.or(`id.eq.${refCode},referral_code.ilike.${refCode}`);
      } else {
        empQuery = empQuery.ilike("referral_code", refCode);
      }
      const { data: matchedEmp, error: empErr } = await empQuery.maybeSingle();
      if (!empErr && matchedEmp) {
        sourcedByEmployeeId = matchedEmp.id;
        matchedEmployeeName = matchedEmp.full_name;
        log("info", { message: "Attributed booking to rep", context: { refCode, employeeId: matchedEmp.id, name: matchedEmp.full_name } });
      }
    } catch (empCatchErr) {
      log("warn", { message: "Error matching rep referral code", error: empCatchErr });
    }
  }

  const bookingId = crypto.randomUUID();
  const insertPayload: Record<string, unknown> = {
    id: bookingId,
    name,
    work_email: workEmail,
    company_name: companyName,
    country,
    team_size: teamSize || null,
    message: message || null,
    slot_start: start.toISOString(),
    slot_end: end.toISOString(),
    sourced_by_employee_id: sourcedByEmployeeId,
    employee_id: sourcedByEmployeeId,
    referral_source: refCode || null,
  };

  const { error } = await supabase.from("bookings").insert(insertPayload);

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

  // Log Rep activity for sourced discovery call
  if (sourcedByEmployeeId) {
    try {
      const { recordRepAuditLog } = await import("@/lib/repAudit");
      await recordRepAuditLog({
        employeeId: sourcedByEmployeeId,
        actionType: "lead_created",
        description: `Prospect "${name} (${companyName})" booked discovery call via your referral link.`,
        targetIdentifier: workEmail,
        metadata: {
          bookingId,
          companyName,
          country,
          slotStart: start.toISOString(),
          referralCode: refCode,
        },
        ipAddress: ip,
      });
    } catch (auditErr) {
      log("warn", { message: "Could not record rep referral booking audit log", error: auditErr });
    }
  }

  // Dispatch Meta Conversions API (CAPI) Schedule / Lead Event
  try {
    const { sendMetaCapiEvent } = await import("@/lib/metaCapi");
    const userAgent = (body?.userAgent ? String(body.userAgent) : request.headers.get("user-agent")) || undefined;
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);
    const clientEventId = body?.eventId ? String(body.eventId).trim() : undefined;
    const resolvedFbp = (body?.fbp ? String(body.fbp) : (fbpMatch ? decodeURIComponent(fbpMatch[1]) : undefined));
    const resolvedFbc = (body?.fbc ? String(body.fbc) : (fbcMatch ? decodeURIComponent(fbcMatch[1]) : undefined));

    const userMetadata = {
      email: workEmail,
      firstName: String(name).split(" ")[0],
      lastName: String(name).split(" ").slice(1).join(" ") || undefined,
      country: country || undefined,
      clientIpAddress: ip,
      clientUserAgent: userAgent,
      fbp: resolvedFbp,
      fbc: resolvedFbc,
      externalId: bookingId,
    };

    // 1. Schedule Event ($250 milestone value)
    await sendMetaCapiEvent({
      eventName: "Schedule",
      eventId: clientEventId ? `sched_${clientEventId}` : undefined,
      eventSourceUrl: "https://www.digitaldude.co.uk/contact",
      user: userMetadata,
      customData: {
        content_name: "Discovery Call Booking",
        company_name: companyName,
        country,
        currency: "USD",
        value: 250.00,
      },
    });

    // 2. Lead Event ($50 milestone value)
    await sendMetaCapiEvent({
      eventName: "Lead",
      eventId: clientEventId ? `lead_${clientEventId}` : undefined,
      eventSourceUrl: "https://www.digitaldude.co.uk/contact",
      user: userMetadata,
      customData: {
        content_name: companyName,
        content_category: systemType,
        currency: "USD",
        value: 50.00,
      },
    });
  } catch (capiErr) {
    log("warn", { message: "Meta CAPI dispatch error on booking", error: capiErr });
  }

  return NextResponse.json({
    ok: true,
    firstName: String(name).split(" ")[0],
    slotStart: start.toISOString(),
    meetUrl: calendarMeeting?.meetUrl || null,
  });
}
