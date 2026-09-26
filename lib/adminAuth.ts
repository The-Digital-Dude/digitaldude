import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const ADMIN_COOKIE_NAME = "tdd_admin_session";
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      log("error", { message: "ADMIN_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY must be set in production" });
      return null;
    }
    // In local development only, fail closed if not configured
    log("warn", { message: "ADMIN_SECRET_KEY is unset in development. Admin features will require configuration." });
    return null;
  }
  return secret;
}

/**
 * Creates an HMAC-SHA256 signature using Web Crypto API (compatible with Edge & Node.js).
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Signs a session payload with a timestamp and HMAC signature.
 */
export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getAdminSecret();
  if (!secret) return null;

  const timestamp = Date.now().toString();
  const signature = await createSignature(`admin:${timestamp}`, secret);
  return `${timestamp}.${signature}`;
}

/**
 * Verifies the validity and expiration of an admin session token.
 */
export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [timestampStr, signature] = token.split(".");
  const timestamp = parseInt(timestampStr, 10);

  if (Number.isNaN(timestamp)) return false;

  // Check expiration
  const now = Date.now();
  if (now - timestamp > SESSION_EXPIRY_SECONDS * 1000) return false;

  const secret = getAdminSecret();
  if (!secret) return false;

  const expectedSignature = await createSignature(`admin:${timestampStr}`, secret);
  return signature === expectedSignature;
}

/**
 * Validates the admin password from environment variable. Fails closed if unset.
 */
export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim().length === 0) {
    log("error", { message: "ADMIN_PASSWORD environment variable is not configured. Admin login rejected." });
    return false;
  }
  return password === adminPassword;
}

/**
 * Extracts and verifies the admin session from an incoming Request.
 */
export async function isAdminAuthenticated(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`));
  if (!match) return false;
  const token = decodeURIComponent(match[1]);
  return verifyAdminSessionToken(token);
}

/**
 * Sets the secure admin session cookie on a NextResponse.
 */
export async function attachAdminSessionCookie(response: NextResponse): Promise<NextResponse> {
  const token = await createAdminSessionToken();
  if (!token) {
    throw new Error("Cannot issue admin session: ADMIN_SECRET_KEY is not configured.");
  }
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
  });
  return response;
}

/**
 * Clears the admin session cookie on logout.
 */
export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
