import { NextResponse } from "next/server";
import { getDb } from "@/lib/acquisition/db";
import { getEmailProvider, WebhookAuthError } from "@/lib/acquisition/providers/email";
import { processEmailEvent } from "@/lib/acquisition/webhooks";
import { webhookEvent } from "@/lib/acquisition/validation";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Provider delivery/reply/bounce events. The signature is verified over the raw
 * body BEFORE anything is parsed or stored. Redelivered events are no-ops.
 * A 5xx makes the provider retry, which is safe because processing is idempotent.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) return NextResponse.json({ ok: false }, { status: 413 });

  const provider = getEmailProvider();
  let events;
  try {
    events = provider.verifyAndParseWebhook(raw, request.headers);
  } catch (e) {
    if (e instanceof WebhookAuthError) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ ok: false, error: "Malformed payload" }, { status: 400 });
  }

  const parsed = events.map((ev) => webhookEvent.safeParse(ev));
  if (parsed.some((p) => !p.success)) return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });

  try {
    const db = getDb();
    let processed = 0;
    let duplicates = 0;
    for (const p of parsed) {
      const r = await processEmailEvent(db, provider.name, p.data!);
      if (r === "processed") processed++;
      else duplicates++;
    }
    return NextResponse.json({ ok: true, processed, duplicates });
  } catch (e) {
    log("error", { message: "email webhook processing failed", error: e });
    return NextResponse.json({ ok: false, error: "Processing failed" }, { status: 500 });
  }
}
