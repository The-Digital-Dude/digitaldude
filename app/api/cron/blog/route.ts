import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/acquisition/db";
import { runBlogAutomation } from "@/lib/blog/automation";
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

/** Scheduled daily publish. Does nothing unless the automation is switched on and a post is due. Cron-secret only; fails closed. */
export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runBlogAutomation(getDb());
    return NextResponse.json({ ok: true, status: result.status, slug: result.slug ?? null, detail: result.detail });
  } catch (e) {
    log("error", { message: "blog cron failed", error: e });
    return NextResponse.json({ ok: false, error: "Blog automation failed" }, { status: 500 });
  }
}

export const POST = GET;
