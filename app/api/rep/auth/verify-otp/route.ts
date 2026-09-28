import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { signRepToken } from "@/lib/repAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";
import { recordRepAuditLog } from "@/lib/repAudit";

const COOKIE_NAME = "tdd_rep_session";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`rep_verify:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many verification attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "Email and verification code are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, email, full_name, role_title, status, auth_otp_code, auth_otp_expires_at, referral_code, assigned_outreach_email, currency")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error || !employee) {
      return NextResponse.json({ ok: false, error: "Invalid email or verification code." }, { status: 400 });
    }

    if (!employee.auth_otp_code || employee.auth_otp_code !== cleanCode) {
      return NextResponse.json({ ok: false, error: "Invalid verification code. Please check your email." }, { status: 400 });
    }

    if (!employee.auth_otp_expires_at || new Date(employee.auth_otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Clear used OTP code
    await supabase
      .from("employees")
      .update({
        auth_otp_code: null,
        auth_otp_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employee.id);

    const token = signRepToken(employee.id, employee.email);

    log("info", { message: "Rep logged in successfully", context: { email: cleanEmail, employeeId: employee.id } });

    // Record login in Rep Audit Logs
    await recordRepAuditLog({
      employeeId: employee.id,
      actionType: "login",
      description: `Sales Rep ${employee.full_name} logged in successfully via email OTP.`,
      targetIdentifier: employee.email,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      ok: true,
      rep: {
        id: employee.id,
        email: employee.email,
        full_name: employee.full_name,
        role_title: employee.role_title,
        referral_code: employee.referral_code,
        assigned_outreach_email: employee.assigned_outreach_email,
        currency: employee.currency,
        status: employee.status,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    log("error", { message: "Rep OTP verification error", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
