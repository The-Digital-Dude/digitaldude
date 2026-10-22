import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { brandSchema, DESIGNS, renderEmail } from "@/lib/emailDesign";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const body = z.object({ brand: brandSchema, design: z.enum(DESIGNS), industry: z.string().max(60).optional() });

const SAMPLE = "Hi Dan,\n\nI saw that Plum Property lists 40 rental properties across Brisbane. We build owner reporting and workflow tools for property teams.\n\nIs the monthly owner reporting something your team still does by hand?";

/** Renders a sample email with the settings in the form (unsaved), so the admin sees the result while editing. */
export const POST = adminRoute("preview email design", async (request) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const { brand, design, industry } = parsed.data;
  if (!brand) return jsonError("Invalid settings", 422);
  const { html } = renderEmail({
    design,
    brand,
    subject: "Reducing admin at Plum Property",
    body: SAMPLE,
    signature: { name: "Alex Morgan", role: "Sales Partner", photoUrl: null, siteUrl: SITE_URL },
    button: { url: `${SITE_URL}/b/sample` },
    footerHtml: '<p style="margin:0 0 4px 0;">The Digital Dude &middot; your postal address appears here</p><p style="margin:0;">If you would prefer not to receive further commercial emails from us, <a href="#" style="color:#94a3b8;text-decoration:underline;">unsubscribe here</a> and we will stop immediately.</p>',
    footerText: "The Digital Dude. Unsubscribe: (link)",
    industry: industry ?? "Property management",
    siteUrl: SITE_URL,
  });
  return NextResponse.json({ ok: true, html });
});
