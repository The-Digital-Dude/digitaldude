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

  try {
    const now = new Date();
    // Use rolling 24-hour cutoff (or current calendar day) so activity across timezones is accurately captured
    const rolling24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const calendarStartOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfToday = rolling24hAgo < calendarStartOfToday ? rolling24hAgo : calendarStartOfToday;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch all reps / employees (with fallback if optional column not yet migrated)
    let reps: any[] = [];
    try {
      const { data: repData, error: repErr } = await supabase
        .from("employees")
        .select("id, full_name, email, role_title, status, assigned_outreach_email, outreach_display_name, referral_code, created_at")
        .order("created_at", { ascending: true });
      if (!repErr && repData) {
        reps = repData;
      } else {
        const { data: fallbackReps } = await supabase
          .from("employees")
          .select("id, full_name, email, role_title, status, assigned_outreach_email, referral_code, created_at")
          .order("created_at", { ascending: true });
        reps = fallbackReps || [];
      }
    } catch {
      const { data: fallbackReps } = await supabase
        .from("employees")
        .select("id, full_name, email, role_title, status, created_at")
        .order("created_at", { ascending: true });
      reps = fallbackReps || [];
    }

    // 2. Fetch all audit logs in last 30 days
    const { data: recentLogs } = await supabase
      .from("rep_audit_logs")
      .select("id, employee_id, action_type, created_at, description")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false });

    // 3. Fetch all leads
    const { data: allLeads } = await supabase
      .from("rep_leads")
      .select("id, employee_id, stage, estimated_deal_value, created_at");

    // 4. Fetch all bookings
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id, sourced_by_employee_id, employee_id, status, created_at, deal_value");

    const totalReps = reps?.length || 0;
    const logs = recentLogs || [];
    const leads = allLeads || [];
    const bookings = allBookings || [];

    // Compute Global KPIs
    const emailsToday = logs.filter(
      (l) => (l.action_type === "outreach_sent" || l.action_type === "drip_dispatched") && l.created_at >= startOfToday
    ).length;

    const emailsThisWeek = logs.filter(
      (l) => (l.action_type === "outreach_sent" || l.action_type === "drip_dispatched") && l.created_at >= sevenDaysAgo
    ).length;

    const leadsThisWeek = leads.filter((l) => l.created_at >= sevenDaysAgo).length;

    const activeRepsToday = new Set(
      logs.filter((l) => l.created_at >= startOfToday).map((l) => l.employee_id)
    ).size;

    const activeRepsThisWeek = new Set(
      logs.filter((l) => l.created_at >= sevenDaysAgo).map((l) => l.employee_id)
    ).size;

    // Per-Rep Scorecards & Velocity Calculation
    const repScorecards = (reps || []).map((rep) => {
      const repLogs = logs.filter((l) => l.employee_id === rep.id);
      const repLeads = leads.filter((l) => l.employee_id === rep.id);
      const repBookings = bookings.filter(
        (b) => b.sourced_by_employee_id === rep.id || b.employee_id === rep.id
      );

      const totalEmailsSent = repLogs.filter(
        (l) => l.action_type === "outreach_sent" || l.action_type === "drip_dispatched"
      ).length;

      const emailsSentToday = repLogs.filter(
        (l) => (l.action_type === "outreach_sent" || l.action_type === "drip_dispatched") && l.created_at >= startOfToday
      ).length;

      const totalLeads = repLeads.length;
      const meetingsBooked = repLeads.filter((l) => l.stage === "meeting_booked" || l.stage === "won").length + repBookings.length;
      const dealsWon = repLeads.filter((l) => l.stage === "won").length + repBookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;

      const pipelineFromLeads = repLeads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0);
      const pipelineFromBookings = repBookings.reduce((acc, b) => acc + (Number(b.deal_value) || 8500), 0);
      const pipelineValue = pipelineFromLeads + pipelineFromBookings;

      const lastActivity = repLogs[0]?.created_at || null;

      // Compute Active Day Streak (consecutive days with at least 1 log)
      let streakDays = 0;
      let checkDate = new Date();
      for (let i = 0; i < 14; i++) {
        const dayStr = checkDate.toISOString().split("T")[0];
        const hasActivity = repLogs.some((l) => l.created_at.startsWith(dayStr));
        if (hasActivity) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // If no activity today yet, check yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Assign Velocity Badge
      let velocityBadge = "Active Rep";
      let badgeColor = "bg-slate-100 text-slate-700";

      if (totalEmailsSent >= 50 || emailsSentToday >= 20) {
        velocityBadge = "⚡ High Outreach Velocity";
        badgeColor = "bg-purple/10 text-purple border-purple/30";
      } else if (dealsWon >= 1 || meetingsBooked >= 3) {
        velocityBadge = "🏆 Top Deal Converter";
        badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
      } else if (streakDays >= 3) {
        velocityBadge = `🔥 ${streakDays}-Day Active Streak`;
        badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
      } else if (!lastActivity || lastActivity < sevenDaysAgo) {
        velocityBadge = "⚠️ Needs Re-engagement";
        badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
      }

      return {
        id: rep.id,
        full_name: rep.full_name,
        email: rep.email,
        role_title: rep.role_title,
        assigned_outreach_email: rep.assigned_outreach_email,
        outreach_display_name: rep.outreach_display_name,
        totalEmailsSent,
        emailsSentToday,
        totalLeads,
        meetingsBooked,
        dealsWon,
        pipelineValue,
        streakDays,
        lastActivity,
        velocityBadge,
        badgeColor,
        recentActions: repLogs.slice(0, 5),
      };
    });

    return NextResponse.json({
      ok: true,
      metrics: {
        totalReps,
        activeRepsToday,
        activeRepsThisWeek,
        emailsToday,
        emailsThisWeek,
        leadsThisWeek,
        totalPipelineValue: leads.reduce((acc, l) => acc + (Number(l.estimated_deal_value) || 0), 0),
      },
      scorecards: repScorecards,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
