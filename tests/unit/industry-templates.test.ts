import { describe, it, expect } from "vitest";
import { INDUSTRY_NAMES, campaignTemplateFor, findIndustry, repTemplates } from "@/lib/industryTemplates";
import { checkCampaignCompliance, findUnknownTags, renderMessage } from "@/lib/acquisition/compliance/templates";

const identity = { sender_name: "Neil", sender_business: "The Digital Dude", sender_postal_address: "Dhanmondi, Dhaka, Bangladesh", sender_email: "neil@digitaldude.co.uk" };
const REP_TAGS = new Set(["name", "company", "rep_name", "referral_link"]);

describe("industry templates", () => {
  it("covers every seeded market industry", () => {
    expect(INDUSTRY_NAMES).toEqual(["Business automation", "Property management", "Recruitment agencies", "Logistics", "Travel agencies", "Education providers", "Home services"]);
    expect(findIndustry("  property MANAGEMENT ")).toBeTruthy();
    expect(findIndustry("Underwater basket weaving")).toBeNull();
    expect(campaignTemplateFor("Underwater basket weaving")).toBeNull();
  });

  it.each(INDUSTRY_NAMES)("%s: the admin template passes the campaign compliance check and uses only known merge tags", (industry) => {
    const t = campaignTemplateFor(industry)!;
    for (const text of [t.subject, t.body, t.followup]) expect(findUnknownTags(text)).toEqual([]);
    expect(checkCampaignCompliance({ ...identity, subject_template: t.subject, body_template: t.body, followup_enabled: true, followup_body_template: t.followup })).toEqual([]);
  });

  it.each(INDUSTRY_NAMES)("%s: renders with the sender identity and a working unsubscribe line, and makes no claims about the recipient", (industry) => {
    const t = campaignTemplateFor(industry)!;
    const { body } = renderMessage({ ...identity, subject_template: t.subject }, t.body, { first_name: "Dan", company_name: "Plum", observation: "" }, "https://x.test/u?t=1");
    expect(body).toContain("https://x.test/u?t=1");
    expect(body).toContain("Dhanmondi, Dhaka, Bangladesh");
    expect(body).not.toMatch(/\{\{/);
    expect(body).not.toMatch(/guarantee|best in|#1|leading|proven|increase your (revenue|sales)/i);
    expect(body).not.toMatch(/property management business/i); // no industry hard-wired into the footer
  });

  it("rep templates use only the tags the rep composer fills in, one per industry, with stable ids", () => {
    const list = repTemplates();
    expect(list).toHaveLength(INDUSTRY_NAMES.length);
    expect(new Set(list.map((t) => t.id)).size).toBe(list.length);
    for (const t of list) {
      for (const m of `${t.subject} ${t.body}`.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)) expect(REP_TAGS.has(m[1])).toBe(true);
      expect(t.name).toMatch(/^Industry: /);
    }
  });
});
