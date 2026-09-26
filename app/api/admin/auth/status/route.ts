import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const authenticated = await isAdminAuthenticated(request);
  return NextResponse.json({ ok: true, authenticated });
}
