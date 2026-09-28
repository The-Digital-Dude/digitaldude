import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

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
    // 1. Fetch employees
    const { data: employees } = await supabase.from("employees").select("*");
    const employeeMap = new Map((employees || []).map((e) => [e.id, e]));

    // 2. Fetch bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Build CSV Header
    const headers = [
      "Record ID",
      "Sales Rep Name",
      "Sales Rep Email",
      "Referral Code",
      "Client Name",
      "Client Email",
      "Company Name",
      "Milestone Type",
      "Amount",
      "Currency",
      "Payout Status",
      "Payout Method",
      "Account Number / Details",
      "Admin Notes",
      "Scheduled Date",
      "Created At",
    ];

    const rows: string[] = [headers.join(",")];

    (bookings || []).forEach((b) => {
      const emp = b.employee_id ? employeeMap.get(b.employee_id) : null;
      if (!emp) return;

      const currency = emp.currency || "BDT";
      const meetingBonus = emp.meeting_bonus_min || 1000;
      const dealPercent = emp.deal_commission_percent_min || 10;
      const dealComm = Math.round(((Number(b.deal_value) || 0) * dealPercent) / 100);

      // Meeting Bonus row
      rows.push(
        [
          escapeCsvCell(`${b.id}-meeting`),
          escapeCsvCell(emp.full_name),
          escapeCsvCell(emp.email),
          escapeCsvCell(emp.referral_code || "—"),
          escapeCsvCell(b.name),
          escapeCsvCell(b.work_email),
          escapeCsvCell(b.company_name || "—"),
          escapeCsvCell("Qualified Meeting Bonus"),
          escapeCsvCell(meetingBonus),
          escapeCsvCell(currency),
          escapeCsvCell(b.meeting_bonus_payout_status === "paid" ? "PAID" : "PENDING"),
          escapeCsvCell(emp.payout_details?.method || "bKash / Bank"),
          escapeCsvCell(emp.payout_details?.account_number || "—"),
          escapeCsvCell(b.payout_notes || "—"),
          escapeCsvCell(b.slot_start),
          escapeCsvCell(b.created_at),
        ].join(",")
      );

      // Deal Commission row
      if (Number(b.deal_value) > 0 || ["proposal", "in_negotiation", "closed_won", "won"].includes(b.stage)) {
        rows.push(
          [
            escapeCsvCell(`${b.id}-commission`),
            escapeCsvCell(emp.full_name),
            escapeCsvCell(emp.email),
            escapeCsvCell(emp.referral_code || "—"),
            escapeCsvCell(b.name),
            escapeCsvCell(b.work_email),
            escapeCsvCell(b.company_name || "—"),
            escapeCsvCell("Closed Deal Commission"),
            escapeCsvCell(dealComm),
            escapeCsvCell(currency),
            escapeCsvCell(b.deal_commission_payout_status === "paid" ? "PAID" : "PENDING"),
            escapeCsvCell(emp.payout_details?.method || "bKash / Bank"),
            escapeCsvCell(emp.payout_details?.account_number || "—"),
            escapeCsvCell(b.payout_notes || "—"),
            escapeCsvCell(b.slot_start),
            escapeCsvCell(b.created_at),
          ].join(",")
        );
      }
    });

    const csvContent = rows.join("\n");
    const filename = `digitaldude-payout-ledger-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
