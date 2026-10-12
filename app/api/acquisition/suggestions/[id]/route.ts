import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { suggestionBody } from "@/lib/acquisition/validation";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/**
 * Accept or dismiss an AI-found address suggestion. Accepting creates an ordinary contact in
 * `needs_review`: it still has no consent record, so it cannot join a campaign or be emailed
 * until a person records a consent review.
 */
export const PATCH = adminRoute<{ id: string }>("review suggestion", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, suggestionBody);
  if ("error" in body) return body.error;

  const { data: s } = await db.from("acq_contact_suggestions").select("*").eq("id", params.id).maybeSingle();
  if (!s) return jsonError("Suggestion not found", 404);
  if (s.status !== "pending") return jsonError("Suggestion was already reviewed", 409);

  if (body.data.action === "dismiss") {
    await db.from("acq_contact_suggestions").update({ status: "dismissed" }).eq("id", s.id);
    await logAudit(db, "suggestion.dismissed", "company", s.company_id, { email: s.email });
    return NextResponse.json({ ok: true, status: "dismissed" });
  }

  const { data: contact, error } = await db
    .from("acq_contacts")
    .insert({ company_id: s.company_id, email: s.email, role: s.role, source_url: s.source_url, source_type: "company_website", status: "needs_review" })
    .select("id")
    .single();
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
  await db.from("acq_contact_suggestions").update({ status: "accepted" }).eq("id", s.id);
  await logAudit(db, "suggestion.accepted", "company", s.company_id, { email: s.email, contactId: contact?.id ?? null });
  return NextResponse.json({ ok: true, status: "accepted", contactId: contact?.id ?? null, alreadyContact: !!error });
});
