import { NextResponse } from "next/server";
import { repRoute } from "@/lib/repPool";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

const COLS = "id,name,domain,website,country,region,industry,market_id,pool_status,fit_score,fit_band,contact_count,linkedin_url,assigned_at,possible_duplicate_of, acq_markets(name)";
const OPEN = ["assigned", "needs_contact", "contacted"];

/**
 * ?view=mine (default): companies this rep owns.
 * ?view=available: unowned companies in markets this rep may claim from, best fit first, plus cap usage.
 */
export const GET = repRoute("list pool", async (request, { rep, db }) => {
  const view = new URL(request.url).searchParams.get("view") === "available" ? "available" : "mine";

  const grants = must(await db.from("acq_rep_markets").select("market_id,claim_cap, acq_markets(name,country)").eq("employee_id", rep.id), "grants") as unknown as {
    market_id: string; claim_cap: number; acq_markets: { name: string; country: string } | null;
  }[];
  const held = must(await db.from("acq_companies").select("id", { count: "exact", head: false }).eq("owner_employee_id", rep.id).in("pool_status", OPEN), "held").length;
  const cap = grants.length ? Math.max(...grants.map((g) => g.claim_cap)) : 0;
  const summary = { held, cap, markets: grants.map((g) => ({ id: g.market_id, name: g.acq_markets?.name ?? "Market", country: g.acq_markets?.country ?? "", claimCap: g.claim_cap })) };

  if (view === "available") {
    if (grants.length === 0) return NextResponse.json({ ok: true, companies: [], summary });
    const rows = must(
      await db.from("acq_companies").select(COLS).is("owner_employee_id", null).eq("pool_status", "unassigned").neq("status", "archived").in("market_id", grants.map((g) => g.market_id))
        .order("fit_score", { ascending: false, nullsFirst: false }).limit(50),
      "available"
    );
    return NextResponse.json({ ok: true, companies: rows, summary });
  }

  const rows = must(
    await db.from("acq_companies").select(COLS).eq("owner_employee_id", rep.id).neq("status", "archived").order("assigned_at", { ascending: false }).limit(300),
    "mine"
  );
  return NextResponse.json({ ok: true, companies: rows, summary });
});
