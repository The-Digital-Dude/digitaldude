import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { verifyMany } from "@/lib/acquisition/verify/bulk";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ contactIds: z.array(z.string().uuid()).min(1).max(25), force: z.boolean().optional() });

/** Checks whether these contacts' email addresses can receive mail. Only the rep's own, non-archived contacts. */
export const POST = repRoute("verify emails", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Choose between 1 and 25 contacts", 422);
  for (let i = 0; i < parsed.data.contactIds.length; i++) {
    if (!rateLimit(`rep_verify:${rep.id}`, 300, 60 * 60 * 1000).ok) return repJsonError("Too many checks this hour. Please slow down.", 429);
  }
  const { data } = await db
    .from("acq_contacts")
    .select("id,email, acq_companies!inner(owner_employee_id,status)")
    .in("id", parsed.data.contactIds)
    .eq("acq_companies.owner_employee_id", rep.id)
    .neq("acq_companies.status", "archived");
  const mine = (data ?? []) as unknown as { id: string; email: string }[];
  if (mine.length === 0) return repJsonError("No matching contacts", 404);

  const checks = await verifyMany(db, mine.map((c) => c.email), { force: parsed.data.force });
  const byEmail = new Map(checks.map((c) => [c.email, c]));
  const results = mine.map((c) => {
    const k = byEmail.get(c.email.trim().toLowerCase());
    return { contactId: c.id, email: c.email, status: k?.status ?? "unknown", reason: k?.reason ?? "Could not be checked right now.", source: k?.source ?? "builtin" };
  });
  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({ ok: true, results, safe: count("safe"), risky: count("risky"), invalid: count("invalid"), unknown: count("unknown") });
});
