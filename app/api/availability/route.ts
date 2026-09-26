import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { generateSlotsForDate, isDateWithinBookingWindow } from "@/lib/availability";

export async function GET(request: Request) {
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

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
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
