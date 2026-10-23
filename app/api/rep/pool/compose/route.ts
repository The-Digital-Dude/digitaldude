import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { resolveAiProvider } from "@/lib/acquisition/ai-config";
import { composeEmail, composeFollowUp, loadComposeContext, type ComposeContext } from "@/lib/acquisition/drafting/compose";
import { firstNameOf } from "@/lib/acquisition/drafting/draft";
import { parseLeadIntelligence } from "@/lib/crm/intelligence";
import { normalizeEmail } from "@/lib/acquisition/normalize";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const body = z.object({ contactId: z.string().uuid().optional(), email: z.string().trim().max(320).optional(), stage: z.enum(["cold", "follow_up"]).default("cold") }).refine((b) => b.contactId || b.email, "Give a contact");

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
  let ctx = contactId ? await loadComposeContext(db, contactId) : null;
  let crmResearch = false;
  if (!ctx || ctx.ownerEmployeeId !== rep.id) {
    const normalized = parsed.data.email ? normalizeEmail(parsed.data.email) : "";
    const { data: lead } = normalized
      ? await db.from("rep_leads").select("full_name,email,job_title,company_name,country,notes").eq("employee_id", rep.id).eq("email", normalized).is("anonymized_at", null).maybeSingle()
      : { data: null };
    if (!lead) return repJsonError("This contact is not in your Lead Pool or Leads CRM yet. Add the person first.", 404);
    const intelligence = parseLeadIntelligence(lead.notes as string | null);
    if (!intelligence.painPoints || !intelligence.solution) {
      return repJsonError("Add both a Pain Point / Trigger and Proposed Solution to this CRM lead before asking AI to write.", 422);
    }
    const crmContext: ComposeContext & { contactId: string; contactEmail: string; ownerEmployeeId: string; companyId: null } = {
      companyId: null,
      ownerEmployeeId: rep.id,
      contactId: "",
      contactEmail: lead.email as string,
      companyName: (lead.company_name as string | null) || "their company",
      industry: intelligence.industry ?? null,
      country: (lead.country as string | null) ?? null,
      contactFirstName: firstNameOf(lead.full_name as string | null),
      contactRole: (lead.job_title as string | null) ?? null,
      facts: [],
      angle: `Possible pain-point hypothesis: ${intelligence.painPoints}. Proposed service angle: ${intelligence.solution}.`,
    };
    ctx = crmContext;
    crmResearch = true;
  }

  const ai = await resolveAiProvider(db);
  if (!ai) return repJsonError("The AI is not set up yet. Ask the admin.", 409);
  const { data: me } = await db.from("employees").select("outreach_display_name,full_name").eq("id", rep.id).maybeSingle();
  const senderName = ((me?.outreach_display_name as string | null) || (me?.full_name as string | null) || "").trim();
  let email;
  if (parsed.data.stage === "follow_up") {
    // A follow-up answers OUR earlier email to this person, and only if they have not replied.
    const { data: prev } = await db.from("rep_outreach_logs").select("subject,body_content,sent_at").eq("employee_id", rep.id).eq("recipient_email", ctx.contactEmail.toLowerCase()).order("sent_at", { ascending: false }).limit(1);
    const p = prev?.[0] as { subject: string; body_content: string; sent_at: string } | undefined;
    if (!p) return repJsonError("You haven't emailed this person yet, so there is nothing to follow up. Switch to Cold outreach.", 409);
    if (ctx.contactId) {
      const { data: replies } = await db.from("acq_replies").select("id,classification").eq("contact_id", ctx.contactId);
      if ((replies ?? []).some((r) => r.classification !== "out_of_office" && r.classification !== "bounce")) return repJsonError("This person has already replied. Use the Replies tab to answer them instead.", 409);
    }
    email = await composeFollowUp(ai, ctx, { subject: p.subject, body: p.body_content, sentAt: p.sent_at }, { senderName });
  } else {
    // No link in the text: the outreach email adds a "Book a 30-minute call" button that carries THIS rep's referral link.
    email = await composeEmail(ai, ctx, { senderName });
  }
  if (!email) return repJsonError("The AI could not write a safe email from the evidence. Please write it yourself or use a template.", 422);

  // Tell the rep up front if this contact cannot be emailed yet, so they do not write for nothing.
  const gate = ctx.contactId ? await db.rpc("acq_rep_can_email", { p_contact_id: ctx.contactId, p_employee: rep.id }) : null;
  const g = gate ? (Array.isArray(gate.data) ? gate.data[0] : gate.data) as { ok: boolean; reason: string | null } | undefined : undefined;

  return NextResponse.json({
    ok: true,
    stage: parsed.data.stage,
    subject: email.subject,
    body: email.body,
    to: ctx.contactEmail,
    name: ctx.contactFirstName,
    company: ctx.companyName,
    general: ctx.facts.length === 0,
    crmResearch,
    usedFacts: email.usedFacts.map((n) => ({ n, claim: ctx.facts[n - 1].claim, sourceUrl: ctx.facts[n - 1].sourceUrl })),
    sendBlocked: g && !g.ok ? g.reason : null,
  });
});
