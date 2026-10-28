import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/acquisition/db";
import { runInsights } from "@/lib/blog/insights";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Weekly blog check: reads Search Console, tracks indexing, adds topics, applies the safety brake. Cron-secret only; fails closed. */
export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const r = await runInsights(getDb());
    if ("skipped" in r) return NextResponse.json({ ok: true, skipped: r.skipped });
    return NextResponse.json({ ok: true, gsc: r.gsc, added: r.discovery.added.length, warnings: r.warnings.length, braked: r.brake.triggered });
  } catch (e) {
    log("error", { message: "blog insights cron failed", error: e });
    return NextResponse.json({ ok: false, error: "Blog insights failed" }, { status: 500 });
  }
}

export const POST = GET;
