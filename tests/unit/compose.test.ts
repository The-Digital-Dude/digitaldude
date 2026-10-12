import { describe, it, expect, vi } from "vitest";
import { composeEmail, hasForeignLink, loadComposeContext, validateComposed, type ComposeContext } from "@/lib/acquisition/drafting/compose";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { fakeDb } from "./helpers/fakedb";

const BOOK = "https://digitaldude.co.uk/book";
const ctx = (o: Partial<ComposeContext> = {}): ComposeContext => ({
  companyName: "Plum Property", industry: "Property management", country: "AU", contactFirstName: "Dan", contactRole: "Principal",
  facts: [{ claim: "Manages 40 rental properties in Brisbane", evidence: "We look after 40 rental properties across Brisbane", sourceUrl: "https://plum.com.au/about" }],
  angle: "owner reporting automation", ...o,
});
const good = {
  subject: "Reducing admin at Plum Property",
  body: `Hi Dan,\n\nI saw that Plum Property manages 40 rental properties in Brisbane. We build owner reporting and workflow automation for property teams.\n\nWould a short call be useful?\n${BOOK}\n\nRegards,\nNeil`,
  followup_body: "Hi Dan, a brief follow-up on my note. No reply needed if it is not a priority right now.\n\nRegards,\nNeil",
  used_facts: [1],
};

describe("validateComposed", () => {
  it("accepts a grounded email, with and without a follow-up", () => {
    expect(validateComposed(good, ctx(), BOOK, true)).toMatchObject({ subject: good.subject, usedFacts: [1] });
    expect(validateComposed({ ...good, followup_body: undefined }, ctx(), BOOK, false)).toBeTruthy();
  });

  it("rejects numbers that are not in the verified facts", () => {
    expect(validateComposed({ ...good, body: good.body.replace("40", "400") }, ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ ...good, body: good.body.replace("Brisbane.", "Brisbane and 12 other cities.") }, ctx(), BOOK, false)).toBeNull();
  });

  it("with no verified facts it may not claim any, and may not cite one", () => {
    const none = ctx({ facts: [] });
    const general = { ...good, body: `Hi Dan,\n\nWe build owner reporting and workflow automation for property teams. Would a short call be useful?\n${BOOK}\n\nRegards,\nNeil`, used_facts: [] };
    expect(validateComposed(general, none, BOOK, false)).toBeTruthy();
    expect(validateComposed({ ...general, used_facts: [1] }, none, BOOK, false)).toBeNull();
    expect(validateComposed({ ...general, body: general.body.replace("Hi Dan,", "Hi Dan, you manage 40 properties.") }, none, BOOK, false)).toBeNull();
  });

  it("rejects citing a fact number that does not exist", () => {
    expect(validateComposed({ ...good, used_facts: [2] }, ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ ...good, used_facts: [0] }, ctx(), BOOK, false)).toBeNull();
  });

  it("allows only the booking link: no other URLs, bare domains or email addresses", () => {
    expect(validateComposed({ ...good, body: good.body + "\nSee https://evil.example/x" }, ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ ...good, body: good.body + "\nOr visit www.evil.example" }, ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ ...good, body: good.body + "\nWrite to boss@evil.example" }, ctx(), BOOK, false)).toBeNull();
    expect(hasForeignLink(`Book here ${BOOK}`, BOOK)).toBe(false);
    expect(hasForeignLink(`Book here ${BOOK}`, null)).toBe(true);
  });

  it("requires the booking link as the ask when one is configured", () => {
    expect(validateComposed({ ...good, body: good.body.replace(BOOK, "") }, ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ ...good, body: good.body.replace(BOOK, "") }, ctx(), null, false)).toBeTruthy();
  });

  it("rejects hype, guarantees, markup, merge tags, reply-style subjects and wrong lengths", () => {
    for (const bad of [
      { ...good, body: good.body + "\nWe guarantee results." },
      { ...good, body: good.body + "\nThis offer is risk-free." },
      { ...good, subject: "Re: our chat" },
      { ...good, subject: "Hi {{first_name}}" },
      { ...good, body: good.body + "\n<b>bold</b>" },
      { ...good, body: "Too short." },
      { ...good, subject: "x" },
      { ...good, body: "word ".repeat(200) + BOOK },
    ]) expect(validateComposed(bad, ctx(), BOOK, false)).toBeNull();
  });

  it("when a follow-up is wanted it must be there and short", () => {
    expect(validateComposed({ ...good, followup_body: undefined }, ctx(), BOOK, true)).toBeNull();
    expect(validateComposed({ ...good, followup_body: "word ".repeat(100) }, ctx(), BOOK, true)).toBeNull();
  });

  it("rejects junk that is not the expected shape", () => {
    expect(validateComposed("not json", ctx(), BOOK, false)).toBeNull();
    expect(validateComposed({ subject: 1 }, ctx(), BOOK, false)).toBeNull();
  });
});

describe("composeEmail", () => {
  const ai = (reply: unknown) => ({ completeJson: vi.fn(async () => JSON.stringify(reply)) }) as unknown as AiProvider & { completeJson: ReturnType<typeof vi.fn> };

  it("does nothing without an AI provider, and falls back (null) when the model breaks the rules or fails", async () => {
    expect(await composeEmail(null, ctx(), { senderName: "Neil", bookingUrl: BOOK })).toBeNull();
    expect(await composeEmail(ai({ ...good, body: "short" }), ctx(), { senderName: "Neil", bookingUrl: BOOK })).toBeNull();
    expect(await composeEmail({ completeJson: async () => { throw new Error("quota"); } } as unknown as AiProvider, ctx(), { senderName: "Neil", bookingUrl: BOOK })).toBeNull();
  });

  it("sends the model only verified facts and context, numbered, and marks the angle as a hypothesis", async () => {
    const model = ai(good);
    expect(await composeEmail(model, ctx(), { senderName: "Neil", bookingUrl: BOOK, withFollowUp: true })).toBeTruthy();
    const call = model.completeJson.mock.calls[0][0] as { system: string; user: string };
    expect(call.user).toContain("1. Manages 40 rental properties in Brisbane");
    expect(call.user).toContain("hypothesis only");
    expect(call.system).toMatch(/Do not add, infer, exaggerate or guess/);
  });
});

describe("loadComposeContext", () => {
  it("collects the contact, company, owner and the strongest verified research", async () => {
    const { db } = fakeDb({
      acq_contacts: [{ id: "c1", name: "Dan Lee", email: "dan@plum.com.au", role: "Principal", company_id: "co1", acq_companies: { id: "co1", name: "Plum", industry: "Property management", country: "AU", potential_opportunity: "owner reports", owner_employee_id: "rep1", status: "researched" } }],
      acq_research_records: [{ company_id: "co1", observed_fact: "Lists 40 properties", evidence_excerpt: "40 properties", source_url: "https://plum.com.au", strength: 0.9 }, { company_id: "other", observed_fact: "Unrelated", evidence_excerpt: "x", source_url: "https://x", strength: 1 }],
    });
    const c = await loadComposeContext(db, "c1");
    expect(c).toMatchObject({ contactFirstName: "Dan", companyName: "Plum", ownerEmployeeId: "rep1", angle: "owner reports" });
    expect(c?.facts).toEqual([{ claim: "Lists 40 properties", evidence: "40 properties", sourceUrl: "https://plum.com.au" }]);
    expect(await loadComposeContext(db, "missing")).toBeNull();
  });
});
