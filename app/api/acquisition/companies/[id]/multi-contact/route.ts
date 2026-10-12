import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

const body = z.object({ allow: z.boolean() });

/**
 * Admin only: lets a specific company have more than one contact emailed at the same time (the default rule blocks a
 * second contact while a colleague's conversation is live). Reps cannot change this; every change is audited.
 */
export const PATCH = adminRoute<{ id: string }>("allow multiple contacts", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const rows = must(await db.from("acq_companies").update({ allow_multiple_contacts: parsed.data.allow }).eq("id", params.id).select("id"), "update company");
  if (!rows.length) return jsonError("Company not found", 404);
  await logAudit(db, parsed.data.allow ? "company.multi_contact_allowed" : "company.multi_contact_blocked", "company", params.id, {});
  return NextResponse.json({ ok: true, allow: parsed.data.allow });
});
