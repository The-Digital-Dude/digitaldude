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

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employee_id");
  const actionType = searchParams.get("action_type");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

  try {
    let query = supabase
      .from("rep_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (employeeId && employeeId !== "all") {
      query = query.eq("employee_id", employeeId);
    }

    if (actionType && actionType !== "all") {
      query = query.eq("action_type", actionType);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,target_identifier.ilike.%${search}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      // Return empty list gracefully if table is not yet created
      return NextResponse.json({ ok: true, logs: [] });
    }

    // Also fetch employees map to attach rep details
    const { data: employees } = await supabase.from("employees").select("id, full_name, email, referral_code, role_title");
    const employeeMap = new Map((employees || []).map((e) => [e.id, e]));

    const enrichedLogs = (logs || []).map((log) => ({
      ...log,
      employee: employeeMap.get(log.employee_id) || null,
    }));

    return NextResponse.json({ ok: true, logs: enrichedLogs });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
