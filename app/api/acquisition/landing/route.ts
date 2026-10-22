import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { LANDING_KEY, landingSchema, loadLanding } from "@/lib/landing";

export const dynamic = "force-dynamic";

export const GET = adminRoute("load landing content", async (_request, { db }) => NextResponse.json({ ok: true, content: await loadLanding(db) }));

/** Saves the booking page content. Everything is plain text; images must be https; colours must be hex; lengths are capped. */
export const PUT = adminRoute("save landing content", async (request, { db }) => {
  const parsed = await parseBody(request, landingSchema);
  if ("error" in parsed) return parsed.error;
  must(await db.from("acq_settings").upsert({ key: LANDING_KEY, value: parsed.data }).select("key"), "save landing");
  await logAudit(db, "settings.landing_saved", "settings", null, { industries: Object.keys(parsed.data.industries).length });
  return NextResponse.json({ ok: true });
});

export const DELETE = adminRoute("reset landing content", async (_request, { db }) => {
  const { error } = await db.from("acq_settings").delete().eq("key", LANDING_KEY);
  if (error) return jsonError("Could not reset", 500);
  await logAudit(db, "settings.landing_reset", "settings", null, {});
  return NextResponse.json({ ok: true });
});
