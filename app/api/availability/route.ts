import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { generateSlotsForDate, isDateWithinBookingWindow } from "@/lib/availability";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: Request) {
  // Rate limit: 30 availability checks per IP per minute.
  const ip = getClientIp(request);
  const rl = rateLimit(`availability:${ip}`, 30, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !isDateWithinBookingWindow(date)) {
    return NextResponse.json({ ok: true, slots: [] });
  }

  const now = new Date();
  const allSlots = generateSlotsForDate(date).filter((iso) => new Date(iso) > now);

  if (allSlots.length === 0) {
    return NextResponse.json({ ok: true, slots: [] });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    // No database configured yet: can't check conflicts, so nothing is bookable.
    return NextResponse.json({ ok: true, slots: [] });
  }

  // Use the actual first and last generated slot as boundaries rather than
  // wall-clock midnight strings — avoids timezone edge-case mismatches.
  const dayStart = allSlots[0];
  const dayEnd = allSlots[allSlots.length - 1];
  const { data, error } = await supabase
    .from("bookings")
    .select("slot_start")
    .gte("slot_start", dayStart)
    .lte("slot_start", dayEnd);

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not check availability." }, { status: 500 });
  }

  const taken = new Set((data ?? []).map((row) => new Date(row.slot_start as string).toISOString()));
  const available = allSlots.filter((iso) => !taken.has(iso));

  return NextResponse.json({ ok: true, slots: available });
}

