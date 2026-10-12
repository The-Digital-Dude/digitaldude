import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

const body = z.object({ business: z.string().trim().min(1).max(200), postalAddress: z.string().trim().max(400) });

/** Business name + postal address shown in the footer of every rep email (sender identification). */
export const POST = adminRoute("save sender identity", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  must(await db.from("acq_settings").upsert({ key: "sender_identity", value: parsed.data }).select("key"), "save identity");
  await logAudit(db, "settings.sender_identity_saved", "settings", null, {});
  return NextResponse.json({ ok: true });
});
