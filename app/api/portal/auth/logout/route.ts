import { NextResponse } from "next/server";

const COOKIE_NAME = "tdd_client_session";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Logged out successfully" });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
