import { NextResponse } from "next/server";
import { z } from "zod";
import { repActor, repJsonError, repRoute } from "@/lib/repPool";
import { logAudit } from "@/lib/acquisition/audit";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const body = z.object({ companyId: z.string().uuid() });

const REASONS: Record<string, string> = {
  rep_not_active: "Your account can't claim companies right now.",
  company_not_found: "That company is no longer available.",
  already_owned: "Someone else already claimed this company.",
  not_claimable: "This company can't be claimed.",
  no_market: "This company has no market, so it can't be claimed.",
  market_not_allowed: "You don't have access to this company's market.",
  claim_cap_reached: "You've reached your limit of open companies. Finish or release one first.",
};

/** Claim one unowned company. The database enforces market access, the cap and single ownership atomically. */
export const POST = repRoute("claim company", async (request, { rep, db }) => {
  if (!rateLimit(`rep_claim:${rep.id}`, 60, 60 * 60 * 1000).ok) return repJsonError("Too many claims this hour. Please slow down.", 429);
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);

  const res = await db.rpc("acq_claim_company", { p_company_id: parsed.data.companyId, p_employee: rep.id });
  if (res.error) throw new Error(res.error.message);
  const row = (Array.isArray(res.data) ? res.data[0] : res.data) as { ok: boolean; reason: string | null } | undefined;
  if (!row?.ok) return repJsonError(REASONS[row?.reason ?? ""] ?? "Could not claim this company.", 409, { reason: row?.reason ?? "unknown" });

  await logAudit(db, "rep.claimed", "company", parsed.data.companyId, {}, repActor(rep));
  return NextResponse.json({ ok: true });
});
