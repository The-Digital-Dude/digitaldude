import { NextResponse } from "next/server";
import { processOutreachQueueBatch } from "@/lib/outreachDrip";

export const dynamic = "force-dynamic";

// Cron-secret only. This previously also accepted any authenticated rep or
// admin session, which meant the lowest-privilege role in the system (any
// single sales rep) could force-drain the entire platform's due-send queue
// — every rep's campaigns, not just their own — on demand and repeatedly,
// with no rate limit. Scheduling now happens via Supabase pg_cron calling
// this route with the secret (see supabase/migrations for the cron job),
// so there's no legitimate reason for a rep or admin session to hit it
// directly anymore.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuth = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  if (!isCronAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processOutreachQueueBatch(50);
    if (!result.success) {
      return NextResponse.json({ ok: false, ...result }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
