import type { Db } from "../db";
import { autoLimits } from "../env";
import { isFreeMailDomain, normalizeDomain } from "../normalize";
import type { ContactFinder, FoundEmail } from "../providers/contacts";
import { resolveContactFinder } from "../secrets";
import { sydneyDayStart } from "../queue/send";
import { logAudit } from "../audit";
import { insertSuggestions, type SuggestionInput } from "./suggestions";

const CACHE_DAYS = 30;

export type FindOutcome =
  | { status: "ok"; found: number; saved: number; quotaNote: string | null }
  | { status: "cached"; at: string }
  | { status: "cap_reached"; cap: number }
  | { status: "no_domain" }
  | { status: "not_configured" }
  | { status: "company_not_found" };

export const FIND_MESSAGES: Record<string, string> = {
  cached: "This company was already searched in the last 30 days.",
  cap_reached: "The daily contact-lookup limit has been reached. Try again tomorrow.",
  no_domain: "This company has no website, so there is nothing to search.",
  not_configured: "No contact-finder key is set up yet (Safety & settings > Contact finder).",
  company_not_found: "Company not found.",
};

/** Keeps only addresses on the company's own domain: a lookup must never smuggle in someone else's or a personal mailbox. */
export function ownDomainOnly(emails: FoundEmail[], companyDomain: string): FoundEmail[] {
  return emails.filter((e) => {
    const d = e.email.split("@")[1]?.toLowerCase();
    if (!d || isFreeMailDomain(d)) return false;
    return d === companyDomain || d.endsWith(`.${companyDomain}`);
  });
}

export function toSuggestions(emails: FoundEmail[], domain: string): SuggestionInput[] {
  return emails.map((e) => {
    const name = [e.firstName, e.lastName].filter(Boolean).join(" ") || null;
    const parts = [e.position && `Listed as ${e.position}`, e.confidence !== null && `confidence ${e.confidence}%`, e.sourceUris[0] && `seen on ${e.sourceUris[0]}`].filter(Boolean);
    return {
      email: e.email,
      name,
      role: e.position,
      source_url: e.sourceUris[0] ?? `https://hunter.io/search/${domain}`,
      evidence_excerpt: `Found by Hunter.io${parts.length ? `: ${parts.join("; ")}` : ""}`.slice(0, 600),
      origin: "hunter" as const,
      confidence: e.confidence,
    };
  });
}

/**
 * Looks up published business addresses for one company (cached 30 days, daily credit cap) and stores them as
 * SUGGESTIONS. Nothing is contacted and no contact is created: a person still has to accept each one and
 * record a lawful basis.
 */
export async function findContactsForCompany(db: Db, companyId: string, deps: { provider?: ContactFinder | null; now?: Date; force?: boolean; actor?: string } = {}): Promise<FindOutcome> {
  const provider = deps.provider === undefined ? await resolveContactFinder(db) : deps.provider;
  if (!provider) return { status: "not_configured" };
  const now = deps.now ?? new Date();

  const { data: company } = await db.from("acq_companies").select("id,name,domain,status,contacts_looked_up_at").eq("id", companyId).maybeSingle();
  if (!company || company.status === "archived") return { status: "company_not_found" };
  const domain = normalizeDomain(company.domain);
  if (!domain) return { status: "no_domain" };

  if (!deps.force && company.contacts_looked_up_at && now.getTime() - new Date(company.contacts_looked_up_at as string).getTime() < CACHE_DAYS * 86_400_000) {
    return { status: "cached", at: company.contacts_looked_up_at as string };
  }

  const cap = autoLimits().hunterLookups;
  const { count, error: ce } = await db
    .from("acq_audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("action", "contacts.lookup")
    .gte("created_at", sydneyDayStart(now).toISOString());
  if (ce) throw new Error(`lookup count: ${ce.message}`);
  if ((count ?? 0) >= cap) return { status: "cap_reached", cap };

  const result = await provider.domainSearch(domain, 10);
  const own = ownDomainOnly(result.emails, domain);
  const saved = await insertSuggestions(db, companyId, toSuggestions(own, domain));

  await db.from("acq_companies").update({ contacts_looked_up_at: now.toISOString() }).eq("id", companyId);
  await logAudit(db, "contacts.lookup", "company", companyId, { provider: provider.name, domain, found: own.length, saved }, deps.actor);

  let quotaNote: string | null = null;
  try {
    const acct = await provider.account();
    if (acct.searchesAvailable !== null && acct.searchesUsed !== null) quotaNote = `${acct.searchesUsed} of ${acct.searchesAvailable} monthly searches used (${acct.plan} plan).`;
  } catch {
    /* quota note is optional */
  }
  return { status: "ok", found: own.length, saved, quotaNote };
}
