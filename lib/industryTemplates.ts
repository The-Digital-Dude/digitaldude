/**
 * Starter email wording per industry. Drafts to be edited, not claims: they say what we build and ask a plain question,
 * and make no statement about the recipient's business beyond what the research line ({{observation}}) can verify.
 *
 * Two shapes, because the two systems use different merge tags:
 *  - admin campaigns: {{first_name}} {{company_name}} {{observation}} {{sender_name}} (footer + unsubscribe are added by the system)
 *  - rep one-off emails: {{name}} {{company}} {{rep_name}} {{referral_link}}
 */

export interface IndustryTemplate {
  /** Matches acq_markets.industry (case-insensitive). */
  industry: string;
  /** What we typically build for them: used in both shapes. */
  offer: string;
}

const OFFERS: IndustryTemplate[] = [
  { industry: "Business automation", offer: "custom internal systems, workflow automation and integrations that replace manual, spreadsheet-based processes" },
  { industry: "Property management", offer: "automated owner reporting, maintenance request triage and tenant onboarding workflows" },
  { industry: "Recruitment agencies", offer: "candidate and client management systems, automated sourcing workflows and placement reporting" },
  { industry: "Logistics", offer: "booking and dispatch workflows, shipment status updates and customer portals" },
  { industry: "Travel agencies", offer: "enquiry and booking management, itinerary generation and supplier tracking" },
  { industry: "Education providers", offer: "enrolment, scheduling and student or parent portals" },
  { industry: "Home services", offer: "job scheduling, quote-to-invoice workflows and customer booking" },
];

export const INDUSTRY_NAMES = OFFERS.map((o) => o.industry);

export function findIndustry(industry: string | null | undefined): IndustryTemplate | null {
  const k = (industry ?? "").trim().toLowerCase();
  return OFFERS.find((o) => o.industry.toLowerCase() === k) ?? null;
}

/** Admin campaign wording for one industry (initial email + a single follow-up). */
export function campaignTemplateFor(industry: string) {
  const o = findIndustry(industry);
  if (!o) return null;
  return {
    subject: "Reducing admin load at {{company_name}}",
    body: `Hi {{first_name}},

{{observation}}

I run The Digital Dude, a small web and software studio. We build ${o.offer}.

If that could be relevant to {{company_name}}, I'd be glad to share a couple of examples. If not, no problem at all.

Regards,
{{sender_name}}`,
    followup: `Hi {{first_name}},

Just a brief follow-up on my note last week about ${o.offer}. If it isn't a priority for {{company_name}} right now, no need to reply and I won't contact you again about it.

Regards,
{{sender_name}}`,
  };
}

/** Rep dashboard templates (one per industry). Same ids/names every time so a rep can find them. */
export function repTemplates() {
  return OFFERS.map((o) => ({
    id: `industry_${o.industry.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name: `Industry: ${o.industry}`,
    subject: "Reducing admin load at {{company}}",
    body: `Hi {{name}},\n\nI'm reaching out from The Digital Dude, a small web and software studio. We build ${o.offer}.\n\nIf that could be relevant to {{company}}, I'd be glad to share a couple of examples or set up a short call: {{referral_link}}\n\nIf not, no problem at all.\n\nBest,\n{{rep_name}}`,
  }));
}
