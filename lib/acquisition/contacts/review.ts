import { UNIQUE_VIOLATION, type Db } from "../db";
import { logAudit } from "../audit";
import { ensureRepLead } from "@/lib/repPool";
import { verifyEmail } from "../verify/email";

export interface SuggestionReview {
  id: string;
  status: "accepted" | "dismissed" | "skipped";
  contactId?: string | null;
  note?: string;
}

/**
 * Accepts or dismisses pending address suggestions. Accepting only creates a `needs_review` contact (no consent
 * record, so it still cannot be emailed). If a rep owns the company, the contact also lands in that rep's Leads CRM
 * straight away, marked as needing a lawful basis. Suppressed addresses are dismissed instead of accepted.
 */
export async function reviewSuggestions(db: Db, ids: string[], action: "accept" | "dismiss", actor: string): Promise<SuggestionReview[]> {
  const out: SuggestionReview[] = [];
  for (const id of ids) {
    const { data: s } = await db.from("acq_contact_suggestions").select("*, acq_companies(name,owner_employee_id,status)").eq("id", id).maybeSingle();
    if (!s) {
      out.push({ id, status: "skipped", note: "not found" });
      continue;
    }
    if (s.status !== "pending") {
      out.push({ id, status: "skipped", note: "already reviewed" });
      continue;
    }
    if (action === "dismiss") {
      await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", id);
      await logAudit(db, "suggestion.dismissed", "company", s.company_id, { email: s.email }, actor);
      out.push({ id, status: "dismissed" });
      continue;
    }

    const sup = await db.rpc("acq_is_suppressed", { p_email: s.email });
    if (sup.data === true) {
      await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", id);
      out.push({ id, status: "dismissed", note: "on the do-not-contact list" });
      continue;
    }
    const check = await verifyEmail(db, s.email).catch(() => null);
    if (check?.status === "invalid") {
      await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", id);
      out.push({ id, status: "dismissed", note: `cannot receive mail: ${check.reason}` });
      continue;
    }
    const ins = await db
      .from("acq_contacts")
      .insert({ company_id: s.company_id, email: s.email, name: s.name ?? null, role: s.role ?? null, source_url: s.source_url, source_type: "company_website", status: "needs_review" })
      .select("id,email,name,role")
      .single();
    if (ins.error && ins.error.code !== UNIQUE_VIOLATION) throw new Error(ins.error.message);
    await db.from("acq_contact_suggestions").update({ status: "accepted" }).eq("id", id);
    await logAudit(db, "suggestion.accepted", "company", s.company_id, { email: s.email, contactId: ins.data?.id ?? null }, actor);

    const co = s.acq_companies as { name: string; owner_employee_id: string | null; status: string } | null;
    if (ins.data && co?.owner_employee_id && co.status !== "archived") await ensureRepLead(db, { id: co.owner_employee_id }, ins.data, co.name);
    out.push({ id, status: "accepted", contactId: ins.data?.id ?? null });
  }
  return out;
}
