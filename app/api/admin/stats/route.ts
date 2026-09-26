import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { getInMemoryLeads, addInMemoryLead, BookingLead } from "@/lib/crm";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  let totalPosts = 6;
  let totalProposals = 1;
  let totalCaseStudies = 7;

  if (supabase) {
    try {
      const { data: bData } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bData && bData.length > 0) {
        const mapped: BookingLead[] = bData.map((b) => ({
          id: b.id,
          name: b.name,
          work_email: b.work_email,
          company_name: b.company_name,
          country: b.country || "United Kingdom",
          team_size: b.team_size || "1-10",
          message: b.message || "",
          slot_start: b.slot_start,
          slot_end: b.slot_end,
          meet_url: b.meet_url || undefined,
          stage: b.stage || "new_booking",
          deal_value: Number(b.deal_value) || 8500,
          lead_score: b.lead_score || "warm",
          lead_notes: b.lead_notes || "",
          assigned_to: b.assigned_to || "The Digital Dude Team",
          created_at: b.created_at || new Date().toISOString(),
        }));
        mapped.forEach((l) => addInMemoryLead(l));
      }

      const { count: pCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");
      if (pCount !== null) totalPosts = pCount;

      const { count: propCount } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true });
      if (propCount !== null) totalProposals = propCount;

      const { count: csCount } = await supabase
        .from("case_studies")
        .select("*", { count: "exact", head: true });
      if (csCount !== null) totalCaseStudies = csCount;
    } catch (err) {
      log("warn", { message: "Admin stats Supabase fallback", error: err });
    }
  }

  const allBookings: BookingLead[] = getInMemoryLeads();

  // Calculate CRM Pipeline Metrics
  let totalPipelineValue = 0;
  let wonRevenue = 0;
  const stageCounts: Record<string, number> = {
    new_booking: 0,
    call_completed: 0,
    proposal_sent: 0,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  };

  const scoreCounts: Record<string, number> = {
    hot: 0,
    warm: 0,
    cold: 0,
  };

  const countryCounts: Record<string, number> = {};

  allBookings.forEach((b) => {
    const stage = b.stage || "new_booking";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;

    const score = b.lead_score || "warm";
    scoreCounts[score] = (scoreCounts[score] || 0) + 1;

    const country = b.country || "United Kingdom";
    countryCounts[country] = (countryCounts[country] || 0) + 1;

    if (stage === "closed_won") {
      wonRevenue += Number(b.deal_value) || 0;
    } else if (stage !== "closed_lost") {
      totalPipelineValue += Number(b.deal_value) || 0;
    }
  });

  const activeDealsCount = allBookings.filter((b) => b.stage !== "closed_lost").length;
  const winRate = allBookings.length > 0
    ? Math.round(((stageCounts.closed_won || 0) / allBookings.length) * 100)
    : 0;

  const nowTime = Date.now();
  const next7Days = nowTime + 7 * 86400000;
  const upcomingBookings = allBookings.filter((b) => {
    const t = new Date(b.slot_start).getTime();
    return t >= nowTime && t <= next7Days;
  }).length;

  return NextResponse.json({
    ok: true,
    stats: {
      totalBookings: allBookings.length,
      upcomingBookings,
      totalPipelineValue,
      wonRevenue,
      activeDealsCount,
      winRate,
      totalPosts,
      totalProposals,
      totalCaseStudies,
      stageCounts,
      scoreCounts,
      countryCounts,
      recentBookings: allBookings.slice(0, 5),
    },
  });
}
