import crypto from "crypto";
import { sendBrevoEmail, wrapInEmailTemplate } from "@/lib/emailBrevo";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { log } from "@/lib/logger";

const REP_SECRET = process.env.REP_AUTH_SECRET || process.env.ADMIN_PASSWORD || "digitaldude_rep_secret_key_2026";
const COOKIE_NAME = "tdd_rep_session";

export interface RepSessionPayload {
  id: string;
  email: string;
  full_name: string;
  referral_code?: string;
  assigned_outreach_email?: string;
  currency: string;
  role_title: string;
  status: string;
}

export function signRepToken(employeeId: string, email: string): string {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const data = `${employeeId}:${email}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", REP_SECRET).update(data).digest("hex");
  return `${Buffer.from(data).toString("base64url")}.${signature}`;
}

export function verifyRepToken(token: string): { employeeId: string; email: string } | null {
  try {
    const [dataB64, signature] = token.split(".");
    if (!dataB64 || !signature) return null;

    const data = Buffer.from(dataB64, "base64url").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", REP_SECRET).update(data).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const [employeeId, email, expiresStr] = data.split(":");
      if (Number(expiresStr) < Date.now()) return null;
      return { employeeId, email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedRep(request: Request): Promise<RepSessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const verified = verifyRepToken(match[1]);
  if (!verified) return null;

  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, email, full_name, referral_code, assigned_outreach_email, currency, role_title, status")
    .eq("id", verified.employeeId)
    .single();

  if (error || !employee || employee.status === "offboarded") {
    return null;
  }

  return employee as RepSessionPayload;
}

export function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendRepOtpEmail(params: { email: string; fullName: string; code: string }) {
  const firstName = params.fullName.trim().split(/\s+/)[0] || "there";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1a1a4e; line-height: 1.3;">
      Your Rep Portal Verification Code
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4a4a75;">
      Hi ${firstName}, here is your one-time verification code to access your Rep Dashboard:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7b61ff; background: #f4f0ff; border: 2px dashed #7b61ff66; padding: 12px 28px; border-radius: 16px;">
        ${params.code}
      </span>
    </div>

    <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6; color: #6b6b90;">
      This code will expire in <strong>15 minutes</strong>. If you did not request this login, you can safely ignore this email.
    </p>
  `;

  return sendBrevoEmail({
    to: [{ email: params.email, name: params.fullName }],
    subject: `Your Login Code: ${params.code} — The Digital Dude Rep Portal`,
    htmlContent: wrapInEmailTemplate("Rep Portal Login", content),
  });
}
