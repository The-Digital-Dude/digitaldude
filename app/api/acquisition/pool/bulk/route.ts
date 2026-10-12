import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { poolBulkBody } from "@/lib/acquisition/validation";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { enqueueJob } from "@/lib/acquisition/queue/enqueue";
import { UNOWNED_OK } from "@/lib/acquisition/pool";

export const dynamic = "force-dynamic";

/** Bulk actions on selected companies (up to 500). Every action is audited. */
export const POST = adminRoute("pool bulk action", async (request, { db }) => {
  const parsed = await parseBody(request, poolBulkBody);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;
  const actor = acqEnv().operatorName;

  if (b.action === "assign") {
    const n = must(await db.rpc("acq_assign_companies", { p_company_ids: b.companyIds, p_employee: b.employeeId, p_actor: actor, p_source: "admin" }), "assign") as unknown as number;
    await logAudit(db, b.employeeId ? "pool.assigned" : "pool.unassigned", "pool", null, { count: n, employeeId: b.employeeId });
    return NextResponse.json({ ok: true, changed: n });
  }

  if (b.action === "set_status") {
    if (!UNOWNED_OK.includes(b.poolStatus)) {
      const { data: unowned } = await db.from("acq_companies").select("id").in("id", b.companyIds).is("owner_employee_id", null);
      if (unowned?.length) return jsonError(`${unowned.length} selected compan${unowned.length === 1 ? "y has" : "ies have"} no owner. Assign them to a rep before setting "${b.poolStatus.replace(/_/g, " ")}".`, 409);
    }
    if (b.poolStatus === "unassigned") {
      const n = must(await db.rpc("acq_assign_companies", { p_company_ids: b.companyIds, p_employee: null, p_actor: actor, p_source: "admin" }), "unassign") as unknown as number;
      return NextResponse.json({ ok: true, changed: n });
    }
    const rows = must(await db.from("acq_companies").update({ pool_status: b.poolStatus }).in("id", b.companyIds).neq("status", "archived").select("id"), "set status");
    await logAudit(db, "pool.status_set", "pool", null, { count: rows.length, status: b.poolStatus });
    return NextResponse.json({ ok: true, changed: rows.length });
  }

  if (b.action === "set_market") {
    let patch: Record<string, unknown> = { market_id: null };
    if (b.marketId) {
      const { data: m } = await db.from("acq_markets").select("id,country,industry").eq("id", b.marketId).maybeSingle();
      if (!m) return jsonError("Market not found", 404);
      patch = { market_id: m.id, country: m.country, industry: m.industry };
    }
    const rows = must(await db.from("acq_companies").update(patch).in("id", b.companyIds).select("id"), "set market");
    await logAudit(db, "pool.market_set", "pool", null, { count: rows.length, marketId: b.marketId });
    return NextResponse.json({ ok: true, changed: rows.length });
  }

  if (b.action === "archive") {
    must(await db.rpc("acq_assign_companies", { p_company_ids: b.companyIds, p_employee: null, p_actor: actor, p_source: "admin" }), "release before archive");
    const rows = must(await db.from("acq_companies").update({ status: "archived" }).in("id", b.companyIds).select("id"), "archive");
    await logAudit(db, "pool.archived", "pool", null, { count: rows.length });
    return NextResponse.json({ ok: true, changed: rows.length });
  }

  if (b.action === "research") {
    const { data: rows } = await db.from("acq_companies").select("id,website").in("id", b.companyIds).neq("status", "archived").not("website", "is", null);
    const day = new Date().toISOString().slice(0, 10);
    let queued = 0;
    for (const c of (rows ?? []) as { id: string }[]) {
      if ((await enqueueJob(db, { type: "research", payload: { companyId: c.id }, idempotencyKey: `research:${c.id}:${day}` })).created) queued++;
    }
    await logAudit(db, "pool.research_queued", "pool", null, { count: queued });
    return NextResponse.json({ ok: true, changed: queued });
  }

  let assigned = 0;
  for (const id of b.companyIds) {
    const r = await db.rpc("acq_apply_assignment_rules", { p_company_id: id });
    if (r.error) throw new Error(`apply rules: ${r.error.message}`);
    if (r.data) assigned++;
  }
  await logAudit(db, "pool.rules_applied", "pool", null, { selected: b.companyIds.length, assigned });
  return NextResponse.json({ ok: true, changed: assigned });
});
