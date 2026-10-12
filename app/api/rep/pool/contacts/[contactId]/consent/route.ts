import { NextResponse } from "next/server";
import { z } from "zod";
import { basisSchema, bridgeToRepLead, recordRepConsent, repJsonError, repRoute } from "@/lib/repPool";

export const dynamic = "force-dynamic";

/** Record (or refresh) the lawful basis for an existing contact at one of this rep's companies. */
export const POST = repRoute<{ contactId: string }>("record consent", async (request, { rep, db, params }) => {
  if (!z.string().uuid().safeParse(params.contactId).success) return repJsonError("Invalid id", 400);
  const parsed = basisSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Please check the form", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });

  const { data: contact } = await db.from("acq_contacts").select("id,email,name,role,source_url,company_id, acq_companies(id,name,owner_employee_id,status)").eq("id", params.contactId).maybeSingle();
  const company = contact?.acq_companies as unknown as { id: string; name: string; owner_employee_id: string | null; status: string } | null;
  if (!contact || !company || company.owner_employee_id !== rep.id || company.status === "archived") return repJsonError("Contact not found", 404);
  if (parsed.data.consentType === "inferred_publication" && !contact.source_url && !parsed.data.evidenceUrl) return repJsonError("Inferred consent needs the web page where the address was published", 422);

  // A rep may never re-enable a contact an admin (or the contact) has shut off.
  const { data: contactRow } = await db.from("acq_contacts").select("status").eq("id", contact.id).maybeSingle();
  if (contactRow?.status === "blocked" || contactRow?.status === "suppressed") return repJsonError("This contact has been blocked. Ask the admin.", 409);
  const { data: latest } = await db.from("acq_consent_records").select("consent_type").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(1);
  if (latest?.[0]?.consent_type === "withdrawn") return repJsonError("Consent for this contact was withdrawn. Ask the admin.", 409);

  const sup = await db.rpc("acq_is_suppressed", { p_email: contact.email });
  if (sup.data === true) return repJsonError("This address is on the do-not-contact list.", 409);

  const result = await recordRepConsent(db, rep, contact.id, { ...parsed.data, evidenceUrl: parsed.data.evidenceUrl ?? contact.source_url ?? null });
  const leadId = result.eligible ? await bridgeToRepLead(db, rep, contact, company.name) : null;
  return NextResponse.json({ ok: true, eligible: result.eligible, readyToEmail: !!leadId, leadId, blocked: result.message });
});
