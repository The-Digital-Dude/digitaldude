import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    let query = supabase
      .from("bookings")
      .select("*")
      .order("slot_start", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,work_email.ilike.%${search}%,company_name.ilike.%${search}%,country.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      log("error", { message: "Failed to fetch bookings in admin", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bookings: data || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
