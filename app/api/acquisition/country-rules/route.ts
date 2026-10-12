import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { countryRuleInput } from "@/lib/acquisition/validation";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { notify } from "@/lib/acquisition/providers/notifications";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list country rules", async (_req, { db }) => {
  const rules = must(await db.from("acq_country_rules").select("*").order("country"), "country rules");
  return NextResponse.json({ ok: true, rules });
});

/** Enable or block email outreach for a country. A country with no row, or email_allowed=false, is blocked. */
export const POST = adminRoute("save country rule", async (request, { db }) => {
  const body = await parseBody(request, countryRuleInput);
  if ("error" in body) return body.error;
  must(await db.from("acq_country_rules").upsert({ ...body.data, updated_at: new Date().toISOString() }).select("country"), "save country rule");
  await logAudit(db, body.data.email_allowed ? "country.enabled" : "country.blocked", "settings", null, { country: body.data.country });
  if (body.data.email_allowed) await notify(`Outreach to ${body.data.country} was ENABLED.`);
  return NextResponse.json({ ok: true });
});
