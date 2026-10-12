import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { draftBasisForContact, type BasisDraft } from "@/lib/acquisition/contacts/basis-draft";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ contactIds: z.array(z.string().uuid()).min(1).max(10) });

/**
 * AI-drafts the lawful-basis form for up to 10 of the rep's own contacts. Drafts only: nothing is recorded here.
 * An evidence link is filled in only when the address was actually found on a page; otherwise the draft is empty
 * and flagged unverified.
 */
export const POST = repRoute("draft lawful basis", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Choose between 1 and 10 contacts", 422);
  const ids = [...new Set(parsed.data.contactIds)];
  for (let i = 0; i < ids.length; i++) {
    if (!rateLimit(`rep_basis_draft:${rep.id}`, 60, 60 * 60 * 1000).ok) return repJsonError("Too many drafts this hour. Please slow down.", 429);
  }

  // Only the rep's own, non-archived contacts that are not already shut off.
  const { data: owned } = await db
    .from("acq_contacts")
    .select("id,status, acq_companies!inner(owner_employee_id,status)")
    .in("id", ids)
    .eq("acq_companies.owner_employee_id", rep.id)
    .neq("acq_companies.status", "archived");
  const allowed = ((owned ?? []) as unknown as { id: string; status: string }[]).filter((c) => c.status !== "blocked" && c.status !== "suppressed").map((c) => c.id);
  if (allowed.length === 0) return repJsonError("No matching contacts", 404);

  const ai = await resolveAiProvider(db).catch(() => null);
  const drafts: BasisDraft[] = [];
  const queue = [...allowed];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let id = queue.shift(); id; id = queue.shift()) {
        const d = await draftBasisForContact(db, id, { ai }).catch(() => null);
        if (d) drafts.push(d);
      }
    })
  );
  return NextResponse.json({ ok: true, drafts, aiUsed: !!ai });
});
