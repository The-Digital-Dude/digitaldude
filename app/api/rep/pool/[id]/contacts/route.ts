import { NextResponse } from "next/server";
import { z } from "zod";
import { basisSchema, cleanLinkedinUrl, ensureRepLead, ownedCompany, quickBasisSchema, recordBasisFor, repActor, repJsonError, repRoute } from "@/lib/repPool";
import { logAudit } from "@/lib/acquisition/audit";
import { isValidEmail, normalizeEmail } from "@/lib/acquisition/normalize";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const optionalUrl = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(2000).url().optional());

const body = z.object({
  name: z.string().trim().max(200).optional(),
  role: z.string().trim().max(200).optional(),
  email: z.string().trim().max(320).refine(isValidEmail, "Invalid email address"),
  sourceUrl: optionalUrl,
  linkedinUrl: z.string().trim().max(500).optional(),
  sourceType: z.enum(["company_website", "public_directory", "referral", "inbound_enquiry", "existing_client", "manual_import", "other"]).default("company_website"),
  basis: z.union([basisSchema, quickBasisSchema]),
});

/**
 * A rep adds a contact to one of their companies and records the lawful basis in the same step.
 * The contact exists as `needs_review` first; only the database-checked basis makes it `eligible`.
 */
export const POST = repRoute<{ id: string }>("add pool contact", async (request, { rep, db, params }) => {
  if (!rateLimit(`rep_pool_contact:${rep.id}`, 120, 60 * 60 * 1000).ok) return repJsonError("Too many contacts added this hour.", 429);
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Please check the form", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  const b = parsed.data;
  if (b.linkedinUrl && !cleanLinkedinUrl(b.linkedinUrl)) return repJsonError("Enter a valid https://www.linkedin.com/... address", 422);
  const published = "consentType" in b.basis ? b.basis.consentType === "inferred_publication" : b.basis.reason === "published";
  if (published && !b.sourceUrl && !b.basis.evidenceUrl) return repJsonError("Add the web page where the address was published", 422);

  const company = await ownedCompany(db, rep.id, params.id);
  if (!company) return repJsonError("Company not found", 404);

  const email = normalizeEmail(b.email);
  const sup = await db.rpc("acq_is_suppressed", { p_email: email });
  if (sup.error) throw new Error(sup.error.message);
  if (sup.data === true) return repJsonError("This address is on the do-not-contact list and can't be added.", 409);

  const ins = await db
    .from("acq_contacts")
    .insert({ company_id: company.id, name: b.name || null, role: b.role || null, email, source_url: b.sourceUrl ?? b.basis.evidenceUrl ?? null, source_type: b.sourceType, status: "needs_review" })
    .select("id,email,name,role")
    .single();
  if (ins.error) {
    if (ins.error.code === UNIQUE_VIOLATION) return repJsonError("This email address already exists in the system.", 409);
    throw new Error(ins.error.message);
  }
  await logAudit(db, "rep.contact_added", "contact", ins.data.id, { companyId: company.id }, repActor(rep));

  // The contact is saved in the rep's Leads CRM straight away; sending stays blocked until the basis checks out.
  const recorded = await recordBasisFor(db, rep, ins.data.id, b.basis);
  const result = recorded.ok ? { eligible: recorded.eligible, message: recorded.blocked } : { eligible: false, message: recorded.error };
  const { leadId, readyToEmail } = recorded.ok ? { leadId: recorded.leadId, readyToEmail: recorded.readyToEmail } : await ensureRepLead(db, rep, ins.data, company.name);

  // Why this contact can't be emailed yet, in plain words.
  let blocked: string | null = result.message;
  if (result.eligible && !readyToEmail) {
    const rule = await db.rpc("acq_country_allowed", { p_country: company.country ?? "" });
    blocked = rule.data === true ? "The contact was saved but is not ready to email yet." : `Outreach to ${company.country ?? "this country"} is not enabled yet. Ask the admin to enable it.`;
  }
  return NextResponse.json({ ok: true, contactId: ins.data.id, eligible: result.eligible, readyToEmail, leadId, blocked }, { status: 201 });
});
