import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { CRM_SETTINGS_KEY, crmSettingsSchema, loadCrmSettings } from "@/lib/crm/settings";

export const dynamic = "force-dynamic";

export const GET = adminRoute("load crm settings", async (_request, { db }) => NextResponse.json({ ok: true, settings: await loadCrmSettings(db) }));

/** Stale-lead thresholds, stage win probabilities, the retention period (6 months or more) and the follow-up delay. */
export const PUT = adminRoute("save crm settings", async (request, { db }) => {
  const parsed = await parseBody(request, crmSettingsSchema);
  if ("error" in parsed) return parsed.error;
  if (parsed.data.probabilities.won !== 100 || parsed.data.probabilities.lost !== 0) return jsonError("Won is always 100% and lost is always 0%.", 422);
  must(await db.from("acq_settings").upsert({ key: CRM_SETTINGS_KEY, value: parsed.data }).select("key"), "save crm settings");
  await logAudit(db, "settings.crm_saved", "settings", null, {});
  return NextResponse.json({ ok: true, settings: parsed.data });
});
