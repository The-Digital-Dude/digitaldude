import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { submitToGoogleIndexing, getGoogleQuotaStatus } from "@/lib/seo/googleIndexing";
import sitemap from "@/app/sitemap";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const quota = getGoogleQuotaStatus();
  return NextResponse.json({ ok: true, quota });
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    let urlsToSubmit: string[] = [];

    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urlsToSubmit = body.urls;
    } else {
      // Default: fetch sitemap URLs (capped at remaining quota)
      const siteEntries = await sitemap();
      const quota = getGoogleQuotaStatus();
      urlsToSubmit = siteEntries.slice(0, quota.remaining).map((e) => e.url);
    }

    const result = await submitToGoogleIndexing(urlsToSubmit, body.type || "URL_UPDATED");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, submitted: 0, failed: 0, error: err.message || "Google Indexing failed" },
      { status: 500 }
    );
  }
}
