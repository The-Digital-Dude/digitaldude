import type { SupabaseClient } from "@supabase/supabase-js";
import { createUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { unsubscribeSecret } from "@/lib/acquisition/env";
import { SITE_URL } from "@/lib/utils";
import { log } from "@/lib/logger";

type Db = SupabaseClient;

export class OutreachBlockedError extends Error {
  constructor(readonly reason: "suppressed" | "legacy_unsubscribed", message: string) {
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Compliance footer: who is sending, where they are, and how to opt out. */
export function repFooterHtml(identity: SenderIdentity, unsubscribeUrl: string): string {
  return `
    <p style="margin: 0 0 4px 0;">${esc(identity.business)}${identity.postalAddress ? ` &middot; ${esc(identity.postalAddress)}` : ""}</p>
    <p style="margin: 0;">If you would prefer not to receive further commercial emails from us, <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">unsubscribe here</a> and we will stop immediately.</p>`;
}
