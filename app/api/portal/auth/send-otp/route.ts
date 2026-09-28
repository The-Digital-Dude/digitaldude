import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendClientOtpEmail } from "@/lib/clientEmails";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`client_otp:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many login requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email address is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generic response used whether or not this email matches a real client
    // project — returning a distinct 404 for "not found" lets an attacker
    // enumerate which companies are real clients of this business, so every
    // code path below this point returns the same shape regardless.
    const genericResponse = NextResponse.json({
      ok: true,
      message: `If an account exists for ${cleanEmail}, a verification code has been sent.`,
    });

    // Check if client project workspace exists
    const { data: project, error } = await supabase
      .from("client_projects")
      .select("id, client_name, client_email, project_title")
      .ilike("client_email", cleanEmail)
      .limit(1)
      .maybeSingle();

    if (error || !project) {
      return genericResponse;
    }

    const otpCode = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { error: updateError } = await supabase
      .from("client_projects")
      .update({
        auth_otp_code: otpCode,
        auth_otp_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    if (updateError) {
      log("error", { message: "Failed to persist client OTP code", error: updateError });
      return genericResponse;
    }

    // Send email OTP via Brevo
    const emailRes = await sendClientOtpEmail({
      email: cleanEmail,
      clientName: project.client_name,
      code: otpCode,
      projectTitle: project.project_title,
    });

    if (!emailRes.ok) {
      log("error", { message: "Failed to send client OTP email", error: emailRes.error });
    }

    return genericResponse;
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
