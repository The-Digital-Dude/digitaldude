import { z } from "zod";

/**
 * Email designs for rep outreach. The message text and the mandatory footer (sender identity + unsubscribe) are the same in every
 * design; only the look changes. Everything user-supplied is escaped, and the brand settings are validated, so a bad colour, URL or
 * font can never inject markup.
 */

export const DESIGNS = ["branded_card", "minimal", "plain", "industry_card"] as const;
export type DesignId = (typeof DESIGNS)[number];

export const DESIGN_LABELS: Record<DesignId, { name: string; hint: string }> = {
  minimal: { name: "Minimal personal", hint: "No header or card: just your message and signature. Feels like a person wrote it." },
  plain: { name: "Plain text", hint: "No design at all. Often lands best in inboxes, especially follow-ups." },
  branded_card: { name: "Branded card", hint: "Logo header and a content card. Professional, good when the brand matters." },
  industry_card: { name: "Industry-themed card", hint: "The branded card with an accent colour and a short line for the recipient's industry." },
};

/** Which design a stage uses unless the rep picks another. */
export const defaultDesignFor = (stage: "cold" | "follow_up"): DesignId => (stage === "follow_up" ? "plain" : "minimal");

// ------------------------------------------------------------------------------------------------------------- brand settings
export const FONT_STACKS = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  verdana: "Verdana, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
} as const;
export type FontKey = keyof typeof FONT_STACKS;

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #7b61ff");
const httpsUrl = z.string().trim().max(500).refine((u) => u === "" || /^https:\/\/[^\s"'<>]+$/i.test(u), "Must be an https:// address");

export const brandSchema = z.object({
  accent: hex.default("#7b61ff"),
  headerBg: hex.default("#1a1a4e"),
  buttonBg: hex.default("#7b61ff"),
  buttonText: hex.default("#ffffff"),
  textColor: hex.default("#2d2d4d"),
  buttonLabel: z.string().trim().min(2).max(40).default("Book a 30-minute call"),
  buttonShape: z.enum(["square", "rounded", "pill"]).default("rounded"),
  font: z.enum(["system", "arial", "georgia", "verdana", "trebuchet"]).default("system"),
  fontSize: z.number().int().min(13).max(18).default(15),
  logoUrl: httpsUrl.default(""),
  headerText: z.string().trim().max(60).default(""),
  footerNote: z.string().trim().max(200).default(""),
  industryLines: z.record(z.string().max(60), z.object({ accent: hex.optional(), line: z.string().trim().max(120).default("") })).default({}),
});
export type Brand = z.infer<typeof brandSchema>;

export const DEFAULT_BRAND: Brand = brandSchema.parse({});

/** Reads saved settings, falling back to defaults field by field so a bad or partial save never breaks sending. */
export function sanitizeBrand(raw: unknown): Brand {
  const base = brandSchema.safeParse(raw);
  if (base.success) return base.data;
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, schema] of Object.entries(brandSchema.shape)) {
    const r = (schema as z.ZodTypeAny).safeParse(o[k]);
    out[k] = r.success ? r.data : (schema as z.ZodTypeAny).parse(undefined);
  }
  return out as Brand;
}

// ------------------------------------------------------------------------------------------------------------- rendering
export interface Signature {
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  siteUrl?: string;
}

export interface RenderInput {
  design: DesignId;
  brand: Brand;
  subject: string;
  /** The rep's message: plain text, paragraphs separated by a blank line. */
  body: string;
  signature: Signature;
  /** null = no button. */
  button: { url: string; label?: string } | null;
  /** The mandatory footer, as HTML and as text. Always included. */
  footerHtml: string;
  footerText: string;
  /** The recipient's industry, used by the industry-themed card. */
  industry?: string | null;
  siteUrl: string;
  /** Used by the admin preview so a logo/photo that fails to load does not break it. */
  preheader?: string;
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeUrl = (u: string | null | undefined) => (u && /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : "");

function paragraphs(body: string, size: number, color: string, margin = 16): string {
  return body
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 ${margin}px 0;font-size:${size}px;line-height:1.6;color:${color};">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const radius = (shape: Brand["buttonShape"]) => (shape === "square" ? 4 : shape === "pill" ? 999 : 12);

function buttonHtml(b: Brand, url: string, label?: string, compact = false): string {
  const href = safeUrl(url);
  if (!href) return "";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:${compact ? "18px 0 8px" : "26px 0 18px"} 0;"><tr><td><a href="${esc(href)}" target="_blank" style="display:inline-block;background-color:${b.buttonBg};color:${b.buttonText};font-size:${compact ? 14 : 15}px;font-weight:700;text-decoration:none;padding:${compact ? "11px 22px" : "13px 28px"};border-radius:${radius(b.buttonShape)}px;">${esc(label || b.buttonLabel)} &rarr;</a></td></tr></table>`;
}

function signatureHtml(sig: Signature, b: Brand, withPhoto: boolean): string {
  const photo = withPhoto ? safeUrl(sig.photoUrl) : "";
  const initials = sig.name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  const avatar = photo
    ? `<img src="${esc(photo)}" alt="" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;border:0;">`
    : withPhoto
      ? `<div style="width:48px;height:48px;border-radius:50%;background-color:${b.accent};color:#ffffff;font-weight:700;font-size:16px;line-height:48px;text-align:center;">${esc(initials)}</div>`
      : "";
  const site = safeUrl(sig.siteUrl);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;"><tr>${avatar ? `<td style="padding-right:12px;vertical-align:middle;">${avatar}</td>` : ""}<td style="vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:700;color:${b.textColor};">${esc(sig.name)}</p>${sig.role ? `<p style="margin:2px 0 0 0;font-size:12px;color:${b.accent};font-weight:600;">${esc(sig.role)}</p>` : ""}${site ? `<p style="margin:4px 0 0 0;font-size:12px;"><a href="${esc(site)}" style="color:${b.accent};text-decoration:none;">${esc(site.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p>` : ""}</td></tr></table>`;
}

const footerBlock = (html: string, note: string) => `<div style="margin-top:22px;font-size:11px;color:#8a8aa6;line-height:1.5;">${html}${note ? `<p style="margin:8px 0 0 0;">${esc(note)}</p>` : ""}</div>`;

function shell(title: string, inner: string, font: string, preheader?: string, bg: string | null = "#ffffff"): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body style="margin:0;padding:0;${bg ? `background-color:${bg};` : ""}font-family:${font};">${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ""}${inner}</body></html>`;
}

/** Plain-text version of the whole email (used as the text part of every design, and as the whole email in "plain"). */
function textVersion(i: RenderInput): string {
  const lines = [i.body.replace(/\r\n/g, "\n").trim(), ""];
  if (i.button && safeUrl(i.button.url)) lines.push(`${i.button.label || i.brand.buttonLabel}: ${i.button.url}`, "");
  lines.push(i.signature.name);
  if (i.signature.role) lines.push(i.signature.role);
  lines.push("", i.footerText);
  return lines.join("\n");
}

export function renderEmail(i: RenderInput): { html: string; text: string } {
  const b = i.brand;
  const font = FONT_STACKS[b.font];
  const size = b.fontSize;
  const text = textVersion(i);

  if (i.design === "plain") {
    // No styling at all: reads as a message typed in a mail client. The button, if any, is a plain labelled link.
    const link = i.button && safeUrl(i.button.url) ? `<p style="margin:0 0 14px 0;">${esc(i.button.label || b.buttonLabel)}: <a href="${esc(i.button.url)}">${esc(i.button.url)}</a></p>` : "";
    const html = `<div style="font-family:${font};font-size:${size}px;line-height:1.5;color:#000000;">${paragraphs(i.body, size, "#000000", 14)}${link}<p style="margin:0;">${esc(i.signature.name)}${i.signature.role ? `<br>${esc(i.signature.role)}` : ""}</p>${footerBlock(i.footerHtml, b.footerNote)}</div>`;
    return { html: shell(i.subject, html, font, i.preheader, null), text };
  }

  if (i.design === "minimal") {
    const inner = `<div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:${font};">${paragraphs(i.body, size, b.textColor)}${i.button ? buttonHtml(b, i.button.url, i.button.label, true) : ""}${signatureHtml(i.signature, b, true)}${footerBlock(i.footerHtml, b.footerNote)}</div>`;
    return { html: shell(i.subject, inner, font, i.preheader), text };
  }

  // branded_card and industry_card
  const theme = i.design === "industry_card" && i.industry ? b.industryLines[i.industry] ?? Object.entries(b.industryLines).find(([k]) => k.toLowerCase() === (i.industry ?? "").toLowerCase())?.[1] : undefined;
  const accent = theme?.accent ?? b.accent;
  const logo = safeUrl(b.logoUrl);
  const headerInner = logo
    ? `<a href="${esc(i.siteUrl)}" style="text-decoration:none;"><img src="${esc(logo)}" alt="${esc(b.headerText || "The Digital Dude")}" height="30" style="height:30px;width:auto;display:block;border:0;"></a>`
    : `<span style="font-size:18px;font-weight:800;color:#ffffff;">${esc(b.headerText || "The Digital Dude")}</span>`;
  const industryBar = theme?.line ? `<tr><td style="background-color:${accent};padding:8px 32px;font-size:12px;font-weight:700;color:#ffffff;letter-spacing:.3px;">${esc(theme.line)}</td></tr>` : `<tr><td style="background-color:${accent};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const card = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f5f9;padding:32px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e6f2;"><tr><td style="background-color:${b.headerBg};padding:22px 32px;">${headerInner}</td></tr>${industryBar}<tr><td style="padding:30px 32px 24px 32px;font-family:${font};">${paragraphs(i.body, size, b.textColor)}${i.button ? buttonHtml({ ...b, buttonBg: b.buttonBg }, i.button.url, i.button.label) : ""}${signatureHtml(i.signature, { ...b, accent }, true)}${footerBlock(i.footerHtml, b.footerNote)}</td></tr></table></td></tr></table>`;
  return { html: shell(i.subject, card, font, i.preheader, "#f4f5f9"), text };
}
