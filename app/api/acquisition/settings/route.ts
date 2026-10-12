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
  const { sendingPaused, autoResearchEnabled } = body.data;
  if (sendingPaused !== undefined) {
    must(await db.from("acq_settings").upsert({ key: "sending_paused", value: sendingPaused }).select("key"), "save setting");
    await logAudit(db, sendingPaused ? "sending.paused" : "sending.resumed", "settings", null, {});
    if (sendingPaused) await notify("Acquisition sending PAUSED.");
  }
  if (autoResearchEnabled !== undefined) {
    must(await db.from("acq_settings").upsert({ key: "auto_research_enabled", value: autoResearchEnabled }).select("key"), "save setting");
    await logAudit(db, autoResearchEnabled ? "autoresearch.enabled" : "autoresearch.disabled", "settings", null, {});
  }
  return NextResponse.json({ ok: true, sendingPaused, autoResearchEnabled });
});
