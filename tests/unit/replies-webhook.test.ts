import { describe, it, expect } from "vitest";
import { classifyByRules, classifyReply, stripQuoted } from "@/lib/acquisition/replies/classify";
import { verifyHmacSignature, signWebhookBody, WebhookAuthError, listUnsubscribeHeaders } from "@/lib/acquisition/providers/email";
import { backoffSeconds } from "@/lib/acquisition/queue/worker";
import type { AiProvider } from "@/lib/acquisition/providers/ai";

const ai = (json: unknown): AiProvider => ({ name: "t", model: "t", completeJson: async () => JSON.stringify(json) });

describe("reply classification", () => {
  it.each([
    ["Please unsubscribe me", "opt_out"],
    ["Remove me from your list.", "opt_out"],
    ["Stop emailing us, this is spam", "opt_out"],
    ["Thanks but not interested", "not_interested"],
    ["I am out of the office until Monday", "out_of_office"],
    ["Automatic reply: on leave", "out_of_office"],
    ["Mail Delivery Notification: undeliverable", "bounce"],
  ])("%s -> %s", (text, expected) => expect(classifyByRules(text)?.classification).toBe(expected));

  it("an opt-out wins over a polite no or an auto-reply", () => {
    expect(classifyByRules("Not interested. Please remove me.")?.classification).toBe("opt_out");
  });
  it("ignores quoted history and our own footer", () => {
    const reply = "Sounds interesting, can we talk Tuesday?\n\nOn Mon, 5 Oct 2026, Neil wrote:\n> If you'd rather not hear from us, unsubscribe here\n";
    expect(stripQuoted(reply)).toBe("Sounds interesting, can we talk Tuesday?");
    expect(classifyByRules(reply)).toBeNull();
    expect(classifyByRules("Yes please.\n--\nIf you'd rather not hear from us, unsubscribe here: https://x")).toBeNull();
  });
  it("returns null (needs AI/human) for ordinary replies", () => {
    expect(classifyByRules("Sure, send me some examples")).toBeNull();
  });
  it("without AI, an unclear reply is uncertain (goes to the inbox)", async () => {
    expect(await classifyReply("Sure, send examples", null)).toMatchObject({ classification: "uncertain" });
  });
  it("AI 'interested' needs high confidence, otherwise a human decides", async () => {
    expect((await classifyReply("send examples", ai({ classification: "interested", confidence: 0.9 }))).classification).toBe("interested");
    expect((await classifyReply("send examples", ai({ classification: "interested", confidence: 0.5 }))).classification).toBe("uncertain");
  });
  it("AI failure or garbage output degrades to uncertain, never to 'interested'", async () => {
    expect((await classifyReply("hmm", ai({ classification: "banana", confidence: 1 }))).classification).toBe("uncertain");
    const broken: AiProvider = { name: "t", model: "t", completeJson: async () => { throw new Error("down"); } };
    expect((await classifyReply("hmm", broken)).classification).toBe("uncertain");
  });
  it("rules run before the AI so an opt-out can't be argued away by the model", async () => {
    expect((await classifyReply("unsubscribe", ai({ classification: "interested", confidence: 1 }))).classification).toBe("opt_out");
  });
});

describe("webhook signatures", () => {
  const secret = "s".repeat(32);
  const body = JSON.stringify({ events: [{ id: "1", type: "delivered", email: "a@b.com" }] });
  const nowS = 1_800_000_000;
  const headers = (o: Record<string, string>) => new Headers(o);
  const good = () => headers({ "x-acq-timestamp": String(nowS), "x-acq-signature": signWebhookBody(body, secret, nowS) });

  it("accepts a valid signature", () => expect(() => verifyHmacSignature(body, good(), secret, nowS * 1000)).not.toThrow());
  it("rejects a tampered body", () => expect(() => verifyHmacSignature(body + " ", good(), secret, nowS * 1000)).toThrow(WebhookAuthError));
  it("rejects the wrong secret, a missing signature and a malformed one", () => {
    expect(() => verifyHmacSignature(body, good(), "z".repeat(32), nowS * 1000)).toThrow(WebhookAuthError);
    expect(() => verifyHmacSignature(body, headers({ "x-acq-timestamp": String(nowS) }), secret, nowS * 1000)).toThrow(WebhookAuthError);
    expect(() => verifyHmacSignature(body, headers({ "x-acq-timestamp": String(nowS), "x-acq-signature": "sha256=zz" }), secret, nowS * 1000)).toThrow(WebhookAuthError);
  });
  it("rejects replays outside the 5 minute window", () => {
    expect(() => verifyHmacSignature(body, good(), secret, (nowS + 301) * 1000)).toThrow(/Stale/);
    expect(() => verifyHmacSignature(body, good(), secret, (nowS - 301) * 1000)).toThrow(/Stale/);
    expect(() => verifyHmacSignature(body, good(), secret, (nowS + 299) * 1000)).not.toThrow();
  });
  it("a timestamp swap invalidates the signature", () => {
    const h = headers({ "x-acq-timestamp": String(nowS + 1), "x-acq-signature": signWebhookBody(body, secret, nowS) });
    expect(() => verifyHmacSignature(body, h, secret, nowS * 1000)).toThrow(WebhookAuthError);
  });
});

describe("misc", () => {
  it("emits one-click unsubscribe headers", () => {
    expect(listUnsubscribeHeaders("https://x/u")).toEqual({ "List-Unsubscribe": "<https://x/u>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
  });
  it("backs off exponentially with a cap", () => {
    expect([1, 2, 3].map(backoffSeconds)).toEqual([60, 120, 240]);
    expect(backoffSeconds(20)).toBe(3600);
  });
});
