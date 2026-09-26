import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const now = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

    // 1. Total bookings
    const { count: totalBookings, error: bError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    // 2. Upcoming bookings (next 7 days)
    const { count: upcomingBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("slot_start", now)
      .lte("slot_start", nextWeek);

    // 3. Total published posts
    const { count: totalPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    // 4. Country breakdown and recent bookings
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select("id, name, work_email, company_name, country, team_size, slot_start, status, meet_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Country counts
    const { data: allCountries } = await supabase
      .from("bookings")
      .select("country");

    const countryCounts: Record<string, number> = {};
    (allCountries || []).forEach((row) => {
      const c = row.country || "Other";
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    return NextResponse.json({
      ok: true,
      stats: {
        totalBookings: totalBookings || 0,
        upcomingBookings: upcomingBookings || 0,
        totalPosts: totalPosts || 0,
        countryCounts,
        recentBookings: recentBookings || [],
      },
    });
  } catch (error) {
    log("error", { message: "Failed to fetch admin stats", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
