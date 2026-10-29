import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { DAY_MS, SEND_LIMITS_KEY, effectiveLimits, limitRowFrom, limitSettingsSchema, loadLimitSettings, sentLast24h } from "@/lib/crm/sendLimits";

export const dynamic = "force-dynamic";

/** Every rep's limits, today's effective limits, what they have sent, plus the team total against the ceiling. */
export const GET = adminRoute("load sending limits", async (_request, { db }) => {
  const now = new Date();
  const [settings, emps, usage, due, acq] = await Promise.all([
    loadLimitSettings(db),
    db.from("employees").select("*").neq("status", "offboarded").order("full_name"),
    sentLast24h(db, now),
    db.from("rep_lead_tasks").select("employee_id").eq("status", "open").eq("kind", "follow_up").lte("due_at", now.toISOString()).limit(5000),
    db.from("acq_email_messages").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", new Date(now.getTime() - DAY_MS).toISOString()),
  ]);
  const dueBy = new Map<string, number>();
  for (const t of (due.data ?? []) as { employee_id: string }[]) dueBy.set(t.employee_id, (dueBy.get(t.employee_id) ?? 0) + 1);

  const reps = ((emps.data ?? []) as { id: string; full_name: string; status: string; email: string | null }[]).map((e) => {
    const row = limitRowFrom(e as never);
    const eff = effectiveLimits(row, settings, now);
    const sent = usage.get(e.id) ?? { cold: 0, followUp: 0 };
    return { id: e.id, name: e.full_name, status: e.status, ...row, effective: eff, sent, dueFollowUps: dueBy.get(e.id) ?? 0 };
  });

  const repSent24h = reps.reduce((n, r) => n + r.sent.cold + r.sent.followUp, 0);
  const allocated = reps.filter((r) => r.status === "active").reduce((n, r) => n + r.effective.cold + r.effective.followUp, 0);
  return NextResponse.json({
    ok: true,
    settings,
    reps,
    team: { ceiling: settings.teamCeiling, allocated, sent24h: repSent24h + (acq.count ?? 0), acquisitionSent24h: acq.count ?? 0 },
    migrated: reps.length === 0 || (emps.data ?? []).some((e: Record<string, unknown>) => "limit_warmup" in e),
  });
});

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settings"), settings: limitSettingsSchema }),
  z.object({
    action: z.literal("rep"),
    employeeId: z.string().uuid(),
    coldMax: z.number().int().min(0).max(500),
    followUpMax: z.number().int().min(0).max(500),
    warmup: z.boolean(),
    restartWarmup: z.boolean().optional(),
  }),
]);

export const PUT = adminRoute("save sending limits", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;

  if (b.action === "settings") {
    const { error } = await db.from("acq_settings").upsert({ key: SEND_LIMITS_KEY, value: b.settings });
    if (error) return jsonError(error.message, 500);
    await logAudit(db, "limits.settings_saved", "settings", null, b.settings);
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = { daily_outreach_limit: b.coldMax, followup_daily_limit: b.followUpMax, limit_warmup: b.warmup };
  if (b.restartWarmup) patch.limit_started_at = new Date().toISOString();
  const { error } = await db.from("employees").update(patch).eq("id", b.employeeId);
  if (error) {
    return jsonError(/followup_daily_limit|limit_warmup|limit_started_at/.test(error.message) ? "Run migration 0043 in the Supabase SQL editor first, then save again." : error.message, 409);
  }
  await logAudit(db, "limits.rep_saved", "employee", b.employeeId, { coldMax: b.coldMax, followUpMax: b.followUpMax, warmup: b.warmup, restartWarmup: !!b.restartWarmup });
  return NextResponse.json({ ok: true });
});
