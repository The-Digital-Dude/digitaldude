import type { Db } from "../db";
import { verifyEmail } from "../verify/email";

export interface SuggestionInput {
  email: string;
  source_url: string;
  evidence_excerpt: string;
  name?: string | null;
  role?: string | null;
  origin: "website" | "hunter";
  confidence?: number | null;
}

/**
 * Stores addresses as inert SUGGESTIONS. Skips addresses that are already contacts or suppressed, and ones already
 * suggested for the company. A person must accept a suggestion for it to become a contact, and the lawful-basis
 * gate still applies after that.
 */
export async function insertSuggestions(db: Db, companyId: string, items: SuggestionInput[]): Promise<number> {
  const unique = new Map<string, SuggestionInput>();
  for (const it of items) {
    const email = it.email.trim().toLowerCase();
    if (!unique.has(email)) unique.set(email, { ...it, email });
  }
  let saved = 0;
  for (const s of unique.values()) {
    const { data: existing } = await db.from("acq_contacts").select("id").eq("email_normalized", s.email).maybeSingle();
    if (existing) continue;
    const { data: suppressed, error: se } = await db.rpc("acq_is_suppressed", { p_email: s.email });
    if (se) throw new Error(`suppression lookup: ${se.message}`);
    if (suppressed === true) continue;
    // An address that cannot receive mail (no such domain, disposable, no-reply) is not worth anyone's time.
    if ((await verifyEmail(db, s.email).catch(() => null))?.status === "invalid") continue;
    const ins = await db.from("acq_contact_suggestions").insert({
      company_id: companyId, email: s.email, name: s.name ?? null, role: s.role ?? null, source_url: s.source_url,
      evidence_excerpt: s.evidence_excerpt, origin: s.origin, confidence: s.confidence ?? null,
    });
    if (ins.error && ins.error.code !== "23505") throw new Error(`save suggestion: ${ins.error.message}`);
    if (!ins.error) saved++;
  }
  return saved;
}
