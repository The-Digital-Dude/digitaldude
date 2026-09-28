import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { signClientToken } from "@/lib/clientAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

const COOKIE_NAME = "tdd_client_session";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`client_verify:${ip}`, 10, 15 * 60 * 1000);
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

    const { data: project, error } = await supabase
      .from("client_projects")
      .select("id, client_name, client_email, company_name, project_title, auth_otp_code, auth_otp_expires_at")
      .ilike("client_email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (error || !project) {
      return NextResponse.json({ ok: false, error: "Invalid email or verification code." }, { status: 400 });
    }

    if (!project.auth_otp_code || project.auth_otp_code !== cleanCode) {
      return NextResponse.json({ ok: false, error: "Invalid verification code. Please check your email." }, { status: 400 });
    }

    if (!project.auth_otp_expires_at || new Date(project.auth_otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Clear used OTP code
    await supabase
      .from("client_projects")
      .update({
        auth_otp_code: null,
        auth_otp_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    const token = signClientToken(project.id, project.client_email);

    log("info", { message: "Client logged in successfully", context: { email: cleanEmail, projectId: project.id } });

    const response = NextResponse.json({
      ok: true,
      project: {
        id: project.id,
        client_name: project.client_name,
        client_email: project.client_email,
        company_name: project.company_name,
        project_title: project.project_title,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    return response;
  } catch (error) {
    log("error", { message: "Client OTP verification error", error });
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
