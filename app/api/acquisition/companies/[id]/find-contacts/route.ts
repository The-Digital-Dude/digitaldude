import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError } from "@/lib/acquisition/http";
import { acqEnv } from "@/lib/acquisition/env";
import { FIND_MESSAGES, findContactsForCompany } from "@/lib/acquisition/contacts/find";
import { ContactFinderHttpError } from "@/lib/acquisition/providers/contacts";

export const dynamic = "force-dynamic";

/** Look up published business addresses for a company (admin). Results become suggestions only. */
export const POST = adminRoute<{ id: string }>("find contacts", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const force = Boolean((await request.json().catch(() => ({})))?.force);
  try {
    const r = await findContactsForCompany(db, params.id, { force, actor: acqEnv().operatorName });
    if (r.status !== "ok") return jsonError(FIND_MESSAGES[r.status] ?? "Could not search", r.status === "company_not_found" ? 404 : 409, { reason: r.status });
    return NextResponse.json({ ok: true, found: r.found, saved: r.saved, message: `${r.found} address${r.found === 1 ? "" : "es"} found on this company's domain, ${r.saved} new suggestion${r.saved === 1 ? "" : "s"}.${r.quotaNote ? ` ${r.quotaNote}` : ""}` });
  } catch (e) {
    if (e instanceof ContactFinderHttpError) return jsonError(e.status === 429 ? "The contact finder's quota is used up right now." : e.status === 401 || e.status === 403 ? "The contact finder rejected the saved key." : "The contact finder returned an error. Try again later.", 502);
    throw e;
  }
});
