import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { cleanOffset, localDayStart } from "@/lib/crm/outreachStats";

export const dynamic = "force-dynamic";

const SIZES = [10, 25, 50];

/** The rep's sent emails, newest first, filtered and paged on the server so any volume works. */
export async function GET(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const db = getSupabaseServerClient();
    if (!db) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });

    const url = new URL(request.url);
    const page = Math.max(1, Math.floor(Number(url.searchParams.get("page"))) || 1);
    const requested = Math.floor(Number(url.searchParams.get("pageSize"))) || 10;
    const pageSize = SIZES.includes(requested) ? requested : 10;
    const stage = url.searchParams.get("stage");
    const range = url.searchParams.get("range") ?? "all";
    // Characters that would change a PostgREST filter are dropped from the search text.
    const q = (url.searchParams.get("q") ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
    const now = new Date();
    const since = range === "today" ? localDayStart(now, cleanOffset(url.searchParams.get("tz"))) : range === "7d" ? new Date(now.getTime() - 7 * 86_400_000) : range === "30d" ? new Date(now.getTime() - 30 * 86_400_000) : null;

    const build = (withStage: boolean) => {
      let query = db.from("rep_outreach_logs").select("*", { count: "exact" }).eq("employee_id", rep.id);
      if (withStage && (stage === "cold" || stage === "follow_up")) query = query.eq("stage", stage);
      if (since) query = query.gte("sent_at", since.toISOString());
      if (q) query = query.or(["recipient_email", "recipient_name", "company_name", "subject"].map((c) => `${c}.ilike.%${q}%`).join(","));
      return query.order("sent_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    };

    let res = await build(true);
    let stageFiltered = stage === "cold" || stage === "follow_up";
    // Before migration 0043 there is no stage column: show everything instead of failing.
    if (res.error && stageFiltered) {
      res = await build(false);
      stageFiltered = false;
    }
    if (res.error) return NextResponse.json({ ok: false, error: "Could not load your sent emails." }, { status: 500 });
    return NextResponse.json({ ok: true, logs: res.data ?? [], total: res.count ?? 0, page, pageSize, stageFiltered });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
