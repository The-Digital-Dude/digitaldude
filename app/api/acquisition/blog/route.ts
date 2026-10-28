import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { aiStatus } from "@/lib/acquisition/ai-config";
import { isDue, loadState, saveState } from "@/lib/blog/automation";

export const dynamic = "force-dynamic";

export const GET = adminRoute("load blog automation", async (_request, { db }) => {
  const [state, ai] = await Promise.all([loadState(db), aiStatus(db)]);
  const due = isDue(state, new Date());
  return NextResponse.json({ ok: true, state, ai: { configured: ai.configured, model: ai.model }, nextRun: due });
});

const body = z.object({
  enabled: z.boolean().optional(),
  paused: z.boolean().optional(),
  weekdaysOnly: z.boolean().optional(),
  hourUtc: z.number().int().min(0).max(23).optional(),
});

/** Switch the automation on or off, pause it, or change when it publishes. */
export const PUT = adminRoute("save blog automation", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const state = await loadState(db);
  Object.assign(state, Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined)));
  await saveState(db, state);
  await logAudit(db, "blog.automation_saved", "settings", null, parsed.data);
  return NextResponse.json({ ok: true, state });
});
