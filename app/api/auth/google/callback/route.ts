import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/googleCalendar";
import { OAUTH_STATE_COOKIE } from "../route";

/**
 * Receives the Google consent redirect, validates the state token, exchanges
 * the code for tokens, and shows the refresh token exactly once so it can be copied into
 * GOOGLE_OAUTH_REFRESH_TOKEN.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Validate state token against httpOnly cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${OAUTH_STATE_COOKIE}=([^;]*)`));
  const expectedState = match ? decodeURIComponent(match[1]) : null;

  if (!state || !expectedState || state !== expectedState) {
    return new NextResponse("Invalid or expired OAuth state parameter. Request rejected for security.", {
      status: 403,
    });
  }

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

    const response = new NextResponse(
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

    // Clear state cookie
    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return new NextResponse(`Failed to exchange authorization code: ${(err as Error).message}`, {
      status: 500,
    });
  }
}
