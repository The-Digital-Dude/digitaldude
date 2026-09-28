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

  // Commission summary computed live from real bookings data, not stored —
  // this is exactly the "connect to CRM" piece from the plan.
  const { data: sourcedBookings } = await supabase
    .from("bookings")
    .select("id, stage, deal_value")
    .eq("sourced_by_employee_id", id);

  const bookings = sourcedBookings || [];
  const qualifiedMeetings = bookings.filter((b) => b.stage !== "closed_lost").length;
  const wonDealValue = bookings
    .filter((b) => b.stage === "closed_won")
    .reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

  const commissionSummary = {
    qualifiedMeetings,
    meetingBonusRangeTotal: [
      qualifiedMeetings * (Number(employee.meeting_bonus_min) || 0),
      qualifiedMeetings * (Number(employee.meeting_bonus_max) || 0),
    ],
    wonDealValue,
    dealCommissionRangeTotal: [
      wonDealValue * ((Number(employee.deal_commission_percent_min) || 0) / 100),
      wonDealValue * ((Number(employee.deal_commission_percent_max) || 0) / 100),
    ],
  };

  return NextResponse.json({ ok: true, employee, commissionSummary });
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
      meeting_bonus_min,
      meeting_bonus_max,
      deal_commission_percent_min,
      deal_commission_percent_max,
      status,
    } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (role_title !== undefined) updateData.role_title = role_title;
    if (employment_type !== undefined) updateData.employment_type = employment_type;
    if (meeting_bonus_min !== undefined) updateData.meeting_bonus_min = meeting_bonus_min;
    if (meeting_bonus_max !== undefined) updateData.meeting_bonus_max = meeting_bonus_max;
    if (deal_commission_percent_min !== undefined) updateData.deal_commission_percent_min = deal_commission_percent_min;
    if (deal_commission_percent_max !== undefined) updateData.deal_commission_percent_max = deal_commission_percent_max;

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
