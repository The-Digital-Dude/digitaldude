import { NextResponse } from "next/server";
import { buildGoogleConsentUrl } from "@/lib/googleCalendar";

/**
 * One-time setup route: visit this in your own browser, logged into the
 * Google account whose calendar should receive bookings, to authorize
 * Google Calendar access. Gated by GOOGLE_OAUTH_SETUP_KEY so it can't be
 * triggered by a random visitor — it isn't linked anywhere in the site UI.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const setupKey = process.env.GOOGLE_OAUTH_SETUP_KEY;

  if (!setupKey || key !== setupKey) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const consentUrl = buildGoogleConsentUrl();
  if (!consentUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI first.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(consentUrl);
}
