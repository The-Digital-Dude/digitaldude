import { NextResponse } from "next/server";
import { z } from "zod";
import { repActor, repJsonError, repRoute } from "@/lib/repPool";
import { logAudit } from "@/lib/acquisition/audit";
import { must } from "@/lib/acquisition/db";
import { FIND_MESSAGES, findContactsForCompany } from "@/lib/acquisition/contacts/find";
import { ContactFinderHttpError } from "@/lib/acquisition/providers/contacts";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** One bulk "find contacts" click is capped so it cannot drain the contact-finder credits. */
const MAX_FIND_PER_CLICK = 10;
const STATUSES = ["assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"] as const;

const ids = z.array(z.string().uuid()).min(1).max(100);
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("find_contacts"), companyIds: ids }),
  z.object({ action: z.literal("set_status"), companyIds: ids, poolStatus: z.enum(STATUSES) }),
  z.object({ action: z.literal("release"), companyIds: ids }),
]);

/** Bulk actions on the rep's OWN companies. Anything not owned by the rep is silently left out. */
export const POST = repRoute("rep pool bulk", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);
  const b = parsed.data;

  const { data: owned } = await db.from("acq_companies").select("id").in("id", b.companyIds).eq("owner_employee_id", rep.id).neq("status", "archived");
  const mine = ((owned ?? []) as { id: string }[]).map((c) => c.id);
  if (mine.length === 0) return repJsonError("None of the selected companies are yours", 404);

  if (b.action === "find_contacts") {
    if (mine.length > MAX_FIND_PER_CLICK) return repJsonError(`Select at most ${MAX_FIND_PER_CLICK} companies for one contact search.`, 422);
    for (let i = 0; i < mine.length; i++) {
      if (!rateLimit(`rep_find_contacts:${rep.id}`, 30, 60 * 60 * 1000).ok) return repJsonError("Too many lookups this hour. Please slow down.", 429);
    }
    const summary = { searched: 0, suggestions: 0, skipped: 0, stopped: null as string | null };
    for (const id of mine) {
      try {
        const r = await findContactsForCompany(db, id, { actor: repActor(rep) });
        if (r.status === "ok") {
          summary.searched++;
          summary.suggestions += r.saved;
        } else if (r.status === "cap_reached" || r.status === "not_configured") {
          summary.stopped = FIND_MESSAGES[r.status];
          break;
        } else summary.skipped++; // cached, no website, etc.
      } catch (e) {
        if (e instanceof ContactFinderHttpError) {
          summary.stopped = "The contact finder is unavailable right now. Try again later.";
          break;
        }
        throw e;
      }
    }
    return NextResponse.json({ ok: true, ...summary });
  }

  if (b.action === "set_status") {
    const rows = must(await db.from("acq_companies").update({ pool_status: b.poolStatus }).in("id", mine).eq("owner_employee_id", rep.id).select("id"), "set status");
    await logAudit(db, "rep.bulk_status", "pool", null, { count: rows.length, status: b.poolStatus }, repActor(rep));
    return NextResponse.json({ ok: true, changed: rows.length });
  }

  const n = must(await db.rpc("acq_assign_companies", { p_company_ids: mine, p_employee: null, p_actor: repActor(rep), p_source: "admin" }), "release") as unknown as number;
  await logAudit(db, "rep.bulk_released", "pool", null, { count: n }, repActor(rep));
  return NextResponse.json({ ok: true, changed: n });
});
