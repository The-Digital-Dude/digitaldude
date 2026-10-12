import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

const ai = { completeJson: vi.fn() };
vi.mock("@/lib/acquisition/ai-config", () => ({ resolveAiProvider: async () => ai }));

import { buildLeadDraft } from "@/lib/acquisition/drafting/build";
import { fakeDb } from "./helpers/fakedb";

const BOOK = "https://digitaldude.co.uk/book";
const campaign = {
  id: "camp1", sender_name: "Neil", sender_business: "The Digital Dude", sender_postal_address: "Dhanmondi, Dhaka, Bangladesh", sender_email: "neil@digitaldude.co.uk",
  subject_template: "Reducing admin load at {{company_name}}", body_template: "Hi {{first_name}},\n\n{{observation}}\n\nTemplate body for {{company_name}}.\n\nRegards,\n{{sender_name}}",
  ai_compose: true, followup_enabled: true,
};
const seed = () => ({
  acq_contacts: [{ id: "ct1", name: "Dan Lee", email: "dan@plum.com.au", role: "Principal", company_id: "co1", acq_companies: { id: "co1", name: "Plum Property", industry: "Property management", country: "AU", potential_opportunity: "owner reports", owner_employee_id: null, status: "researched" } }],
  acq_research_records: [{ company_id: "co1", observed_fact: "Manages 40 rental properties in Brisbane", evidence_excerpt: "We look after 40 rental properties", source_url: "https://plum.com.au/about", strength: 0.9 }],
  acq_campaign_leads: [], acq_email_messages: [], acq_audit_logs: [],
});
const good = {
  subject: "Reducing admin at Plum Property",
  // The model is told not to sign off, but if it does, the system strips it: the sign-off below is added exactly once by the system.
  body: "Hi Dan,\n\nI saw that Plum Property manages 40 rental properties in Brisbane. We build owner reporting and workflow automation.\n\nIs owner reporting something you do by hand?\n\nRegards,\nNeil",
  followup_body: "Hi Dan, a quick second note on owner reporting. No worries if the timing is off, no reply needed.\n\nBest,\nNeil",
  used_facts: [1],
};

beforeEach(() => {
  vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "s".repeat(32));
  vi.stubEnv("ACQ_BOOKING_URL", BOOK);
  ai.completeJson.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("buildLeadDraft with AI compose", () => {
  it("writes the email and the follow-up from the verified research, each with the system footer and a signed unsubscribe link", async () => {
    // First call: the one-sentence observation (existing step). Second: the composed email.
    ai.completeJson.mockResolvedValueOnce(JSON.stringify({ observation: "" })).mockResolvedValueOnce(JSON.stringify(good));
    const { db, tables } = fakeDb(seed());
    await buildLeadDraft(db, campaign, "ct1");
    const msg = tables.acq_email_messages[0];
    expect(msg.subject).toBe(good.subject);
    expect(String(msg.body)).toContain("manages 40 rental properties");
    expect(String(msg.body)).toContain("Regards,\nNeil"); // the sign-off is added by the system, not the AI
    expect(String(msg.body)).not.toContain(BOOK); // no raw booking link in a cold email
    expect(String(msg.body)).toContain("Dhanmondi, Dhaka, Bangladesh");
    expect(String(msg.body)).toMatch(/unsubscribe here: https?:\/\/\S+t=/);
    const lead = tables.acq_campaign_leads[0];
    expect(lead.followup_subject).toBe("Following up: Reducing admin at Plum Property");
    expect(String(lead.followup_body)).toContain("no reply needed");
    expect(String(lead.followup_body)).toMatch(/unsubscribe here: https?:\/\/\S+t=/);
    expect(tables.acq_audit_logs.some((a) => JSON.stringify(a).includes("aiComposed"))).toBe(true);
  });

  it("falls back to the approved template (and stores no follow-up text) when the AI breaks a rule", async () => {
    const bad = { ...good, body: good.body.replace("40", "400") }; // a number that is not in the facts
    ai.completeJson.mockResolvedValueOnce(JSON.stringify({ observation: "" })).mockResolvedValueOnce(JSON.stringify(bad));
    const { db, tables } = fakeDb(seed());
    await buildLeadDraft(db, campaign, "ct1");
    expect(String(tables.acq_email_messages[0].body)).toContain("Template body for Plum Property");
    expect(tables.acq_campaign_leads[0].followup_body).toBeUndefined();
  });

  it("does not use the AI at all when the campaign has the option off", async () => {
    ai.completeJson.mockResolvedValue(JSON.stringify({ observation: "" }));
    const { db, tables } = fakeDb(seed());
    await buildLeadDraft(db, { ...campaign, ai_compose: false }, "ct1");
    expect(String(tables.acq_email_messages[0].body)).toContain("Template body for Plum Property");
    expect(ai.completeJson).toHaveBeenCalledTimes(1); // only the existing observation step
  });
});
