import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { consentInput } from "@/lib/acquisition/validation";
import { evaluateEligibility, type ConsentRecord } from "@/lib/acquisition/compliance/eligibility";
import { isSuppressed } from "@/lib/acquisition/compliance/suppression";
import { stopOutreach } from "@/lib/acquisition/replies/process";
import { acqEnv } from "@/lib/acquisition/env";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/**
 * A person records their review of the consent evidence. This appends to the
 * history (never edits it) and re-derives the contact's status. Only a human
 * session can reach this route; the AI has no path to it.
 */
export const POST = adminRoute<{ id: string }>("record consent", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, consentInput);
  if ("error" in body) return body.error;
  const c = body.data;

  const { data: contact } = await db.from("acq_contacts").select("id,email,status").eq("id", params.id).maybeSingle();
  if (!contact) return jsonError("Contact not found", 404);

  const checklist = c.inferred_checklist;
  const legalBasis =
    c.consent_type === "inferred_publication" && checklist
      ? `${c.legal_basis ?? ""} [Confirmed: address conspicuously published; no "no unsolicited commercial messages" notice; message relevant to the recipient's role]`.trim()
      : c.legal_basis ?? null;

  must(
    await db
      .from("acq_consent_records")
      .insert({
        contact_id: params.id,
        consent_type: c.consent_type,
        legal_basis: legalBasis,
        evidence_url: c.evidence_url ?? null,
        evidence_notes: c.evidence_notes ?? null,
        reviewed_by: acqEnv().operatorName,
        reviewed_at: new Date().toISOString(),
        expires_at: c.expires_at ?? null,
      })
      .select("id")
      .single(),
    "save consent"
  );

  const consents = must(await db.from("acq_consent_records").select("*").eq("contact_id", params.id), "load consent") as ConsentRecord[];
  const result = evaluateEligibility({ email: contact.email, consents, suppressed: await isSuppressed(db, contact.email) });

  if (contact.status === "eligible" && !result.eligible) {
    await stopOutreach(db, params.id, "stopped", "consent no longer valid");
  }
  // The database guard re-checks this and refuses 'eligible' if the evidence is insufficient.
  must(await db.from("acq_contacts").update({ status: result.status, last_verified_at: new Date().toISOString() }).eq("id", params.id).select("id"), "update contact");

  return NextResponse.json({ ok: true, status: result.status, eligible: result.eligible, reasons: result.reasons }, { status: 201 });
});
