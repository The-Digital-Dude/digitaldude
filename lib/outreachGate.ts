import type { SupabaseClient } from "@supabase/supabase-js";
import { createUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { unsubscribeSecret } from "@/lib/acquisition/env";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";
import { verifyEmail } from "@/lib/acquisition/verify/email";

type Db = SupabaseClient;

export class OutreachBlockedError extends Error {
  constructor(readonly reason: "suppressed" | "legacy_unsubscribed" | "pool_not_allowed" | "email_invalid" | "email_risky", message: string) {
    super(message);
    this.name = "OutreachBlockedError";
  }
}

/**
 * Single gate every rep email must pass (one-off sends and drip steps):
 * the shared suppression list (email AND whole-domain opt-outs) plus the legacy
 * rep_unsubscribes table. Fails closed: if either lookup errors, nothing is sent.
 */
export async function assertCanEmail(db: Db, email: string): Promise<void> {
  const clean = email.trim().toLowerCase();

  const sup = await db.rpc("acq_is_suppressed", { p_email: clean });
  if (sup.error) throw new Error(`suppression lookup failed: ${sup.error.message}`);
  if (sup.data === true) {
    throw new OutreachBlockedError("suppressed", `${clean} is on the do-not-contact list (unsubscribed, bounced or objected).`);
  }

  const legacy = await db.from("rep_unsubscribes").select("id").eq("email", clean).limit(1);
  if (legacy.error) throw new Error(`unsubscribe lookup failed: ${legacy.error.message}`);
  if ((legacy.data ?? []).length > 0) {
    throw new OutreachBlockedError("legacy_unsubscribed", `${clean} has unsubscribed and cannot be contacted.`);
  }
}

/**
 * Deliverability gate. An address that cannot receive mail (no such domain, disposable, no-reply) is never emailed; it would only
 * bounce and hurt the sender reputation. A "risky" address (likely typo, or a mail server that gave a risky answer) is blocked
 * unless the caller says the person has confirmed it (`allowRisky`). "Unknown" (a lookup hiccup) never blocks. The result is
 * cached for 30 days, so this is cheap on repeat sends.
 */
export async function assertEmailDeliverable(db: Db, email: string, opts: { allowRisky?: boolean } = {}): Promise<{ status: string; reason: string }> {
  const check = await verifyEmail(db, email);
  if (check.status === "invalid") throw new OutreachBlockedError("email_invalid", `${check.email} cannot be emailed: ${check.reason}`);
  if (check.status === "risky" && !opts.allowRisky) throw new OutreachBlockedError("email_risky", `${check.email} looks risky: ${check.reason}`);
  return { status: check.status, reason: check.reason };
}

const POOL_REASONS: Record<string, string> = {
  email_invalid: "This email address cannot receive mail (it would only bounce).",
  not_your_company: "This contact belongs to a company you do not own.",
  contact_not_eligible: "This contact has no valid recorded lawful basis yet.",
  consent_invalid: "The recorded lawful basis is missing, expired or withdrawn.",
  country_blocked: "Outreach to this company's country is not enabled. Ask the admin.",
  company_archived: "This company is archived.",
  company_closed: "This company was closed out as lost or dead. Reopen it before emailing.",
  company_has_active_contact: "Another person at this company is already being contacted. Wait for that conversation to finish (or 30 days) before emailing a colleague.",
  suppressed: "This address is on the do-not-contact list.",
};

/**
 * Extra rule for contacts that live in the lead pool: the rep must own the company, the contact must be
 * eligible with a valid recorded basis, and the company's country must be enabled. Addresses that are not
 * in the pool (a rep's own personal prospects) are unaffected.
 */
export async function assertPoolContactAllowed(db: Db, email: string, repId: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  const { data: contact, error } = await db.from("acq_contacts").select("id").eq("email_normalized", clean).maybeSingle();
  if (error) throw new Error(`pool contact lookup failed: ${error.message}`);
  if (!contact) return;
  const res = await db.rpc("acq_rep_can_email", { p_contact_id: contact.id, p_employee: repId });
  if (res.error) throw new Error(`pool gate failed: ${res.error.message}`);
  const row = (Array.isArray(res.data) ? res.data[0] : res.data) as { ok: boolean; reason: string | null } | undefined;
  if (!row?.ok) throw new OutreachBlockedError("pool_not_allowed", POOL_REASONS[row?.reason ?? ""] ?? "You are not cleared to email this contact.");
}

export interface SenderIdentity {
  business: string;
  postalAddress: string;
}

/** Company-level identity shown in every rep email footer (edited in admin settings). */
export async function loadSenderIdentity(db: Db): Promise<SenderIdentity> {
  const { data } = await db.from("acq_settings").select("value").eq("key", "sender_identity").maybeSingle();
  const v = (data?.value ?? {}) as Partial<SenderIdentity>;
  return { business: (v.business ?? "").trim() || "The Digital Dude", postalAddress: (v.postalAddress ?? "").trim() };
}

/**
 * Signed one-click unsubscribe link (the recipient's email is inside the HMAC-signed token).
 * Falls back to the legacy unsigned link only when ACQ_UNSUBSCRIBE_SECRET is not configured.
 */
export function repUnsubscribeUrl(email: string, leadId?: string | null): string {
  try {
    return `${SITE_URL}/outreach/unsubscribe?t=${encodeURIComponent(createUnsubscribeToken(email, unsubscribeSecret()))}`;
  } catch {
    log("warn", { message: "ACQ_UNSUBSCRIBE_SECRET not set: rep email is using the legacy unsigned unsubscribe link" });
    return `${SITE_URL}/outreach/unsubscribe?email=${encodeURIComponent(email)}${leadId ? `&lead_id=${leadId}` : ""}`;
  }
}

/** One-click (RFC 8058) POST target for the List-Unsubscribe header; same signed token as the page link. */
export function repUnsubscribeApiUrl(email: string): string | null {
  try {
    return `${SITE_URL}/api/outreach/unsubscribe?t=${encodeURIComponent(createUnsubscribeToken(email, unsubscribeSecret()))}`;
  } catch {
    return null;
  }
}

/** Plain-text version of the compliance footer (who sends, where, how to opt out). */
export function repFooterText(identity: SenderIdentity, unsubscribeUrl: string): string {
  return `${identity.business}${identity.postalAddress ? `, ${identity.postalAddress}` : ""}. If you would prefer not to receive further commercial emails from us, unsubscribe here: ${unsubscribeUrl}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Compliance footer: who is sending, where they are, and how to opt out. */
export function repFooterHtml(identity: SenderIdentity, unsubscribeUrl: string): string {
  return `
    <p style="margin: 0 0 4px 0;">${esc(identity.business)}${identity.postalAddress ? ` &middot; ${esc(identity.postalAddress)}` : ""}</p>
    <p style="margin: 0;">If you would prefer not to receive further commercial emails from us, <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">unsubscribe here</a> and we will stop immediately.</p>`;
}
