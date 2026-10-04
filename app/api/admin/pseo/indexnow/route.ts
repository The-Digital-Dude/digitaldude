import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { submitToIndexNow } from "@/lib/pseo/indexNow";
import sitemap from "@/app/sitemap";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let urlsToSubmit: string[] = [];
    const body = await request.json().catch(() => ({}));

    // 1. If explicit custom URLs provided by user
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urlsToSubmit = body.urls;
    } else {
      // 2. Default: Fetch entire website sitemap (Services, Work, Blog, Industries, Careers, pSEO)
      const siteEntries = await sitemap();
      urlsToSubmit = siteEntries.map((entry) => entry.url);
    }

    const result = await submitToIndexNow(urlsToSubmit);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, count: 0, error: err.message || "Failed to submit URLs" },
      { status: 500 }
    );
  }
}
