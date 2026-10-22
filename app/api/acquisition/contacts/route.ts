import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { contactInput } from "@/lib/acquisition/validation";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { verifyEmail } from "@/lib/acquisition/verify/email";

export const dynamic = "force-dynamic";

/** New contacts always start as needing review — they can't be eligible without a consent record. */
export const POST = adminRoute("create contact", async (request, { db }) => {
  const body = await parseBody(request, contactInput);
  if ("error" in body) return body.error;
  const c = body.data;

  const { data: company } = await db.from("acq_companies").select("id").eq("id", c.company_id).maybeSingle();
  if (!company) return jsonError("Company not found", 404);

  const check = await verifyEmail(db, c.email);
  if (check.status === "invalid") return jsonError(`That address cannot be added: ${check.reason}`, 422);

  const { data, error } = await db
    .from("acq_contacts")
    .insert({ company_id: c.company_id, name: c.name ?? null, role: c.role ?? null, email: c.email.trim(), source_url: c.source_url ?? null, source_type: c.source_type, status: "needs_review" })
    .select("id,status")
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return jsonError("A contact with this email already exists", 409);
    throw new Error(error.message);
  }
  await logAudit(db, "contact.created", "contact", data.id, { source_type: c.source_type, status: data.status });
  return NextResponse.json({ ok: true, id: data.id, status: data.status, emailCheck: { status: check.status, reason: check.reason } }, { status: 201 });
});
