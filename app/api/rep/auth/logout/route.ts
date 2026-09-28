import { NextResponse } from "next/server";

const COOKIE_NAME = "tdd_rep_session";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Logged out successfully" });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
