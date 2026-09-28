import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  const repSession = await getAuthenticatedRep(request);
  if (!repSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", repSession.id)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ ok: false, error: "Employee record not found." }, { status: 404 });
    }

    // Live query for all bookings attributed to this rep
    const { data: sourcedBookings } = await supabase
      .from("bookings")
      .select("id, name, work_email, company_name, country, slot_start, status, stage, deal_value, meeting_bonus_payout_status, deal_commission_payout_status, payout_notes, created_at")
      .or(`sourced_by_employee_id.eq.${employee.id},employee_id.eq.${employee.id}`)
      .order("slot_start", { ascending: false });

    const bookings = sourcedBookings || [];
    const qualifiedMeetings = bookings.filter((b) => b.stage !== "closed_lost").length;
    const wonBookings = bookings.filter((b) => b.stage === "closed_won");
    const wonDealValue = wonBookings.reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

    const bonusMin = Number(employee.meeting_bonus_min) || 0;
    const bonusMax = Number(employee.meeting_bonus_max) || 0;
    const commPctMin = Number(employee.deal_commission_percent_min) || 0;
    const commPctMax = Number(employee.deal_commission_percent_max) || 0;

    const meetingBonusPaidCount = bookings.filter((b) => b.meeting_bonus_payout_status === "paid").length;
    const dealCommissionPaidCount = wonBookings.filter((b) => b.deal_commission_payout_status === "paid").length;

    // Count outreach logs
    const { count: outreachCount } = await supabase
      .from("rep_outreach_logs")
      .select("id", { count: "exact", head: true })
      .eq("employee_id", employee.id);

    const commissionSummary = {
      currency: employee.currency || "BDT",
      totalBookingsCount: bookings.length,
      qualifiedMeetings,
      meetingBonusRangeTotal: [
        qualifiedMeetings * bonusMin,
        qualifiedMeetings * bonusMax,
      ] as [number, number],
      meetingBonusPaidCount,
      wonDealsCount: wonBookings.length,
      wonDealValue,
      dealCommissionRangeTotal: [
        wonDealValue * (commPctMin / 100),
        wonDealValue * (commPctMax / 100),
      ] as [number, number],
      dealCommissionPaidCount,
      outreachSentCount: outreachCount || 0,
    };

    return NextResponse.json({
      ok: true,
      rep: employee,
      sourcedBookings: bookings,
      commissionSummary,
    });
  } catch (error) {
    log("error", { message: "Failed to load rep dashboard data", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
