import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { logAudit } from "@/lib/acquisition/audit";
import { loadReport, runInsights } from "@/lib/blog/insights";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = adminRoute("load blog insights", async (_request, { db }) => NextResponse.json({ ok: true, report: await loadReport(db) }));

/** Runs the weekly check now (reads Search Console, tracks indexing, adds topics, applies the safety brake). */
export const POST = adminRoute("run blog insights", async (_request, { db }) => {
  const r = await runInsights(db, { force: true });
  await logAudit(db, "blog.insights_run", "settings", null, { skipped: "skipped" in r ? r.skipped : null });
  if ("skipped" in r) return NextResponse.json({ ok: false, error: r.skipped }, { status: 500 });
  return NextResponse.json({ ok: true, report: r });
});
