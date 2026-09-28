import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { sendRepPayoutNotificationEmail } from "@/lib/repEmails";
import { recordRepAuditLog } from "@/lib/repAudit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("time_range") || "all_time"; // 'this_month' | 'all_time'

  try {
    // 1. Fetch all employees
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });

    if (empErr) {
      return NextResponse.json({ ok: false, error: empErr.message }, { status: 500 });
    }

    const employeeMap = new Map((employees || []).map((e) => [e.id, e]));

    // 2. Fetch all bookings
    const { data: bookings, error: bookErr } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookErr) {
      return NextResponse.json({ ok: false, error: bookErr.message }, { status: 500 });
    }

    // 3. Fetch all outreach logs count
    const { data: outreachLogs } = await supabase
      .from("rep_outreach_logs")
      .select("employee_id, sent_at");

    // 4. Time filtering for leaderboard
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 5. Build Payout Queue & Ledger items
    const payoutItems: Array<{
      id: string; // bookingId:type
      bookingId: string;
      milestoneType: "meeting_bonus" | "deal_commission";
      clientName: string;
      clientEmail: string;
      companyName: string | null;
      slotStart: string;
      bookingStatus: string;
      stage: string;
      dealValue: number;
      payoutStatus: "pending" | "paid";
      estimatedAmount: number;
      currency: string;
      payoutNotes: string | null;
      payoutDetails: Record<string, string>;
      employee: {
        id: string;
        full_name: string;
        email: string;
        referral_code?: string;
        role_title?: string;
      } | null;
      createdAt: string;
    }> = [];

    (bookings || []).forEach((b) => {
      const emp = b.employee_id ? employeeMap.get(b.employee_id) : null;
      if (!emp) return; // Only bookings attributed to a rep

      const currency = emp.currency || "BDT";
      const meetingBonusAmount = emp.meeting_bonus_min || 1000;
      const dealPercent = emp.deal_commission_percent_min || 10;
      const computedDealCommission = Math.round(((Number(b.deal_value) || 0) * dealPercent) / 100);

      // Meeting Bonus Item
      payoutItems.push({
        id: `${b.id}:meeting_bonus`,
        bookingId: b.id,
        milestoneType: "meeting_bonus",
        clientName: b.name,
        clientEmail: b.work_email,
        companyName: b.company_name || null,
        slotStart: b.slot_start,
        bookingStatus: b.status,
        stage: b.stage || "discovery",
        dealValue: Number(b.deal_value) || 0,
        payoutStatus: b.meeting_bonus_payout_status === "paid" ? "paid" : "pending",
        estimatedAmount: meetingBonusAmount,
        currency,
        payoutNotes: b.payout_notes || null,
        payoutDetails: emp.payout_details || {},
        employee: {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          referral_code: emp.referral_code,
          role_title: emp.role_title,
        },
        createdAt: b.created_at,
      });

      // Deal Commission Item (if deal has value or is in proposal/won stage)
      if (Number(b.deal_value) > 0 || ["proposal", "in_negotiation", "closed_won", "won"].includes(b.stage)) {
        payoutItems.push({
          id: `${b.id}:deal_commission`,
          bookingId: b.id,
          milestoneType: "deal_commission",
          clientName: b.name,
          clientEmail: b.work_email,
          companyName: b.company_name || null,
          slotStart: b.slot_start,
          bookingStatus: b.status,
          stage: b.stage || "closed_won",
          dealValue: Number(b.deal_value) || 0,
          payoutStatus: b.deal_commission_payout_status === "paid" ? "paid" : "pending",
          estimatedAmount: computedDealCommission,
          currency,
          payoutNotes: b.payout_notes || null,
          payoutDetails: emp.payout_details || {},
          employee: {
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            referral_code: emp.referral_code,
            role_title: emp.role_title,
          },
          createdAt: b.created_at,
        });
      }
    });

    // 6. Calculate Leaderboard Rankings
    const leaderboardMap = new Map<
      string,
      {
        employeeId: string;
        fullName: string;
        email: string;
        roleTitle: string;
        referralCode: string;
        currency: string;
        discoveryCallsCount: number;
        qualifiedCallsCount: number;
        wonDealsCount: number;
        wonRevenueTotal: number;
        outreachEmailsCount: number;
        earnedCommissionsTotal: number;
      }
    >();

    (employees || []).forEach((emp) => {
      leaderboardMap.set(emp.id, {
        employeeId: emp.id,
        fullName: emp.full_name,
        email: emp.email,
        roleTitle: emp.role_title || "Sales Rep",
        referralCode: emp.referral_code || "—",
        currency: emp.currency || "BDT",
        discoveryCallsCount: 0,
        qualifiedCallsCount: 0,
        wonDealsCount: 0,
        wonRevenueTotal: 0,
        outreachEmailsCount: 0,
        earnedCommissionsTotal: 0,
      });
    });

    // Aggregate booking milestones
    (bookings || []).forEach((b) => {
      if (!b.employee_id || !leaderboardMap.has(b.employee_id)) return;
      const bTime = new Date(b.created_at).getTime();
      if (timeRange === "this_month" && bTime < startOfMonth) return;

      const entry = leaderboardMap.get(b.employee_id)!;
      entry.discoveryCallsCount += 1;
      if (b.status === "completed") entry.qualifiedCallsCount += 1;

      const isWon = ["closed_won", "won"].includes(b.stage);
      const val = Number(b.deal_value) || 0;
      if (isWon && val > 0) {
        entry.wonDealsCount += 1;
        entry.wonRevenueTotal += val;
      }

      if (b.meeting_bonus_payout_status === "paid") {
        const emp = employeeMap.get(b.employee_id);
        entry.earnedCommissionsTotal += emp?.meeting_bonus_min || 1000;
      }
      if (b.deal_commission_payout_status === "paid" && val > 0) {
        const emp = employeeMap.get(b.employee_id);
        const percent = emp?.deal_commission_percent_min || 10;
        entry.earnedCommissionsTotal += Math.round((val * percent) / 100);
      }
    });

    // Aggregate outreach logs
    (outreachLogs || []).forEach((o) => {
      if (!leaderboardMap.has(o.employee_id)) return;
      const oTime = new Date(o.sent_at).getTime();
      if (timeRange === "this_month" && oTime < startOfMonth) return;

      const entry = leaderboardMap.get(o.employee_id)!;
      entry.outreachEmailsCount += 1;
    });

    // Sort leaderboard by won revenue descending, then qualified calls
    const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => {
      if (b.wonRevenueTotal !== a.wonRevenueTotal) {
        return b.wonRevenueTotal - a.wonRevenueTotal;
      }
      if (b.qualifiedCallsCount !== a.qualifiedCallsCount) {
        return b.qualifiedCallsCount - a.qualifiedCallsCount;
      }
      return b.discoveryCallsCount - a.discoveryCallsCount;
    });

    return NextResponse.json({
      ok: true,
      payoutItems,
      leaderboard,
      summary: {
        totalPendingCount: payoutItems.filter((i) => i.payoutStatus === "pending").length,
        totalPaidCount: payoutItems.filter((i) => i.payoutStatus === "paid").length,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      bookingId,
      milestoneType, // 'meeting_bonus' | 'deal_commission'
      payoutStatus = "paid", // 'paid' | 'pending'
      amount,
      transactionReference,
      notes,
      sendNotificationEmail = true,
    } = body;

    if (!bookingId || !milestoneType) {
      return NextResponse.json(
        { ok: false, error: "bookingId and milestoneType are required." },
        { status: 400 }
      );
    }

    // Fetch existing booking
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ ok: false, error: "Booking record not found." }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (milestoneType === "meeting_bonus") {
      updatePayload.meeting_bonus_payout_status = payoutStatus;
    } else if (milestoneType === "deal_commission") {
      updatePayload.deal_commission_payout_status = payoutStatus;
    }

    if (notes !== undefined) {
      updatePayload.payout_notes = notes;
    }

    const { data: updatedBooking, error: upErr } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    // Fetch employee if attributed
    let employeeData = null;
    if (booking.employee_id) {
      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("id", booking.employee_id)
        .single();
      employeeData = emp;

      // Record in audit log
      await recordRepAuditLog({
        employeeId: booking.employee_id,
        actionType: "payout_updated",
        description: `Admin marked ${
          milestoneType === "meeting_bonus" ? "Meeting Bonus" : "Deal Commission"
        } as "${payoutStatus}" for client "${booking.name}". TrxID: ${transactionReference || "N/A"}.`,
        targetIdentifier: booking.work_email,
        metadata: {
          bookingId,
          milestoneType,
          payoutStatus,
          amount,
          transactionReference,
          notes,
        },
      });

      // Send Brevo email if approved & requested
      if (sendNotificationEmail && payoutStatus === "paid" && employeeData?.email) {
        try {
          await sendRepPayoutNotificationEmail({
            repEmail: employeeData.email,
            repName: employeeData.full_name,
            milestoneType: milestoneType === "meeting_bonus" ? "Meeting Bonus" : "Deal Commission",
            amount: Number(amount) || (milestoneType === "meeting_bonus" ? 1000 : 5000),
            currency: employeeData.currency || "BDT",
            clientName: booking.name,
            companyName: booking.company_name || undefined,
            transactionReference: transactionReference || "PAID",
            payoutMethod: employeeData.payout_details?.method || "bKash / Bank",
            notes: notes || undefined,
          });
        } catch (mailErr) {
          log("warn", { message: "Could not dispatch payout notification email", error: mailErr });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      booking: updatedBooking,
      message: `Payout status updated to ${payoutStatus}`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
