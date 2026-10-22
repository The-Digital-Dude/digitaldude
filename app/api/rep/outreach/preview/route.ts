import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { buildRepEmail, industryForEmail, resolveDesign } from "@/lib/repEmail";
import { SITE_URL } from "@/lib/utils";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const body = z.object({
  design: z.string().max(40).optional(),
  stage: z.enum(["cold", "follow_up"]).default("cold"),
  subject: z.string().max(300).default(""),
  message: z.string().max(10_000).default(""),
  includeButton: z.boolean().optional(),
  recipientEmail: z.string().max(320).optional(),
});

/** Shows exactly how the email will look in the chosen design (same builder as sending). Nothing is sent or saved. */
export const POST = repRoute("preview outreach email", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);
  if (!rateLimit(`rep_preview:${rep.id}`, 240, 60 * 60 * 1000).ok) return repJsonError("Too many previews this hour.", 429);
  const b = parsed.data;

  const { data: employee } = await db.from("employees").select("id,outreach_display_name,role_title,photo_url,referral_code").eq("id", rep.id).maybeSingle();
  if (!employee) return repJsonError("Account not found", 404);
  const wantButton = typeof b.includeButton === "boolean" ? b.includeButton : b.stage === "cold";
  const { html } = await buildRepEmail(db, {
    employee,
    subject: b.subject || "(no subject yet)",
    message: b.message || "Your message will appear here.",
    design: resolveDesign(b.design, b.stage),
    buttonUrl: wantButton ? `${SITE_URL}/contact?ref=${employee.referral_code || employee.id}` : null,
    unsubscribeUrl: `${SITE_URL}/outreach/unsubscribe?t=preview`,
    industry: b.recipientEmail ? await industryForEmail(db, b.recipientEmail).catch(() => null) : null,
  });
  return NextResponse.json({ ok: true, html });
});
