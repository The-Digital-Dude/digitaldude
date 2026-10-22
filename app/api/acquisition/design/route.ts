import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { brandSchema } from "@/lib/emailDesign";
import { loadBrand, BRAND_KEY } from "@/lib/repEmail";

export const dynamic = "force-dynamic";

export const GET = adminRoute("load email design", async (_request, { db }) => NextResponse.json({ ok: true, brand: await loadBrand(db) }));

/** Saves the email "Look and feel". Validated field by field: bad colours, non-https logos and unknown fonts are refused. */
export const PUT = adminRoute("save email design", async (request, { db }) => {
  const parsed = await parseBody(request, brandSchema);
  if ("error" in parsed) return parsed.error;
  must(await db.from("acq_settings").upsert({ key: BRAND_KEY, value: parsed.data }).select("key"), "save design");
  await logAudit(db, "settings.email_design_saved", "settings", null, {});
  return NextResponse.json({ ok: true, brand: parsed.data });
});

export const DELETE = adminRoute("reset email design", async (_request, { db }) => {
  const { error } = await db.from("acq_settings").delete().eq("key", BRAND_KEY);
  if (error) return jsonError("Could not reset", 500);
  await logAudit(db, "settings.email_design_reset", "settings", null, {});
  return NextResponse.json({ ok: true });
});
