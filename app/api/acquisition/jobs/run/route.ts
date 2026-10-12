import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { runWorkerTick } from "@/lib/acquisition/queue/worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Run worker now" from the dashboard. */
export const POST = adminRoute("run worker", async (_req, { db }) => {
  return NextResponse.json({ ok: true, ...(await runWorkerTick({ db })) });
});
