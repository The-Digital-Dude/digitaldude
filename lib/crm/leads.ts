import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { currencyFor, type leadPatchSchema } from "./model";

type Db = SupabaseClient;
export type LeadPatch = z.infer<typeof leadPatchSchema>;

export interface ExistingLead {
  stage: string;
  status: string;
  email: string;
  lost_reason?: string | null;
  country?: string | null;
  currency?: string | null;
}

export interface PreparedUpdate {
  update: Record<string, unknown>;
  error?: string;
  stageChanged: boolean;
  statusChanged: boolean;
  emailChanged: boolean;
}

const blankToNull = (v: string | null | undefined) => {
  const t = typeof v === "string" ? v.trim() : v;
  return t ? t : null;
};

/**
 * Turns an already-validated edit into the database update, applying the CRM rules in one place (used by the rep and the admin):
 * a lead cannot be lost without a reason, leaving "lost" clears the reason, the currency follows a newly set country unless chosen, and
 * the email is always stored lower-case.
 */
export function prepareLeadUpdate(existing: ExistingLead, patch: LeadPatch, now = new Date()): PreparedUpdate {
  const update: Record<string, unknown> = { updated_at: now.toISOString() };
  const nextStage = patch.stage ?? existing.stage;
  const stageChanged = nextStage !== existing.stage;
  const statusChanged = patch.status !== undefined && patch.status !== existing.status;

  if (nextStage === "lost") {
    const reason = patch.lost_reason ?? existing.lost_reason ?? null;
    // Only closing a deal needs a reason: an older lost lead that has none can still have its contact details corrected.
    if (stageChanged && !reason) return { update, error: "Choose why this deal was lost before closing it.", stageChanged, statusChanged, emailChanged: false };
    if (reason) update.lost_reason = reason;
    if (patch.lost_note !== undefined) update.lost_note = blankToNull(patch.lost_note);
  } else if (stageChanged && existing.stage === "lost") {
    update.lost_reason = null;
    update.lost_note = null;
  } else if (patch.status === "unqualified" || existing.status === "unqualified") {
    // Unqualified leads must be allowed to record their disqualification reason in lost_note
    if (patch.lost_reason !== undefined) update.lost_reason = patch.lost_reason;
    if (patch.lost_note !== undefined) update.lost_note = blankToNull(patch.lost_note);
  } else if (patch.lost_reason !== undefined || patch.lost_note !== undefined) {
    return { update, error: "A lost reason only applies to a lost deal or an unqualified lead.", stageChanged, statusChanged, emailChanged: false };
  }

  if (patch.stage !== undefined) update.stage = patch.stage;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.full_name !== undefined) update.full_name = patch.full_name.trim();
  if (patch.phone !== undefined) update.phone = blankToNull(patch.phone);
  if (patch.company_name !== undefined) update.company_name = blankToNull(patch.company_name);
  if (patch.job_title !== undefined) update.job_title = blankToNull(patch.job_title);
  if (patch.notes !== undefined) update.notes = blankToNull(patch.notes);
  if (patch.estimated_deal_value !== undefined) update.estimated_deal_value = patch.estimated_deal_value;
  if (patch.expected_close_date !== undefined) update.expected_close_date = patch.expected_close_date;
  if (patch.probability !== undefined) update.probability = patch.probability;
  if (patch.tags !== undefined) update.tags = [...new Set(patch.tags)];
  if (patch.country !== undefined) {
    update.country = patch.country;
    if (patch.currency === undefined && patch.country) update.currency = currencyFor(patch.country, existing.currency ?? undefined);
  }
  if (patch.currency !== undefined) update.currency = patch.currency;

  let emailChanged = false;
  if (patch.email !== undefined) {
    const next = patch.email.trim().toLowerCase();
    emailChanged = next !== existing.email.trim().toLowerCase();
    update.email = next;
  }
  return { update, stageChanged, statusChanged, emailChanged };
}

/** Is this address already a lead of a different rep? Only a yes/no is returned: reps are never told who. */
export async function isWorkedByColleague(db: Db, email: string, ownRepId: string): Promise<boolean> {
  const { data } = await db.from("rep_leads").select("id").eq("email", email.trim().toLowerCase()).neq("employee_id", ownRepId).is("anonymized_at", null).limit(1);
  return !!data && data.length > 0;
}

export const COLLEAGUE_MESSAGE = "This contact is already being worked by a colleague, so it cannot be added again.";

/** Leads of this rep with the same address (any case), other than `exceptId`. */
export async function ownDuplicate(db: Db, email: string, repId: string, exceptId?: string): Promise<{ id: string; full_name: string } | null> {
  let q = db.from("rep_leads").select("id,full_name").eq("employee_id", repId).eq("email", email.trim().toLowerCase()).is("anonymized_at", null).limit(1);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q;
  return (data?.[0] as { id: string; full_name: string } | undefined) ?? null;
}
