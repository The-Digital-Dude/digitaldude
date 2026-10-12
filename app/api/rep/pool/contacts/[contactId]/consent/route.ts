import { NextResponse } from "next/server";
import { z } from "zod";
import { basisSchema, quickBasisSchema, recordBasisFor, repJsonError, repRoute } from "@/lib/repPool";

export const dynamic = "force-dynamic";

/** Record (or refresh) the lawful basis for an existing contact at one of this rep's companies. */
export const POST = repRoute<{ contactId: string }>("record consent", async (request, { rep, db, params }) => {
  if (!z.string().uuid().safeParse(params.contactId).success) return repJsonError("Invalid id", 400);
  const parsed = z.union([basisSchema, quickBasisSchema]).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Please check the form", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });

  const r = await recordBasisFor(db, rep, params.contactId, parsed.data);
  if (!r.ok) return repJsonError(r.error, r.status);
  return NextResponse.json({ ok: true, eligible: r.eligible, readyToEmail: r.readyToEmail, leadId: r.leadId, blocked: r.blocked });
});
