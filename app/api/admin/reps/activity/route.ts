import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";

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

  const url = new URL(request.url);
  const repId = url.searchParams.get("rep_id");
  const actionType = url.searchParams.get("action_type");
  const search = url.searchParams.get("search");
  const format = url.searchParams.get("format");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 500);
  const offset = Number(url.searchParams.get("offset")) || 0;

  try {
    let query = supabase
      .from("rep_audit_logs")
      .select(`
        id,
        employee_id,
        action_type,
        description,
        target_identifier,
        metadata,
        ip_address,
        created_at,
        employees (
          id,
          full_name,
          email,
          role_title,
          assigned_outreach_email
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (repId) {
      query = query.eq("employee_id", repId);
    }

    if (actionType && actionType !== "all") {
      query = query.eq("action_type", actionType);
    }

    if (search && search.trim()) {
      query = query.or(`description.ilike.%${search.trim()}%,target_identifier.ilike.%${search.trim()}%`);
    }

    if (format === "csv") {
      // Export up to 1000 records
      const { data: exportLogs, error: exportErr } = await query.limit(1000);
      if (exportErr) throw exportErr;

      const headers = ["Timestamp", "Sales Rep", "Rep Email", "Action Type", "Description", "Target Prospect", "IP Address"];
      const rows = (exportLogs || []).map((l: any) => [
        new Date(l.created_at).toISOString(),
        l.employees?.full_name || "Unknown",
        l.employees?.email || "",
        l.action_type,
        `"${(l.description || "").replace(/"/g, '""')}"`,
        l.target_identifier || "",
        l.ip_address || "",
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rep_audit_logs_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    query = query.range(offset, offset + limit - 1);
    const { data: logs, count, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      logs: logs || [],
      totalCount: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
