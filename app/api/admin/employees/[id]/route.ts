import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { data: employee, error } = await supabase.from("employees").select("*").eq("id", id).single();
  if (error || !employee) {
    return NextResponse.json({ ok: false, error: "Employee not found" }, { status: 404 });
  }

  // Live query for all bookings attributed to this employee
  const { data: sourcedBookings } = await supabase
    .from("bookings")
    .select("id, name, work_email, company_name, country, slot_start, status, stage, deal_value, meeting_bonus_payout_status, deal_commission_payout_status, payout_notes, created_at")
    .eq("sourced_by_employee_id", id)
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
  };

  return NextResponse.json({
    ok: true,
    employee,
    sourcedBookings: bookings,
    commissionSummary,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      full_name,
      email,
      role_title,
      employment_type,
      currency,
      referral_code,
      meeting_bonus_min,
      meeting_bonus_max,
      deal_commission_percent_min,
      deal_commission_percent_max,
      onboarding_checklist,
      status,
    } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (role_title !== undefined) updateData.role_title = role_title;
    if (employment_type !== undefined) updateData.employment_type = employment_type;
    if (currency !== undefined) updateData.currency = currency;
    if (referral_code !== undefined) updateData.referral_code = referral_code;
    if (meeting_bonus_min !== undefined) updateData.meeting_bonus_min = meeting_bonus_min;
    if (meeting_bonus_max !== undefined) updateData.meeting_bonus_max = meeting_bonus_max;
    if (deal_commission_percent_min !== undefined) updateData.deal_commission_percent_min = deal_commission_percent_min;
    if (deal_commission_percent_max !== undefined) updateData.deal_commission_percent_max = deal_commission_percent_max;
    if (onboarding_checklist !== undefined) updateData.onboarding_checklist = onboarding_checklist;

    const wasStatusChangeToActive = status !== undefined;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log("error", { message: "Failed to update employee", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (wasStatusChangeToActive && status === "active") {
      try {
        const { sendOnboardingWelcomeEmail } = await import("@/lib/recruitingEmails");
        await sendOnboardingWelcomeEmail({
          fullName: data.full_name,
          email: data.email,
          roleTitle: data.role_title || "team member",
        });
      } catch (err) {
        log("warn", { message: "Could not send onboarding welcome email", error: err });
      }
    }

    return NextResponse.json({ ok: true, employee: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) {
    log("error", { message: "Failed to delete employee", error, context: { id } });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
