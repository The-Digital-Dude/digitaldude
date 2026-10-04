import { NextResponse } from "next/server";
import { INDEXNOW_KEY } from "@/lib/pseo/indexNow";

export async function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
