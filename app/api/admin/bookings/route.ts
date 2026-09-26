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
