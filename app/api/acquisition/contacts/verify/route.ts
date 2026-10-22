import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { verifyMany } from "@/lib/acquisition/verify/bulk";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ contactIds: z.array(z.string().uuid()).min(1).max(100), force: z.boolean().optional() });

/** Checks whether these contacts' email addresses can receive mail. Results are saved and shown next to each contact. */
export const POST = adminRoute("verify contact emails", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const { data } = await db.from("acq_contacts").select("id,email").in("id", parsed.data.contactIds);
  const rows = (data ?? []) as { id: string; email: string }[];
  const checks = await verifyMany(db, rows.map((r) => r.email), { force: parsed.data.force });
  const byEmail = new Map(checks.map((c) => [c.email, c]));
  const results = rows.map((r) => {
    const k = byEmail.get(r.email.trim().toLowerCase());
    return { contactId: r.id, email: r.email, status: k?.status ?? "unknown", reason: k?.reason ?? "Could not be checked right now.", source: k?.source ?? "builtin" };
  });
  const count = (s: string) => results.filter((r) => r.status === s).length;
  await logAudit(db, "contacts.verified", "contact", null, { checked: results.length, invalid: count("invalid"), risky: count("risky") });
  return NextResponse.json({ ok: true, results, safe: count("safe"), risky: count("risky"), invalid: count("invalid"), unknown: count("unknown") });
});
