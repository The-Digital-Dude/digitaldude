import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("1cd5f8140c4a4863a9eb25087fd2ddcb", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
