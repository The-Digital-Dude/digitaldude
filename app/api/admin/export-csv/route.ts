import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { DEMO_LEADS, BookingLead } from "@/lib/crm";

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let leads: BookingLead[] = [];

  const supabase = getSupabaseServerClient();
  let usedSupabase = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        usedSupabase = true;
        leads = (data || []).map((b) => ({
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
        }));
      }
    } catch {
      // fallback
    }
  }

  // Only export demo leads when Supabase genuinely isn't configured/reachable
  // — a real, empty bookings table must export as an empty CSV, not silently
  // substitute 5 fabricated leads for real ones.
  if (!usedSupabase) {
    leads = DEMO_LEADS;
  }

  const headers = [
    "Lead ID",
    "Company Name",
    "Contact Name",
    "Work Email",
    "Country",
    "Team Size",
    "CRM Stage",
    "Deal Value (GBP)",
    "Lead Score",
    "Meeting Date / Slot",
    "Internal Team Notes",
    "Project Scope / Message",
    "Created Date"
  ];

  const rows = leads.map((l) => [
    escapeCsv(l.id),
    escapeCsv(l.company_name),
    escapeCsv(l.name),
    escapeCsv(l.work_email),
    escapeCsv(l.country),
    escapeCsv(l.team_size || "Not specified"),
    escapeCsv(l.stage),
    escapeCsv(l.deal_value),
    escapeCsv(l.lead_score),
    escapeCsv(new Date(l.slot_start).toLocaleString()),
    escapeCsv(l.lead_notes || ""),
    escapeCsv(l.message || ""),
    escapeCsv(new Date(l.created_at).toLocaleDateString())
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.join(","))
  ].join("\r\n");

  const filename = `digitaldude-crm-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
