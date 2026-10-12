import { NextResponse } from "next/server";
import { ownedCompany, repActor, repJsonError, repRoute } from "@/lib/repPool";
import { FIND_MESSAGES, findContactsForCompany } from "@/lib/acquisition/contacts/find";
import { ContactFinderHttpError } from "@/lib/acquisition/providers/contacts";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** A rep asks the contact finder about one of their own companies. Results are suggestions the rep must still review. */
export const POST = repRoute<{ id: string }>("rep find contacts", async (_request, { rep, db, params }) => {
  if (!rateLimit(`rep_find_contacts:${rep.id}`, 30, 60 * 60 * 1000).ok) return repJsonError("Too many lookups this hour. Please slow down.", 429);
  const company = await ownedCompany(db, rep.id, params.id);
  if (!company) return repJsonError("Company not found", 404);
  try {
    const r = await findContactsForCompany(db, company.id, { actor: repActor(rep) });
    if (r.status !== "ok") return repJsonError(FIND_MESSAGES[r.status] ?? "Could not search", 409, { reason: r.status });
    return NextResponse.json({ ok: true, found: r.found, saved: r.saved, message: `${r.found} address${r.found === 1 ? "" : "es"} found on this company's domain, ${r.saved} new suggestion${r.saved === 1 ? "" : "s"}.` });
  } catch (e) {
    if (e instanceof ContactFinderHttpError) return repJsonError("The contact finder is unavailable right now. Try again later.", 502);
    throw e;
  }
});
