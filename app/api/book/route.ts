import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendNotification } from "@/lib/sendNotification";
import { SLOT_MINUTES } from "@/lib/availability";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, workEmail, companyName, country, teamSize, message, slotStart, company } = body ?? {};

  // Hidden honeypot field: real visitors never fill this in.
  if (typeof company === "string" && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !workEmail || !companyName || !country || !slotStart) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const start = new Date(slotStart);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "That time isn't available anymore. Please pick another." },
      { status: 400 }
    );
  }
  const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);

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
      return NextResponse.json(
        { ok: false, error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: "Could not save your booking." }, { status: 500 });
  }

  await sendNotification({
    name,
    workEmail,
    companyName,
    country,
    teamSize,
    message: message || `(No message provided — booked a call for ${start.toISOString()})`,
  });

  return NextResponse.json({
    ok: true,
    firstName: String(name).split(" ")[0],
    slotStart: start.toISOString(),
  });
}
