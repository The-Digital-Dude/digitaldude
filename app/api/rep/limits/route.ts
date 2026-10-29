import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { repCapacity } from "@/lib/crm/sendLimits";

export const dynamic = "force-dynamic";

/** The signed-in rep's sending limits today (cold and follow-up) and how much of each they have used. */
export async function GET(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const db = getSupabaseServerClient();
    if (!db) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    return NextResponse.json({ ok: true, capacity: await repCapacity(db, rep.id) });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
