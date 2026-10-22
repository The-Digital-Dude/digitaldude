import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyEmail } from "@/lib/acquisition/verify/email";
import { COLLEAGUE_MESSAGE, isWorkedByColleague, ownDuplicate, prepareLeadUpdate, type ExistingLead, type LeadPatch } from "./leads";
import { recordStageChange, recordStatusChange, safely } from "./activity";
import { refreshScores } from "./refresh";

type Db = SupabaseClient;

export type EditResult =
  | { ok: true; lead: Record<string, unknown>; before: Record<string, unknown>; stageChanged: boolean }
  | { ok: false; status: number; error: string; colleague?: boolean };

/**
 * Applies an edit to a lead with every CRM rule, for both the rep (who may only touch their own leads, and cannot take an address a
 * colleague has) and the admin (who may edit any lead). The timeline, follow-on tasks and scores are updated here too.
 */
export async function editLead(db: Db, leadId: string, patch: LeadPatch, who: { actorId: string | null; scope: "rep" | "admin"; repId?: string }): Promise<EditResult> {
  let q = db.from("rep_leads").select("*").eq("id", leadId);
  if (who.scope === "rep") q = q.eq("employee_id", who.repId ?? "");
  const { data: existing } = await q.maybeSingle();
  if (!existing) return { ok: false, status: 404, error: "Lead not found" };
  if (existing.anonymized_at) return { ok: false, status: 409, error: "This lead's data has been erased and cannot be edited." };

  const prepared = prepareLeadUpdate(existing as ExistingLead, patch);
  if (prepared.error) return { ok: false, status: 422, error: prepared.error };

  if (prepared.emailChanged) {
    const next = String(prepared.update.email);
    const owner = String(existing.employee_id);
    if (await ownDuplicate(db, next, owner, leadId)) return { ok: false, status: 409, error: "Another of this owner's leads already has that email address." };
    if (await isWorkedByColleague(db, next, owner)) return { ok: false, status: 409, error: COLLEAGUE_MESSAGE, colleague: true };
    const check = await verifyEmail(db, next);
    if (check.status === "invalid") return { ok: false, status: 422, error: `That email address cannot be used: ${check.reason}` };
  }

  let upd = db.from("rep_leads").update(prepared.update).eq("id", leadId);
  if (who.scope === "rep") upd = upd.eq("employee_id", who.repId ?? "");
  const { data: updated, error } = await upd.select("*").single();
  if (error) return { ok: false, status: 500, error: error.message };

  if (prepared.stageChanged) await safely("stage change", () => recordStageChange(db, { leadId, from: String(existing.stage), to: String(updated.stage), actorId: who.actorId, reason: updated.lost_reason }));
  if (prepared.statusChanged) await safely("status change", () => recordStatusChange(db, { leadId, from: String(existing.status), to: String(updated.status), actorId: who.actorId }));
  await safely("refresh scores", () => refreshScores(db, [leadId]));
  return { ok: true, lead: updated, before: existing, stageChanged: prepared.stageChanged };
}
