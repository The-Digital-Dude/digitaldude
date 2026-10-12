import { isValidEmail } from "../normalize";

/**
 * Pure mirror of the database rules (acq_contact_consent_ok + contact guard),
 * used to explain *why* a contact is or isn't eligible in the UI and at import.
 * The database remains the authority: it re-enforces these on every write.
 */

export type ConsentType = "express" | "inferred_publication" | "existing_relationship" | "unverified" | "withdrawn";

export interface ConsentRecord {
  consent_type: ConsentType;
  legal_basis: string | null;
  evidence_url: string | null;
  evidence_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | Date | null;
  expires_at: string | Date | null;
  created_at: string | Date;
}

export type ContactEligibilityStatus = "eligible" | "needs_review" | "blocked" | "suppressed";

export interface EligibilityResult {
  eligible: boolean;
  status: ContactEligibilityStatus;
  reasons: string[];
}

const GOOD_BASES: ConsentType[] = ["express", "inferred_publication", "existing_relationship"];
const NON_HUMAN = new Set(["ai", "model", "llm", "system", "worker"]);
const filled = (s: string | null | undefined) => !!s && s.trim() !== "";
const ts = (d: string | Date) => new Date(d).getTime();

export function latestConsent(records: ConsentRecord[]): ConsentRecord | undefined {
  return [...records].sort((a, b) => ts(b.created_at) - ts(a.created_at))[0];
}

export function evaluateEligibility(input: {
  email: string;
  consents: ConsentRecord[];
  suppressed: boolean;
  now?: Date;
}): EligibilityResult {
  const now = (input.now ?? new Date()).getTime();
  const reasons: string[] = [];

  if (input.suppressed) return { eligible: false, status: "suppressed", reasons: ["Address or domain is on the suppression list"] };
  if (!isValidEmail(input.email)) return { eligible: false, status: "blocked", reasons: ["Email address is not valid"] };

  const rec = latestConsent(input.consents);
  if (!rec) return { eligible: false, status: "needs_review", reasons: ["No consent basis recorded yet"] };

  if (rec.consent_type === "withdrawn") return { eligible: false, status: "blocked", reasons: ["Consent was withdrawn"] };
  if (rec.consent_type === "unverified" || !GOOD_BASES.includes(rec.consent_type)) {
    return { eligible: false, status: "blocked", reasons: ["Contact is unverified: no valid basis for marketing outreach"] };
  }

  if (!filled(rec.reviewed_by) || !rec.reviewed_at) reasons.push("Consent evidence has not been reviewed by a person");
  else if (NON_HUMAN.has(rec.reviewed_by!.trim().toLowerCase())) reasons.push("Consent must be reviewed by a person, not the system or AI");
  if (!filled(rec.legal_basis)) reasons.push("Legal basis / reasoning is missing");
  if (!filled(rec.evidence_url) && !filled(rec.evidence_notes)) reasons.push("No supporting evidence recorded");
  if (rec.consent_type === "inferred_publication" && !filled(rec.evidence_url)) {
    reasons.push("Inferred consent needs the URL of the page where the address was published");
  }
  if (rec.expires_at && ts(rec.expires_at) <= now) reasons.push("Consent record has expired");

  return reasons.length === 0
    ? { eligible: true, status: "eligible", reasons: [] }
    : { eligible: false, status: "needs_review", reasons };
}
