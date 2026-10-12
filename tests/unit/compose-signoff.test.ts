import { describe, it, expect, vi } from "vitest";
import { composeEmail, composeFollowUp, stripSignOff, type ComposeContext } from "@/lib/acquisition/drafting/compose";
import type { AiProvider } from "@/lib/acquisition/providers/ai";

const ctx: ComposeContext = {
  companyName: "Plum Property", industry: "Property management", country: "AU", contactFirstName: "Dan", contactRole: "Principal",
  facts: [{ claim: "Manages 40 rental properties in Brisbane", evidence: "We look after 40 rental properties", sourceUrl: "https://plum.com.au/about" }], angle: null,
};
const body = "Hi Dan,\n\nI saw Plum Property manages 40 rental properties in Brisbane. We build owner reporting tools. Is that done by hand today?";
const model = (reply: unknown) => ({ completeJson: vi.fn(async () => JSON.stringify(reply)) }) as unknown as AiProvider;

describe("stripSignOff: the signature comes from the template or the system, never from the AI", () => {
  it("removes common sign-offs and the name under them", () => {
    expect(stripSignOff("Is that done by hand?\n\nRegards,\nNeil")).toBe("Is that done by hand?");
    expect(stripSignOff("Is that done by hand?\n\nBest,\nFarhad | The Digital Dude")).toBe("Is that done by hand?");
    expect(stripSignOff("Is that done by hand?\n\nKind regards,\nFarhad")).toBe("Is that done by hand?");
    expect(stripSignOff("Is that done by hand?\n\nThanks,\nNeil")).toBe("Is that done by hand?");
    expect(stripSignOff("Is that done by hand?\n\nCheers")).toBe("Is that done by hand?");
    expect(stripSignOff("Is that done by hand?\n\n- Neil")).toBe("Is that done by hand?");
  });
  it("leaves the message itself alone, including a 'thanks' in the middle", () => {
    expect(stripSignOff("Thanks for your time earlier.\n\nIs that done by hand?")).toBe("Thanks for your time earlier.\n\nIs that done by hand?");
    expect(stripSignOff("Hi Dan,\n\nIs that done by hand?")).toBe("Hi Dan,\n\nIs that done by hand?");
  });

  it("a first email the AI signed comes back without the sign-off", async () => {
    const out = await composeEmail(model({ subject: "Owner reporting at Plum", body: `${body}\n\nRegards,\nNeil`, used_facts: [1] }), ctx, { senderName: "Neil" });
    expect(out?.body).toBe(body);
    expect(out?.body).not.toMatch(/regards|neil/i);
  });
  it("a follow-up the AI signed comes back without the sign-off", async () => {
    const prev = { subject: "Owner reporting at Plum", body, sentAt: "2026-10-01T00:00:00Z" };
    const out = await composeFollowUp(model({ body: "Hi Dan, a quick second note on owner reporting. No worries if the timing is off.\n\nBest,\nNeil", used_facts: [] }), ctx, prev, { senderName: "Neil" });
    expect(out?.body).toBe("Hi Dan, a quick second note on owner reporting. No worries if the timing is off.");
  });
  it("the prompts tell the model not to sign off", async () => {
    const m = model({ subject: "Owner reporting at Plum", body, used_facts: [1] }) as unknown as { completeJson: ReturnType<typeof vi.fn> };
    await composeEmail(m as unknown as AiProvider, ctx, { senderName: "Neil" });
    expect((m.completeJson.mock.calls[0][0] as { system: string }).system).toMatch(/do NOT add a sign-off or your name/i);
  });
});
