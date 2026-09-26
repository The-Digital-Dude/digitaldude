import { NextResponse } from "next/server";
import { validateAdminPassword, attachAdminSessionCookie } from "@/lib/adminAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Rate limit: 5 attempts per 15 minutes per IP
  const rl = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    log("warn", { message: "Admin login rate limit exceeded", context: { ip } });
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || !validateAdminPassword(password)) {
      log("warn", { message: "Invalid admin login attempt", context: { ip } });
      return NextResponse.json(
        { ok: false, error: "Invalid password." },
        { status: 401 }
      );
    }

    log("info", { message: "Admin logged in successfully", context: { ip } });
    const response = NextResponse.json({ ok: true, message: "Logged in successfully" });
    return await attachAdminSessionCookie(response);
  } catch {
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
