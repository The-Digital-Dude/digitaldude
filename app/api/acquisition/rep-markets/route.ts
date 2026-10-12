import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { repMarketBody, repMarketDelete } from "@/lib/acquisition/validation";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/** Give a rep access to claim companies from a market (with a cap on open companies), or change the cap. */
export const POST = adminRoute("grant rep market", async (request, { db }) => {
  const parsed = await parseBody(request, repMarketBody);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;
  const { data: rep } = await db.from("employees").select("id,status").eq("id", b.employeeId).maybeSingle();
  if (!rep || rep.status === "offboarded") return jsonError("Rep not found or offboarded", 404);
  must(await db.from("acq_rep_markets").upsert({ employee_id: b.employeeId, market_id: b.marketId, claim_cap: b.claimCap }).select("employee_id"), "grant market");
  await logAudit(db, "rep_market.granted", "rep", b.employeeId, { marketId: b.marketId, claimCap: b.claimCap });
  return NextResponse.json({ ok: true });
});

/** Remove a rep's access to a market. Companies they already own are not taken away. */
export const DELETE = adminRoute("revoke rep market", async (request, { db }) => {
  const parsed = await parseBody(request, repMarketDelete);
  if ("error" in parsed) return parsed.error;
  must(await db.from("acq_rep_markets").delete().eq("employee_id", parsed.data.employeeId).eq("market_id", parsed.data.marketId).select("employee_id"), "revoke market");
  await logAudit(db, "rep_market.revoked", "rep", parsed.data.employeeId, { marketId: parsed.data.marketId });
  return NextResponse.json({ ok: true });
});
