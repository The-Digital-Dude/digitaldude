import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";

export async function GET(request: Request) {
  const rep = await getAuthenticatedRep(request);
  if (!rep) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, rep });
}
