import { describe, it, expect, vi } from "vitest";
import { loadReplyContext, NO_SUGGESTION, suggestReply, validateSuggestion, type ReplyContext } from "@/lib/acquisition/replies/suggest";
import type { AiProvider } from "@/lib/acquisition/providers/ai";
import { fakeDb } from "./helpers/fakedb";

const ctx = (o: Partial<ReplyContext> = {}): ReplyContext => ({
  replyId: "r1", contactId: "c1", contactName: "Dan Lee", contactEmail: "dan@plum.com.au", companyId: "co1", companyName: "Plum", ownerEmployeeId: "rep1",
  classification: "interested", theirReply: "Sounds good, can you send some examples?", ourEmail: "Hi Dan, we build tools...", senderName: "Neil", ...o,
});
const ai = (reply: string) => ({ completeJson: vi.fn(async () => JSON.stringify({ reply })) }) as unknown as AiProvider & { completeJson: ReturnType<typeof vi.fn> };
const BOOK = "https://digitaldude.co.uk/book";

describe("validateSuggestion", () => {
  it("accepts a short plain reply and rejects markup, merge tags, and absurd lengths", () => {
    expect(validateSuggestion("Thanks Dan, happy to share examples on a short call.", null)).toBeTruthy();
    expect(validateSuggestion("short", null)).toBeNull();
    expect(validateSuggestion("x".repeat(1300), null)).toBeNull();
    expect(validateSuggestion("Thanks {{first_name}}, happy to chat about it.", null)).toBeNull();
    expect(validateSuggestion("Thanks <b>Dan</b>, happy to chat about it.", null)).toBeNull();
  });
  it("allows only the booking link, never any other URL", () => {
    expect(validateSuggestion(`Happy to talk, book a time here: ${BOOK}.`, BOOK)).toBeTruthy();
    expect(validateSuggestion("Happy to talk, see https://evil.example/x for details.", BOOK)).toBeNull();
    expect(validateSuggestion(`Happy to talk, book a time here: ${BOOK}`, null)).toBeNull(); // no booking link configured
  });
});

describe("suggestReply", () => {
  it("never answers opt-outs, bounces or out-of-office mail, and does not even call the model", async () => {
    const model = ai("This should never be used by anyone at all.");
    for (const classification of NO_SUGGESTION) expect(await suggestReply(model, ctx({ classification }), { bookingUrl: null })).toBeNull();
    expect(model.completeJson).not.toHaveBeenCalled();
  });

  it("returns null without an AI provider, or when the model answer breaks the rules", async () => {
    expect(await suggestReply(null, ctx(), { bookingUrl: null })).toBeNull();
    expect(await suggestReply(ai("Visit https://evil.example/now to claim your offer today."), ctx(), { bookingUrl: BOOK })).toBeNull();
    expect(await suggestReply({ completeJson: async () => "not json" } as unknown as AiProvider, ctx(), { bookingUrl: null })).toBeNull();
  });

  it("returns a validated suggestion and gives the model only the conversation, with quoted text removed", async () => {
    const model = ai(`Thanks Dan, happy to send a couple of examples. You can pick a time here: ${BOOK}`);
    const out = await suggestReply(model, ctx({ theirReply: "Yes please.\n\nOn Mon, Neil wrote:\n> Hi Dan" }), { senderName: "Neil", bookingUrl: BOOK });
    expect(out).toContain(BOOK);
    const call = model.completeJson.mock.calls[0][0] as { system: string; user: string };
    expect(call.user).toContain("Yes please.");
    expect(call.user).not.toContain("> Hi Dan");
    expect(call.system).toMatch(/Do not invent/);
  });
});

describe("loadReplyContext", () => {
  it("gathers the reply, contact, company owner and what we originally sent", async () => {
    const { db } = fakeDb({
      acq_replies: [{ id: "r1", contact_id: "c1", classification: "interested", body: "Yes please", acq_contacts: { id: "c1", name: "Dan", email: "dan@plum.com.au", company_id: "co1", acq_companies: { id: "co1", name: "Plum", owner_employee_id: "rep1" } } }],
      acq_campaign_leads: [{ id: "l1", contact_id: "c1", created_at: "1", acq_campaigns: { sender_name: "Neil" } }],
      acq_email_messages: [{ campaign_lead_id: "l1", direction: "outbound", status: "sent", body: "Hi Dan, original email", created_at: "1" }],
    });
    expect(await loadReplyContext(db, "r1")).toMatchObject({ contactEmail: "dan@plum.com.au", companyName: "Plum", ownerEmployeeId: "rep1", classification: "interested", ourEmail: "Hi Dan, original email", senderName: "Neil" });
    expect(await loadReplyContext(db, "missing")).toBeNull();
  });

  it("falls back to the rep's own outreach log when there is no campaign email", async () => {
    const { db } = fakeDb({
      acq_replies: [{ id: "r1", contact_id: "c1", classification: "interested", body: "Yes", acq_contacts: { id: "c1", name: "Dan", email: "dan@plum.com.au", company_id: "co1", acq_companies: { id: "co1", name: "Plum", owner_employee_id: "rep1" } } }],
      rep_outreach_logs: [{ recipient_email: "dan@plum.com.au", body_content: "Rep wrote this", sent_at: "2026-10-01" }],
    });
    expect((await loadReplyContext(db, "r1"))?.ourEmail).toBe("Rep wrote this");
  });
});

describe("review hardening", () => {
  it("rejects bare web addresses in a suggestion, but still allows the booking link text", () => {
    expect(validateSuggestion("Happy to help, see www.evil.example for details please.", null)).toBeNull();
    expect(validateSuggestion("Happy to help, see evil.io/offer for details please.", null)).toBeNull();
    expect(validateSuggestion("Happy to help, call me on Tuesday if that suits you.", null)).toBeTruthy();
    expect(validateSuggestion(`Happy to help, book a time here: ${BOOK}`, BOOK)).toBeTruthy();
  });

  it("only ever loads the caller's own earlier email, never another rep's", async () => {
    const seed = {
      acq_replies: [{ id: "r1", contact_id: "c1", classification: "interested", body: "Yes", acq_contacts: { id: "c1", name: "Dan", email: "dan@plum.com.au", company_id: "co1", acq_companies: { id: "co1", name: "Plum", owner_employee_id: "rep1" } } }],
      rep_outreach_logs: [{ employee_id: "rep2", recipient_email: "dan@plum.com.au", body_content: "OTHER REP SECRET", sent_at: "2026-10-02" }, { employee_id: "rep1", recipient_email: "dan@plum.com.au", body_content: "my own email", sent_at: "2026-10-01" }],
    };
    expect((await loadReplyContext(fakeDb(seed).db, "r1", { employeeId: "rep1" }))?.ourEmail).toBe("my own email");
    const onlyOther = { ...seed, rep_outreach_logs: [seed.rep_outreach_logs[0]] };
    expect((await loadReplyContext(fakeDb(onlyOther).db, "r1", { employeeId: "rep1" }))?.ourEmail).toBeNull();
  });
});
