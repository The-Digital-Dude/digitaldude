import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/clientAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientSession = await getAuthenticatedClient(request);
  if (!clientSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, client: clientSession });
}
