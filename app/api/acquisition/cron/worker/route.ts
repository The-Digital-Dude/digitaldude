import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runWorkerTick } from "@/lib/acquisition/queue/worker";
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

/** Scheduled worker tick. Cron-secret only; fails closed if CRON_SECRET is unset. */
export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runWorkerTick()) });
  } catch (e) {
    log("error", { message: "acquisition worker tick failed", error: e });
    return NextResponse.json({ ok: false, error: "Worker failed" }, { status: 500 });
  }
}

export const GET = POST; // Vercel Cron issues GET
