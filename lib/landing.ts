import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INDUSTRY_NAMES } from "@/lib/industryTemplates";

type Db = SupabaseClient;

/**
 * Content of the personalised booking page. A default version plus optional per-industry overrides; every field is plain text (never
 * HTML), lengths are capped, and the saved value is re-validated field by field on load so a bad save can never break the page.
 * Greeting text can use {{first_name}}, {{company}} and {{rep_name}}, which are filled in as plain text.
 */

export const LANDING_KEY = "landing_content";

const text = (max: number) => z.string().trim().max(max);
const httpsUrl = z.string().trim().max(500).refine((u) => u === "" || /^https:\/\/[^\s"'<>]+$/i.test(u), "Must be an https:// address");
const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #7b61ff");

export const proofItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("case_study"), slug: z.string().trim().regex(/^[a-z0-9-]{1,80}$/, "A case study slug") }),
  z.object({ type: z.literal("custom"), title: text(100).min(1), metric: text(40).optional().default(""), detail: text(300).default("") }),
]);
export type ProofItem = z.infer<typeof proofItemSchema>;

export const sectionSchema = z.object({
  headline: text(160).min(1),
  subheadline: text(300),
  painTitle: text(80),
  painPoints: z.array(text(160).min(1)).max(6),
  buildTitle: text(80),
  builds: z.array(text(160).min(1)).max(6),
  proofTitle: text(80),
  proof: z.array(proofItemSchema).max(6),
  ctaLabel: text(40).min(2),
  formTitle: text(80),
  accent: hex,
  imageUrl: httpsUrl,
});
export type LandingSection = z.infer<typeof sectionSchema>;

export const landingSchema = z.object({
  default: sectionSchema,
  industries: z.record(z.string().max(60), sectionSchema.partial()).default({}),
});
export type LandingContent = z.infer<typeof landingSchema>;

// ------------------------------------------------------------------------------------------------------------- defaults
const BASE: LandingSection = {
  headline: "{{rep_name}} thought a quick call might be useful for {{company}}",
  subheadline: "A 30-minute conversation to see whether we can take some of the admin off your plate. No pitch deck and no obligation.",
  painTitle: "Where we usually help",
  painPoints: ["Manual, spreadsheet-based processes", "Approvals and handovers that live in email threads", "Systems that do not talk to each other", "Reports that take hours to put together"],
  buildTitle: "What we build",
  builds: ["Internal tools and dashboards", "Workflow automation and approvals", "Integrations between the systems you already use", "Automated reporting"],
  proofTitle: "Recent work",
  proof: [],
  ctaLabel: "Book a 30-minute call",
  formTitle: "Pick a time that suits you",
  accent: "#7b61ff",
  imageUrl: "",
};

const INDUSTRY_DEFAULTS: Record<string, Partial<LandingSection>> = {
  "Property management": {
    painPoints: ["Owner reporting put together by hand every month", "Maintenance requests triaged across email and phone", "Tenant onboarding paperwork", "Compliance dates tracked in spreadsheets"],
    builds: ["Owner reporting portals", "Maintenance request triage workflows", "Tenant onboarding flows", "Compliance reminders and tracking"],
  },
  "Recruitment agencies": {
    painPoints: ["Candidate and client data spread across tools", "Sourcing and follow-up done by hand", "Placement reporting assembled manually", "Slow handoffs between consultants"],
    builds: ["Candidate and client CRM", "Automated sourcing and follow-up workflows", "Placement and billing reporting", "Client and candidate portals"],
  },
  Logistics: {
    painPoints: ["Bookings and dispatch coordinated by phone and message", "Customers chasing status updates", "Paperwork and invoicing after every job", "Driver and job information kept in separate places"],
    builds: ["Booking and dispatch workflows", "Automatic status updates", "Customer portals", "Invoicing and proof-of-delivery capture"],
  },
  "Travel agencies": {
    painPoints: ["Enquiries scattered across WhatsApp, email and phone", "Itineraries built from scratch each time", "Supplier and commission tracking in spreadsheets", "Follow-ups that depend on someone remembering"],
    builds: ["Enquiry and booking management", "Itinerary generation", "Supplier and commission tracking", "Automated follow-ups"],
  },
  "Education providers": {
    painPoints: ["Enrolment paperwork and chasing documents", "Timetabling and scheduling done by hand", "Parents and students asking for the same information", "Fee tracking spread across systems"],
    builds: ["Enrolment workflows", "Scheduling tools", "Student and parent portals", "Fee tracking and reminders"],
  },
  "Home services": {
    painPoints: ["Jobs scheduled by phone and message", "Quotes written one at a time", "Invoices created after the fact", "Customers waiting for confirmations"],
    builds: ["Job scheduling and dispatch", "Quote-to-invoice workflows", "Customer booking and confirmations", "Technician mobile apps"],
  },
};

export function defaultLanding(): LandingContent {
  const industries: LandingContent["industries"] = {};
  for (const name of INDUSTRY_NAMES) if (INDUSTRY_DEFAULTS[name]) industries[name] = { ...INDUSTRY_DEFAULTS[name] };
  return { default: { ...BASE }, industries };
}

/** Saved content, repaired field by field: anything invalid falls back to the default, so the page always renders. */
export function sanitizeLanding(raw: unknown): LandingContent {
  const defaults = defaultLanding();
  const o = (raw && typeof raw === "object" ? raw : {}) as { default?: unknown; industries?: unknown };
  const clean = (value: unknown, fallback: LandingSection): LandingSection => {
    const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, schema] of Object.entries(sectionSchema.shape)) {
      const r = (schema as z.ZodTypeAny).safeParse(v[k]);
      out[k] = r.success ? r.data : (fallback as Record<string, unknown>)[k];
    }
    return out as LandingSection;
  };
  const base = clean(o.default, defaults.default);
  const industries: LandingContent["industries"] = { ...defaults.industries };
  for (const [name, value] of Object.entries((o.industries && typeof o.industries === "object" ? o.industries : {}) as Record<string, unknown>)) {
    if (name.length > 60) continue;
    const p = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const part: Record<string, unknown> = { ...(industries[name] ?? {}) };
    for (const [k, schema] of Object.entries(sectionSchema.shape)) if (k in p) {
      const r = (schema as z.ZodTypeAny).safeParse(p[k]);
      // An empty field means "use the built-in text for this industry", not "show nothing".
      if (r.success && !(r.data === "" || (Array.isArray(r.data) && r.data.length === 0))) part[k] = r.data;
    }
    industries[name] = part as Partial<LandingSection>;
  }
  return { default: base, industries };
}

export async function loadLanding(db: Db): Promise<LandingContent> {
  try {
    const { data } = await db.from("acq_settings").select("value").eq("key", LANDING_KEY).maybeSingle();
    return data?.value ? sanitizeLanding(data.value) : defaultLanding();
  } catch {
    return defaultLanding();
  }
}

/** The section for an industry: the default with that industry's overrides on top (empty override fields are ignored). */
export function sectionFor(content: LandingContent, industry: string | null | undefined): LandingSection {
  const key = Object.keys(content.industries).find((k) => k.toLowerCase() === (industry ?? "").trim().toLowerCase());
  const over = key ? content.industries[key] : undefined;
  const merged: Record<string, unknown> = { ...content.default };
  for (const [k, v] of Object.entries(over ?? {})) {
    const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    if (!empty) merged[k] = v;
  }
  return merged as LandingSection;
}

export interface LandingPerson {
  firstName?: string | null;
  company?: string | null;
  repName?: string | null;
}

/** Fills {{first_name}}, {{company}}, {{rep_name}}. Output is plain text (rendered by React, never as HTML). */
export function fillTokens(template: string, p: LandingPerson): string {
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, (p.firstName ?? "").trim() || "there")
    .replace(/\{\{\s*company\s*\}\}/gi, (p.company ?? "").trim() || "your team")
    .replace(/\{\{\s*rep_name\s*\}\}/gi, (p.repName ?? "").trim() || "The Digital Dude team");
}
