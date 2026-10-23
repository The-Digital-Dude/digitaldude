import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/adminAuth";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BOT_USER_AGENTS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /whatsapp/i,
  /slack/i,
  /telegram/i,
  /twitter/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /embedly/i,
  /quora/i,
  /preview/i,
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });

    const userAgent = request.headers.get("user-agent") || "";
    if (BOT_USER_AGENTS.some((pattern) => pattern.test(userAgent))) {
      return NextResponse.json({ ok: true, ignored: "bot" });
    }

    // Skip tracking for logged-in admins
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken && (await verifyAdminSessionToken(adminToken))) {
      return NextResponse.json({ ok: true, ignored: "admin" });
    }

    // Skip tracking for logged-in reps
    const rep = await getAuthenticatedRep(request);
    if (rep) {
      return NextResponse.json({ ok: true, ignored: "rep" });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    const { data: proposal } = await supabase
      .from("proposals")
      .select("id, slug, lead_id, project_title, client_name, created_by_rep_id, view_count")
      .eq("slug", slug)
      .maybeSingle();

    if (!proposal) return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });

    const newCount = (proposal.view_count || 0) + 1;
    const nowIso = new Date().toISOString();

    // Update proposal view count
    await supabase
      .from("proposals")
      .update({
        view_count: newCount,
        last_viewed_at: nowIso,
      })
      .eq("id", proposal.id);

    // If attached to a CRM lead, update lead activity & log timeline
    if (proposal.lead_id) {
      await supabase
        .from("rep_leads")
        .update({
          last_activity_at: nowIso,
        })
        .eq("id", proposal.lead_id);

      await supabase.from("rep_lead_activities").insert({
        lead_id: proposal.lead_id,
        employee_id: proposal.created_by_rep_id || null,
        type: "system",
        outcome: "viewed",
        summary: `Prospect ${proposal.client_name} opened specification "${proposal.project_title}" (view #${newCount})`,
        details: { slug, viewCount: newCount, ip: getClientIp(request) },
      });
    }

    // Notify the assigned sales rep
    if (proposal.created_by_rep_id) {
      await supabase.from("acq_notifications").insert({
        recipient_employee_id: proposal.created_by_rep_id,
        kind: "proposal_viewed",
        title: "Proposal Viewed 👀",
        body: `${proposal.client_name} just viewed "${proposal.project_title}" (view #${newCount})`,
        link: proposal.lead_id ? `/rep/dashboard?leadId=${proposal.lead_id}` : `/proposals/${slug}`,
      });
    }

    return NextResponse.json({ ok: true, viewCount: newCount });
  } catch (err) {
    log("warn", { message: "Proposal view tracking error", error: err });
    return NextResponse.json({ ok: false, error: "Could not record view" }, { status: 500 });
  }
}
