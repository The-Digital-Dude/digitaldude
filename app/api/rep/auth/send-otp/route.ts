import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { generate6DigitOtp, sendRepOtpEmail } from "@/lib/repAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`rep_otp:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if employee exists and is active
    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, full_name, email, status, role_title, referral_code")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error || !employee) {
      return NextResponse.json(
        { ok: false, error: "No active employee account found for this email address." },
        { status: 404 }
      );
    }

    if (employee.status === "offboarded") {
      return NextResponse.json(
        { ok: false, error: "This employee account is no longer active." },
        { status: 403 }
      );
    }

    // Role & Referral Code Authorization Gate
    const roleLower = (employee.role_title || "").toLowerCase();
    const isAllowedRole =
      roleLower.includes("sales") ||
      roleLower.includes("business dev") ||
      roleLower.includes("bde") ||
      roleLower.includes("marketing") ||
      roleLower.includes("outreach") ||
      roleLower.includes("growth") ||
      roleLower.includes("founder") ||
      roleLower.includes("executive") ||
      Boolean(employee.referral_code);

    if (!isAllowedRole) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Rep Portal access is reserved for Sales, Business Development, and Marketing representatives. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    const otpCode = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { error: updateError } = await supabase
      .from("employees")
      .update({
        auth_otp_code: otpCode,
        auth_otp_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employee.id);

    if (updateError) {
      log("error", { message: "Failed to persist OTP code", error: updateError });
      return NextResponse.json({ ok: false, error: "Could not generate login code." }, { status: 500 });
    }

    await sendRepOtpEmail({
      email: employee.email,
      fullName: employee.full_name,
      code: otpCode,
    });

    log("info", { message: "Rep OTP code dispatched", context: { email: cleanEmail, employeeId: employee.id } });

    return NextResponse.json({
      ok: true,
      message: `A 6-digit verification code was sent to ${cleanEmail}`,
      email: cleanEmail,
    });
  } catch (error) {
    log("error", { message: "Rep OTP request failed", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
