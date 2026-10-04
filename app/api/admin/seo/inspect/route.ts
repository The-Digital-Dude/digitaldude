import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { inspectGoogleUrl } from "@/lib/seo/googleIndexing";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json({ ok: false, error: "Missing url to inspect" }, { status: 400 });
    }

    const result = await inspectGoogleUrl(url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Google Inspection failed" },
      { status: 500 }
    );
  }
}
