import { caseStudies } from "@/lib/content/caseStudies";

/**
 * The only facts the writing model may state as true about The Digital Dude. Everything else it writes must be general knowledge phrased
 * as advice, never as a claim about us, a client or a result. Keep this accurate: it is what stops invented statistics reaching the site.
 */
export const COMPANY_FACTS = `
- The Digital Dude is a custom software studio. The Digital Dude Ltd is registered in England and Wales. The engineering studio is in Dhaka, Bangladesh. Clients are in the United Kingdom and Australia and work with the team remotely, with calls and demos in the client's working hours.
- It builds custom CRMs, multi-tenant SaaS platforms, marketplaces, operations/ERP/HR systems, client portals, web applications, e-commerce platforms, AI features and does technical SEO.
- Delivery is in fixed-scope milestones with a weekly working demo on a staging environment. The client receives the full source code and the database, so there are no per-user licence fees and no vendor lock-in.
- Published typical price bands (USD, a guide before a discovery call, final price comes from a written scope): custom CRM roughly $5,500 to $12,000 in 4 to 6 weeks; multi-tenant SaaS platform roughly $8,000 to $16,000 in 6 to 8 weeks; two-sided or three-sided marketplace roughly $9,500 to $18,000 in 6 to 10 weeks; ERP/HRM/operations platform roughly $9,000 to $19,000.
- Typical running costs for a modern serverless stack: hosting and database roughly $50 to $200 a month for a small team, and roughly 10 to 15 per cent of the build cost per year for maintenance and improvements.
- Projects start with a discovery call and a written scope.
- A focused CRM typically takes 4 to 6 weeks to a first live release.
`.trim();

export interface Fact {
  text: string;
}

/** Real, published projects the model may mention (and nothing beyond what is written here). */
export function caseStudyFacts(): string {
  return caseStudies
    .map((c) => `- ${c.title} (/work/${c.slug}): ${c.summary}. Key facts: ${c.stats.join("; ")}.`)
    .join("\n");
}

/** Pages the post may link to. Anything else is rejected. */
export const STATIC_LINKS = [
  "/", "/about", "/contact", "/how-we-work", "/work", "/services", "/compare", "/blog",
  "/services/crm-development", "/services/saas-development", "/services/erp-hrm-systems", "/services/marketplace-development", "/services/website-development", "/services/seo-growth",
  "/industries/property", "/industries/travel", "/industries/home-services", "/industries/logistics", "/industries/recruitment", "/industries/education", "/industries/community",
  "/compare/custom-crm-vs-salesforce", "/compare/custom-crm-vs-hubspot", "/compare/custom-crm-vs-zoho", "/compare/custom-crm-vs-monday", "/compare/custom-crm-vs-pipedrive",
  "/compare/custom-marketplace-vs-sharetribe", "/compare/bespoke-erp-vs-netsuite", "/compare/custom-software-vs-bubble-no-code", "/compare/custom-ecommerce-vs-shopify", "/compare/custom-software-vs-airtable",
  "/blog/custom-crm-development-cost-uk", "/blog/off-the-shelf-crm-vs-custom-crm", "/blog/custom-software-development-cost-uk", "/blog/how-long-does-custom-software-take",
  "/blog/role-based-access-control-explained-simply", "/blog/two-sided-marketplace-architecture-decisions", "/blog/how-to-build-a-three-sided-marketplace-app",
  "/blog/why-growing-service-businesses-outgrow-spreadsheets", "/blog/what-a-discovery-call-needs-from-you", "/blog/ai-features-real-vs-pitch-line",
  "/blog/ai-phone-ordering-for-restaurants-build-or-buy", "/blog/google-ads-for-software-development-companies", "/blog/programmatic-seo-for-service-businesses",
];

export function allowedLinks(extra: string[] = []): Set<string> {
  const set = new Set<string>(STATIC_LINKS);
  for (const c of caseStudies) set.add(`/work/${c.slug}`);
  for (const e of extra) set.add(e);
  return set;
}

/**
 * Money, percentage and multiplier figures that the post is allowed to contain: only those that appear in the fact sheet or case
 * studies. A generated post containing any other such figure is rejected, because it would be an invented statistic.
 */
export function allowedFigures(): Set<string> {
  const text = `${COMPANY_FACTS}\n${caseStudyFacts()}`;
  return new Set(extractFigures(text));
}

const FIGURE_RE = /(?:[$£€]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|m|million|thousand))?)|(?:\d[\d,]*(?:\.\d+)?\s?(?:%|per cent|percent|x\b))/gi;

export function extractFigures(text: string): string[] {
  return (text.match(FIGURE_RE) ?? []).map((f) => f.toLowerCase().replace(/\s+/g, "").replace(/percent|per cent/, "%"));
}
