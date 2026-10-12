import { NextResponse } from "next/server";
import { z } from "zod";
import { basisSchema, recordBasisFor, repJsonError, repRoute } from "@/lib/repPool";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({
  items: z.array(basisSchema.and(z.object({ contactId: z.string().uuid() }))).min(1).max(25),
});

/**
 * Records the lawful basis the rep has reviewed and ticked, one contact at a time, through exactly the same checks
 * as the single-contact form. Each row succeeds or fails on its own, so one bad row never blocks the rest.
 */
export const POST = repRoute("record lawful basis in bulk", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Please check the selected rows", 422, { issues: parsed.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), message: i.message })) });
  for (let i = 0; i < parsed.data.items.length; i++) {
    if (!rateLimit(`rep_basis_record:${rep.id}`, 200, 60 * 60 * 1000).ok) return repJsonError("Too many records this hour.", 429);
  }

  const results: { contactId: string; ok: boolean; eligible?: boolean; readyToEmail?: boolean; leadId?: string | null; error?: string; blocked?: string | null }[] = [];
  const seen = new Set<string>();
  for (const { contactId, ...basis } of parsed.data.items) {
    if (seen.has(contactId)) continue;
    seen.add(contactId);
    const r = await recordBasisFor(db, rep, contactId, basis);
    results.push(r.ok ? { contactId, ok: true, eligible: r.eligible, readyToEmail: r.readyToEmail, leadId: r.leadId, blocked: r.blocked } : { contactId, ok: false, error: r.error });
  }
  return NextResponse.json({ ok: true, recorded: results.filter((r) => r.ok && r.eligible).length, results });
});
