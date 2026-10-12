import { NextResponse } from "next/server";
import { z } from "zod";
import { repActor, repJsonError, repRoute } from "@/lib/repPool";
import { logAudit } from "@/lib/acquisition/audit";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

const body = z.object({ action: z.enum(["accept", "dismiss"]) });

/**
 * Accept or dismiss an address found on the company's own website. Accepting only creates a `needs_review`
 * contact: the rep must still record a lawful basis before it can be emailed.
 */
export const PATCH = repRoute<{ id: string }>("review suggestion", async (request, { rep, db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return repJsonError("Invalid id", 400);
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);

  const { data: s } = await db.from("acq_contact_suggestions").select("*, acq_companies(owner_employee_id,status)").eq("id", params.id).maybeSingle();
  const owner = (s?.acq_companies as unknown as { owner_employee_id: string | null; status: string } | null);
  if (!s || !owner || owner.owner_employee_id !== rep.id || owner.status === "archived") return repJsonError("Suggestion not found", 404);
  if (s.status !== "pending") return repJsonError("Already reviewed", 409);

  if (parsed.data.action === "dismiss") {
    await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", s.id);
    return NextResponse.json({ ok: true });
  }

  const sup = await db.rpc("acq_is_suppressed", { p_email: s.email });
  if (sup.data === true) {
    await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", s.id);
    return repJsonError("This address is on the do-not-contact list.", 409);
  }
  const ins = await db
    .from("acq_contacts")
    .insert({ company_id: s.company_id, email: s.email, source_url: s.source_url, source_type: "company_website", status: "needs_review" })
    .select("id")
    .single();
  if (ins.error && ins.error.code !== UNIQUE_VIOLATION) throw new Error(ins.error.message);
  await db.from("acq_contact_suggestions").update({ status: "accepted" }).eq("id", s.id);
  await logAudit(db, "rep.suggestion_accepted", "contact", ins.data?.id ?? null, { companyId: s.company_id }, repActor(rep));
  return NextResponse.json({ ok: true, contactId: ins.data?.id ?? null });
});
