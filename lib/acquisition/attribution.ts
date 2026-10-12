import type { Db } from "./db";
import { normalizeEmail } from "./normalize";

export interface PoolOwner {
  employeeId: string;
  employeeName: string;
  companyId: string;
  companyName: string;
}

/**
 * If this email address belongs to a contact at a lead-pool company that a (still active) rep owns, returns that
 * rep. Used so a booking from a prospect the rep worked is credited to them even without their referral link.
 * Exact email match only: guessing by company domain could credit the wrong person's commission.
 */
export async function findPoolOwnerForEmail(db: Db, email: string): Promise<PoolOwner | null> {
  const clean = normalizeEmail(email);
  const { data: contact, error } = await db.from("acq_contacts").select("company_id").eq("email_normalized", clean).maybeSingle();
  if (error) throw new Error(`attribution contact lookup: ${error.message}`);
  if (!contact?.company_id) return null;

  const { data: company } = await db.from("acq_companies").select("id,name,owner_employee_id,status").eq("id", contact.company_id).maybeSingle();
  if (!company?.owner_employee_id || company.status === "archived") return null;

  const { data: rep } = await db.from("employees").select("id,full_name,status").eq("id", company.owner_employee_id).maybeSingle();
  if (!rep || rep.status === "offboarded") return null;
  return { employeeId: rep.id as string, employeeName: rep.full_name as string, companyId: company.id as string, companyName: company.name as string };
}

/** A booked meeting moves the company on to "meeting" (only from the earlier working stages; never overwrites won/lost/dead). */
export async function markPoolMeeting(db: Db, companyId: string, ownerId: string): Promise<void> {
  const { error } = await db
    .from("acq_companies")
    .update({ pool_status: "meeting" })
    .eq("id", companyId)
    .eq("owner_employee_id", ownerId)
    .in("pool_status", ["assigned", "needs_contact", "contacted", "replied"]);
  if (error) throw new Error(`mark pool meeting: ${error.message}`);
}
