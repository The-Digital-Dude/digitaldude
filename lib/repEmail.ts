import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_BRAND, DESIGNS, defaultDesignFor, renderEmail, sanitizeBrand, type Brand, type DesignId } from "@/lib/emailDesign";
import { loadSenderIdentity, repFooterHtml, repFooterText } from "@/lib/outreachGate";
import { SITE_URL } from "@/lib/utils";

type Db = SupabaseClient;

export const BRAND_KEY = "email_brand";

/** The saved "Look and feel" settings; defaults for anything missing or invalid (a bad save can never stop sending). */
export async function loadBrand(db: Db): Promise<Brand> {
  try {
    const { data } = await db.from("acq_settings").select("value").eq("key", BRAND_KEY).maybeSingle();
    return data?.value ? sanitizeBrand(data.value) : DEFAULT_BRAND;
  } catch {
    return DEFAULT_BRAND;
  }
}

export const isDesign = (v: unknown): v is DesignId => typeof v === "string" && (DESIGNS as readonly string[]).includes(v);

/** The design to use: the rep's pick if valid, otherwise the stage's default. */
export const resolveDesign = (picked: unknown, stage: "cold" | "follow_up"): DesignId => (isDesign(picked) ? picked : defaultDesignFor(stage));

export interface RepEmployee {
  id: string;
  outreach_display_name?: string | null;
  role_title?: string | null;
  photo_url?: string | null;
}

/**
 * Builds the HTML and plain-text email for a rep's message in the chosen design. Used for BOTH sending and the preview, so what the
 * rep sees is exactly what is sent. The footer (sender identity + signed unsubscribe link) is always added.
 */
export async function buildRepEmail(
  db: Db,
  a: {
    employee: RepEmployee;
    subject: string;
    message: string;
    design: DesignId;
    buttonUrl: string | null;
    unsubscribeUrl: string;
    /** The recipient's industry, for the industry-themed card. */
    industry?: string | null;
    brand?: Brand;
  }
): Promise<{ html: string; text: string }> {
  const [brand, identity] = await Promise.all([a.brand ? Promise.resolve(a.brand) : loadBrand(db), loadSenderIdentity(db)]);
  return renderEmail({
    design: a.design,
    brand,
    subject: a.subject,
    body: a.message,
    // Never the rep's personal full name: the admin-configured display name, as before.
    signature: { name: (a.employee.outreach_display_name || "").trim() || "The Digital Dude Partnerships", role: a.employee.role_title || "Outreach & Partnerships", photoUrl: a.employee.photo_url ?? null, siteUrl: SITE_URL },
    button: a.buttonUrl ? { url: a.buttonUrl } : null,
    footerHtml: repFooterHtml(identity, a.unsubscribeUrl),
    footerText: repFooterText(identity, a.unsubscribeUrl),
    industry: a.industry ?? null,
    siteUrl: SITE_URL,
  });
}

/** The pool contact for an address (id and the company's industry), used for the private booking link and the industry card. */
export async function contactInfoForEmail(db: Db, email: string): Promise<{ contactId: string | null; industry: string | null }> {
  const { data } = await db.from("acq_contacts").select("id, acq_companies(industry)").eq("email_normalized", email.trim().toLowerCase()).maybeSingle();
  return { contactId: (data?.id as string | undefined) ?? null, industry: ((data?.acq_companies as unknown as { industry: string | null } | null)?.industry) ?? null };
}

/** The industry of the company a pool contact belongs to (for the industry-themed card). */
export async function industryForEmail(db: Db, email: string): Promise<string | null> {
  const { data } = await db.from("acq_contacts").select("acq_companies(industry)").eq("email_normalized", email.trim().toLowerCase()).maybeSingle();
  return ((data?.acq_companies as unknown as { industry: string | null } | null)?.industry) ?? null;
}
