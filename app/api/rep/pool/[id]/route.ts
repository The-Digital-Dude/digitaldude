import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanLinkedinUrl, ownedCompany, repActor, repJsonError, repRoute, searchHelpLinks } from "@/lib/repPool";
import { logAudit } from "@/lib/acquisition/audit";
import { must } from "@/lib/acquisition/db";
import { secretStatus } from "@/lib/acquisition/secrets";
import { loadChecks } from "@/lib/acquisition/verify/bulk";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const STATUSES = ["assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"] as const;
const patch = z.object({
  poolStatus: z.enum(STATUSES).optional(),
  linkedinUrl: z.string().trim().max(500).optional(),
  release: z.boolean().optional(),
});

/** Everything a rep needs to work one of their companies: evidence, contacts, suggestions, notes and search helper links. */
export const GET = repRoute<{ id: string }>("company detail", async (_request, { rep, db, params }) => {
  const company = await ownedCompany(db, rep.id, params.id);
  if (!company) return repJsonError("Company not found", 404);

  const [research, contacts, suggestions, notes] = await Promise.all([
    db.from("acq_research_records").select("id,category,observed_fact,evidence_excerpt,source_url,strength").eq("company_id", company.id).order("strength", { ascending: false }).limit(10),
    db.from("acq_contacts").select("id,name,role,email,status,source_url,source_type").eq("company_id", company.id).order("created_at"),
    db.from("acq_contact_suggestions").select("id,email,source_url,evidence_excerpt").eq("company_id", company.id).eq("status", "pending").order("created_at"),
    db.from("acq_company_notes").select("id,author,note,created_at").eq("company_id", company.id).order("created_at", { ascending: false }).limit(30),
  ]);

  // A failing optional section must not blank the whole page; report which one broke so it can be fixed.
  const warnings: string[] = [];
  const part = <T,>(res: { data: T[] | null; error: { message: string } | null }, what: string): T[] => {
    if (res.error) {
      warnings.push(`${what}: ${res.error.message}`);
      log("error", { message: `rep pool company detail: ${what} query failed`, error: res.error });
      return [];
    }
    return res.data ?? [];
  };
  const checks = await loadChecks(db, ((contacts.data ?? []) as { email: string }[]).map((c) => c.email)).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);
  const rule = await db.from("acq_country_rules").select("email_allowed,requires_postal_address,notes,name").eq("country", company.country ?? "").maybeSingle();
  let finderEnabled = false;
  try {
    finderEnabled = (await secretStatus(db, "hunter")).configured && !!company.domain;
  } catch (e) {
    warnings.push(`contact finder: ${e instanceof Error ? e.message : "unavailable"}`);
    log("error", { message: "rep pool company detail: secret status failed", error: e });
  }
  return NextResponse.json({
    ok: true,
    company: {
      id: company.id, name: company.name, domain: company.domain, website: company.website, country: company.country, region: company.region,
      industry: company.industry, summary: company.summary, potential_opportunity: company.potential_opportunity, decision_maker_role: company.decision_maker_role,
      fit_score: company.fit_score, pool_status: company.pool_status, linkedin_url: company.linkedin_url,
    },
    research: part(research, "research"),
    contacts: part(contacts, "contacts").map((c) => ({ ...c, emailCheck: checks[String((c as { email: string }).email).trim().toLowerCase()] ?? null })),
    suggestions: part(suggestions, "suggestions"),
    notes: part(notes, "notes"),
    countryRule: rule.data ?? null,
    finderEnabled,
    helpLinks: searchHelpLinks(company),
    ...(warnings.length ? { warnings } : {}),
  });
});

/** Update status, LinkedIn reference, or release the company back to the pool. Owners only. */
export const PATCH = repRoute<{ id: string }>("update company", async (request, { rep, db, params }) => {
  const parsed = patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);
  const company = await ownedCompany(db, rep.id, params.id);
  if (!company) return repJsonError("Company not found", 404);
  const b = parsed.data;

  if (b.release) {
    must(await db.rpc("acq_assign_companies", { p_company_ids: [company.id], p_employee: null, p_actor: repActor(rep), p_source: "admin" }), "release");
    await logAudit(db, "rep.released", "company", company.id, {}, repActor(rep));
    return NextResponse.json({ ok: true, released: true });
  }

  const update: Record<string, unknown> = {};
  if (b.poolStatus) update.pool_status = b.poolStatus;
  if (b.linkedinUrl !== undefined) {
    if (b.linkedinUrl === "") update.linkedin_url = null;
    else {
      const clean = cleanLinkedinUrl(b.linkedinUrl);
      if (!clean) return repJsonError("Enter a valid https://www.linkedin.com/... address", 422);
      update.linkedin_url = clean;
    }
  }
  if (Object.keys(update).length === 0) return repJsonError("Nothing to update", 422);
  must(await db.from("acq_companies").update(update).eq("id", company.id).eq("owner_employee_id", rep.id).select("id"), "update company");
  await logAudit(db, "rep.company_updated", "company", company.id, { fields: Object.keys(update) }, repActor(rep));
  return NextResponse.json({ ok: true });
});
