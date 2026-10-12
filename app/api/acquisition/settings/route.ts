import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { settingsBody } from "@/lib/acquisition/validation";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { notify } from "@/lib/acquisition/providers/notifications";

export const dynamic = "force-dynamic";

/** Global emergency pause. Takes effect on the next send attempt (checked inside acq_reserve_send). */
export const POST = adminRoute("update settings", async (request, { db }) => {
  const body = await parseBody(request, settingsBody);
  if ("error" in body) return body.error;
  must(await db.from("acq_settings").upsert({ key: "sending_paused", value: body.data.sendingPaused }).select("key"), "save setting");
  await logAudit(db, body.data.sendingPaused ? "sending.paused" : "sending.resumed", "settings", null, {});
  if (body.data.sendingPaused) await notify("Acquisition sending PAUSED.");
  return NextResponse.json({ ok: true, sendingPaused: body.data.sendingPaused });
});
