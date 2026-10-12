import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOnboardedRep, type RepSessionPayload } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { logAudit } from "@/lib/acquisition/audit";
import { log } from "@/lib/logger";

type Db = SupabaseClient;

export function repJsonError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Rep-portal route wrapper: onboarded rep session, same-origin JSON for writes, DB client, uniform error handling. */
export function repRoute<P extends Record<string, string> = Record<string, never>>(
  what: string,
  fn: (request: Request, ctx: { rep: RepSessionPayload; db: Db; params: P }) => Promise<Response>
) {
  return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
    const rep = await getOnboardedRep(request);
    if (!rep) return repJsonError("Unauthorized, or onboarding is not completed yet.", 401);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin) {
        let originHost = "";
        try {
          originHost = new URL(origin).host;
        } catch {
          /* rejected below */
        }
        if (!host || originHost !== host) return repJsonError("Cross-origin request rejected", 403);
      }
      if (!(request.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) return repJsonError("Content-Type must be application/json", 415);
    }
    const db = getSupabaseServerClient();
    if (!db) return repJsonError("Database not connected", 503);
    try {
      return await fn(request, { rep, db, params: await context.params });
    } catch (e) {
      log("error", { message: `rep pool: ${what} failed`, error: e });
      return repJsonError("Something went wrong. Please try again.", 500);
    }
  };
}

export const repActor = (rep: { id: string }) => `rep:${rep.id}`;

/** Loads a company only if it is owned by this rep (and not archived). */
export async function ownedCompany(db: Db, repId: string, companyId: string) {
  const { data } = await db.from("acq_companies").select("*").eq("id", companyId).eq("owner_employee_id", repId).neq("status", "archived").maybeSingle();
  return data;
}

/** Ready-made searches the rep opens in their OWN browser. Nothing here fetches LinkedIn or Google. */
export function searchHelpLinks(c: { name: string; domain: string | null; website: string | null; country: string | null }) {
  const name = c.name.trim();
  const q = encodeURIComponent;
  const links: { label: string; url: string }[] = [
    { label: "LinkedIn: company", url: `https://www.linkedin.com/search/results/companies/?keywords=${q(name)}` },
    { label: "LinkedIn: people (directors/owners)", url: `https://www.linkedin.com/search/results/people/?keywords=${q(`${name} director OR owner OR founder OR manager`)}` },
    { label: "Google: contact details", url: `https://www.google.com/search?q=${q(`"${name}" contact email`)}` },
  ];
  if (c.domain) {
    links.push({ label: "Google: pages on their site", url: `https://www.google.com/search?q=${q(`site:${c.domain} contact OR team OR about`)}` });
    links.push({ label: "Their contact page", url: `https://${c.domain}/contact` });
  }
  return links;
}

/** A LinkedIn URL pasted by a rep: must be an https linkedin.com URL (no scraping, just stored as a reference). */
export function cleanLinkedinUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || !/(^|\.)linkedin\.com$/i.test(u.hostname)) return null;
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

const optionalUrl = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(2000).url().refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) link").optional());

/** The lawful basis a rep records for a contact (validated again by the database). */
export const basisSchema = z.object({
  consentType: z.enum(["express", "inferred_publication", "existing_relationship"]),
  legalBasis: z.string().trim().min(10, "Describe the lawful basis (at least a sentence)").max(2000),
  evidenceUrl: optionalUrl,
  evidenceNotes: z.string().trim().max(4000).optional(),
});

export interface RepBasis {
  consentType: "express" | "inferred_publication" | "existing_relationship";
  legalBasis: string;
  evidenceUrl?: string | null;
  evidenceNotes?: string | null;
}

/**
 * Records a lawful-basis review made by this rep (a person, never the AI), then tries to mark the contact
 * eligible. The database decides: without valid evidence the contact stays `needs_review`.
 */
export async function recordRepConsent(db: Db, rep: RepSessionPayload, contactId: string, basis: RepBasis): Promise<{ eligible: boolean; message: string | null }> {
  const ins = await db.from("acq_consent_records").insert({
    contact_id: contactId,
    consent_type: basis.consentType,
    legal_basis: basis.legalBasis,
    evidence_url: basis.evidenceUrl || null,
    evidence_notes: basis.evidenceNotes || null,
    reviewed_by: `${rep.full_name} (rep)`,
    reviewed_at: new Date().toISOString(),
    reviewed_by_employee_id: rep.id,
  });
  if (ins.error) return { eligible: false, message: ins.error.message.replace(/^[^:]+: /, "") };
  await logAudit(db, "rep.consent_recorded", "contact", contactId, { consentType: basis.consentType, repId: rep.id }, repActor(rep));

  const up = await db.from("acq_contacts").update({ status: "eligible", last_verified_at: new Date().toISOString() }).eq("id", contactId);
  if (up.error) return { eligible: false, message: up.error.message.replace(/^[^:]+: /, "") };
  return { eligible: true, message: null };
}

/** Once a contact may be emailed by this rep, expose it in their normal Leads CRM so drips and outreach tools work. */
export async function bridgeToRepLead(
  db: Db,
  rep: { id: string },
  contact: { id: string; email: string; name: string | null; role: string | null },
  companyName: string
): Promise<string | null> {
  const can = await db.rpc("acq_rep_can_email", { p_contact_id: contact.id, p_employee: rep.id });
  const row = (Array.isArray(can.data) ? can.data[0] : can.data) as { ok: boolean } | undefined;
  if (can.error || !row?.ok) return null;
  const { data: existing } = await db.from("rep_leads").select("id").eq("employee_id", rep.id).eq("acq_contact_id", contact.id).maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await db
    .from("rep_leads")
    .insert({ employee_id: rep.id, acq_contact_id: contact.id, full_name: contact.name?.trim() || contact.email.split("@")[0], email: contact.email, company_name: companyName, job_title: contact.role, lead_source: "Lead pool", stage: "new" })
    .select("id")
    .single();
  if (error) {
    log("warn", { message: "could not bridge pool contact to rep lead", error });
    return null;
  }
  return data.id as string;
}
