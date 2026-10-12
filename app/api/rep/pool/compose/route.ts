import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import { composeEmail, loadComposeContext } from "@/lib/acquisition/drafting/compose";
import { getBookingUrl } from "@/lib/acquisition/providers/calendar";
import { normalizeEmail } from "@/lib/acquisition/normalize";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const body = z.object({ contactId: z.string().uuid().optional(), email: z.string().trim().max(320).optional() }).refine((b) => b.contactId || b.email, "Give a contact");

/**
 * The AI writes a first email for one of the rep's own pool contacts, using ONLY that company's verified research.
 * It is a draft: the rep reads and edits it in the outreach composer, and every send check still runs when they send.
 */
export const POST = repRoute("compose email", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Choose a contact first", 422);
  if (!rateLimit(`rep_compose:${rep.id}`, 40, 60 * 60 * 1000).ok) return repJsonError("Too many AI drafts this hour. Please slow down.", 429);

  let contactId = parsed.data.contactId;
  if (!contactId && parsed.data.email) {
    const { data } = await db.from("acq_contacts").select("id").eq("email_normalized", normalizeEmail(parsed.data.email)).maybeSingle();
    contactId = data?.id as string | undefined;
  }
  const ctx = contactId ? await loadComposeContext(db, contactId) : null;
  if (!ctx || ctx.ownerEmployeeId !== rep.id) return repJsonError("The AI can only write for contacts at companies in your Lead Pool. Add this person there first.", 404);

  const ai = await resolveAiProvider(db);
  if (!ai) return repJsonError("The AI is not set up yet. Ask the admin.", 409);
  const { data: me } = await db.from("employees").select("outreach_display_name,full_name").eq("id", rep.id).maybeSingle();
  const senderName = ((me?.outreach_display_name as string | null) || (me?.full_name as string | null) || "").trim();
  const email = await composeEmail(ai, ctx, { senderName, bookingUrl: getBookingUrl() });
  if (!email) return repJsonError("The AI could not write a safe email from the evidence. Please write it yourself or use a template.", 422);

  // Tell the rep up front if this contact cannot be emailed yet, so they do not write for nothing.
  const gate = await db.rpc("acq_rep_can_email", { p_contact_id: ctx.contactId, p_employee: rep.id });
  const g = (Array.isArray(gate.data) ? gate.data[0] : gate.data) as { ok: boolean; reason: string | null } | undefined;

  return NextResponse.json({
    ok: true,
    subject: email.subject,
    body: email.body,
    to: ctx.contactEmail,
    name: ctx.contactFirstName,
    company: ctx.companyName,
    general: ctx.facts.length === 0,
    usedFacts: email.usedFacts.map((n) => ({ n, claim: ctx.facts[n - 1].claim, sourceUrl: ctx.facts[n - 1].sourceUrl })),
    sendBlocked: g && !g.ok ? g.reason : null,
  });
});
