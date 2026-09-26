import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/googleCalendar";

/**
 * Receives the Google consent redirect, exchanges the code for tokens, and
 * shows the refresh token exactly once so it can be copied into
 * GOOGLE_OAUTH_REFRESH_TOKEN. Nothing is stored automatically — there's no
 * admin database for it, and printing it to logs would defeat the point of
 * keeping it secret.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(`Google returned an error: ${error}`, { status: 400 });
  }
  if (!code) {
    return new NextResponse("Missing authorization code.", { status: 400 });
  }

  const client = getGoogleOAuthClient();
  if (!client) {
    return new NextResponse(
      "Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI first.",
      { status: 500 }
    );
  }

  try {
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return new NextResponse(
        "Google didn't return a refresh token. This usually means you've already " +
          "authorized this app before. In Google Account settings, remove access for " +
          "this app under 'Third-party access', then try the setup link again.",
        { status: 400 }
      );
    }

    return new NextResponse(
      [
        "Google Calendar connected.",
        "",
        "Copy this value into GOOGLE_OAUTH_REFRESH_TOKEN in your .env.local (and in your",
        "hosting provider's environment variables for production), then restart the app:",
        "",
        tokens.refresh_token,
        "",
        "This page will not show this value again. Treat it like a password.",
      ].join("\n"),
      { status: 200, headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    return new NextResponse(`Failed to exchange authorization code: ${(err as Error).message}`, {
      status: 500,
    });
  }
}
