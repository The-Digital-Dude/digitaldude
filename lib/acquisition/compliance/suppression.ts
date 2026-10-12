import { UNIQUE_VIOLATION, type Db } from "../db";
import { isFreeMailDomain, normalizeDomain, normalizeEmail } from "../normalize";

export type SuppressionReason = "unsubscribe" | "reply_opt_out" | "objection" | "hard_bounce" | "spam_complaint" | "manual";

/**
 * Adds an email to the permanent suppression list. Idempotent: a repeated opt-out
 * (double-click, webhook redelivery) succeeds. The database trigger immediately
 * cancels every pending message, job and sequence for that address.
 * There is deliberately no remove function — suppression records are append-only.
 */
export async function suppressEmail(db: Db, email: string, reason: SuppressionReason, source: string): Promise<void> {
  const { error } = await db.from("acq_suppressions").insert({ normalized_email: normalizeEmail(email), reason, source });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(`suppress email: ${error.message}`);
}

export async function suppressDomain(db: Db, domain: string, reason: SuppressionReason, source: string): Promise<void> {
  const d = normalizeDomain(domain);
  if (!d) throw new Error("Invalid domain");
  if (isFreeMailDomain(d)) throw new Error(`Refusing to suppress the whole of ${d}; suppress individual addresses instead`);
  const { error } = await db.from("acq_suppressions").insert({ company_domain: d, reason, source });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(`suppress domain: ${error.message}`);
}

export async function isSuppressed(db: Db, email: string): Promise<boolean> {
  const { data, error } = await db.rpc("acq_is_suppressed", { p_email: email });
  if (error) throw new Error(`suppression lookup: ${error.message}`);
  return data === true;
}

/**
 * The one entry point for handing a message to a provider. Runs the transactional
 * database gate (suppression, consent, approval hash, campaign state, daily cap,
 * global pause) and marks the message `sending` only if everything passes.
 */
export async function reserveSend(db: Db, messageId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data, error } = await db.rpc("acq_reserve_send", { p_message_id: messageId });
  if (error) throw new Error(`reserve send: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as { ok: boolean; reason: string | null } | undefined;
  return row?.ok ? { ok: true } : { ok: false, reason: row?.reason ?? "unknown" };
}
