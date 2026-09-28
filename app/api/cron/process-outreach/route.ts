import { NextResponse } from "next/server";
import { processOutreachQueueBatch } from "@/lib/outreachDrip";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Allow Cron header, rep auth, or admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  let isAuthorized = isCronAuth;

  if (!isAuthorized) {
    const isRep = await getAuthenticatedRep(request);
    if (isRep) isAuthorized = true;
  }

  if (!isAuthorized) {
    const isAdmin = await isAdminAuthenticated(request);
    if (isAdmin) isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processOutreachQueueBatch(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
