import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { CODE_RE, isBot, recordClick } from "@/lib/bookLinks";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Counts one click on the booking button for a private link. Public by design, so it is rate limited and ignores bots. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE_RE.test(code)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!rateLimit(`book_click:${getClientIp(request) ?? "unknown"}:${code}`, 5, 60 * 60 * 1000).ok) return NextResponse.json({ ok: true });
  if (isBot(request.headers.get("user-agent"))) return NextResponse.json({ ok: true });
  const db = getSupabaseServerClient();
  if (db) await recordClick(db, code).catch(() => {});
  return NextResponse.json({ ok: true });
}
