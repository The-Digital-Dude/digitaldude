import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { verifyUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { suppressEmail } from "@/lib/acquisition/compliance/suppression";
import { unsubscribeSecret } from "@/lib/acquisition/env";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

function emailFromToken(token: string | null): string | null {
  try {
    return verifyUnsubscribeToken(token, unsubscribeSecret());
  } catch {
    return null;
  }
}

/** Resolves a signed token to the email it belongs to (so the confirmation page can show it). GET never changes anything. */
export async function GET(request: Request) {
  const email = emailFromToken(new URL(request.url).searchParams.get("t"));
  if (!email) return NextResponse.json({ ok: false, error: "This unsubscribe link is invalid." }, { status: 400 });
  return NextResponse.json({ ok: true, email });
}

async function cancelRepSequences(email: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  const { data: leads } = await supabase.from("rep_leads").select("id").eq("email", email);
  if (!leads?.length) return;
  const leadIds = leads.map((l) => l.id);
  const now = new Date().toISOString();
  await supabase.from("rep_campaign_queue").update({ status: "cancelled", error_message: "Recipient unsubscribed", updated_at: now }).in("lead_id", leadIds).eq("status", "pending");
  await supabase.from("rep_campaign_enrollments").update({ status: "cancelled_unsubscribed", updated_at: now }).in("lead_id", leadIds).eq("status", "active");
}

/**
 * Opt-out. A signed token (current emails, and the RFC 8058 one-click POST) writes the permanent shared
 * suppression list. Legacy unsigned links (emails already sent) keep the old behaviour: a per-address
 * rep_unsubscribes row, which the sending gate also honours. Unsigned requests can never write the
 * permanent list, so nobody can poison it by guessing addresses.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`rep-unsub:${getClientIp(request) ?? "unknown"}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ ok: false, error: "Too many requests. Please try again in a minute." }, { status: 429 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });

  try {
    const url = new URL(request.url);
    let token = url.searchParams.get("t");
    let legacyEmail: string | null = null;
    let leadId: string | null = null;
    let reason: string | null = null;

    const ctype = (request.headers.get("content-type") ?? "").toLowerCase();
    if (ctype.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      token = token ?? (typeof body.t === "string" ? body.t : null);
      legacyEmail = typeof body.email === "string" ? body.email : null;
      leadId = typeof body.lead_id === "string" ? body.lead_id : null;
      reason = typeof body.reason === "string" ? body.reason : null;
    }

    const signedEmail = emailFromToken(token);
    if (token && !signedEmail) return NextResponse.json({ ok: false, error: "This unsubscribe link is invalid." }, { status: 400 });

    if (signedEmail) {
      await suppressEmail(supabase, signedEmail, "unsubscribe", "rep-unsubscribe-link");
      await cancelRepSequences(signedEmail);
      return NextResponse.json({ ok: true, message: "Successfully unsubscribed" });
    }

    if (!legacyEmail || !legacyEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }
    const clean = legacyEmail.trim().toLowerCase();
    const { error } = await supabase.from("rep_unsubscribes").upsert(
      { email: clean, lead_id: leadId, reason: reason || "User 1-click opt-out", unsubscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) throw new Error(error.message);
    await cancelRepSequences(clean);
    return NextResponse.json({ ok: true, message: "Successfully unsubscribed" });
  } catch (err) {
    log("error", { message: "rep unsubscribe failed", error: err });
    return NextResponse.json({ ok: false, error: "We couldn't record your request. Please reply to the email to opt out." }, { status: 500 });
  }
}
