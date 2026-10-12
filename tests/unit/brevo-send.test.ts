import { describe, it, expect, vi, afterEach } from "vitest";
import { BrevoProvider, mapBrevoEvent, ProviderRejectedError, WebhookAuthError, type EmailProvider, type OutboundEmail } from "@/lib/acquisition/providers/email";
import { sendMessage, sydneyDayKey, sydneyDayStart } from "@/lib/acquisition/queue/send";
import { isAllowedRecipient } from "@/lib/acquisition/env";
import type { Db } from "@/lib/acquisition/db";

const SECRET = "w".repeat(24);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Brevo webhook auth + mapping", () => {
  const body = JSON.stringify({ event: "delivered", email: "a@b.com.au", id: 7, "message-id": "<m1@x>", ts_event: 1700000000 });

  it("fails closed without a configured secret", () => {
    vi.stubEnv("ACQ_WEBHOOK_SECRET", "");
    expect(() => new BrevoProvider().verifyAndParseWebhook(body, new Headers({ authorization: `Bearer ${SECRET}` }))).toThrow(WebhookAuthError);
  });
  it("rejects a missing or wrong token", () => {
    vi.stubEnv("ACQ_WEBHOOK_SECRET", SECRET);
    expect(() => new BrevoProvider().verifyAndParseWebhook(body, new Headers())).toThrow(WebhookAuthError);
    expect(() => new BrevoProvider().verifyAndParseWebhook(body, new Headers({ authorization: "Bearer nope" }))).toThrow(WebhookAuthError);
    expect(() => new BrevoProvider().verifyAndParseWebhook(body, new Headers(), "https://x/y?token=nope")).toThrow(WebhookAuthError);
  });
  it("accepts a bearer header or a ?token= query", () => {
    vi.stubEnv("ACQ_WEBHOOK_SECRET", SECRET);
    const p = new BrevoProvider();
    expect(p.verifyAndParseWebhook(body, new Headers({ authorization: `Bearer ${SECRET}` }))).toHaveLength(1);
    expect(p.verifyAndParseWebhook(body, new Headers(), `https://x/y?token=${SECRET}`)).toHaveLength(1);
  });
  it("maps Brevo events to normalised events and ignores the rest", () => {
    const m = (event: string) => mapBrevoEvent({ event, email: "a@b.com.au", id: 1 });
    expect(m("delivered")?.type).toBe("delivered");
    expect(m("hard_bounce")).toMatchObject({ type: "bounced", bounceType: "hard" });
    expect(m("invalid_email")).toMatchObject({ type: "bounced", bounceType: "hard" });
    expect(m("soft_bounce")).toMatchObject({ type: "bounced", bounceType: "soft" });
    expect(m("spam")?.type).toBe("complained");
    expect(m("unsubscribe")?.type).toBe("unsubscribed");
    expect(m("opened")).toBeNull();
    expect(m("request")).toBeNull();
    expect(mapBrevoEvent({ event: "delivered" })).toBeNull();
  });
  it("accepts an array payload", () => {
    vi.stubEnv("ACQ_WEBHOOK_SECRET", SECRET);
    const arr = JSON.stringify([{ event: "delivered", email: "a@b.com", id: 1 }, { event: "opened", email: "a@b.com", id: 2 }]);
    expect(new BrevoProvider().verifyAndParseWebhook(arr, new Headers({ authorization: `Bearer ${SECRET}` }))).toHaveLength(1);
  });
});

describe("BrevoProvider.send", () => {
  const msg: OutboundEmail = {
    to: "lead@example.com.au",
    from: { name: "Neil", email: "hello@mail.digitaldude.co.uk" },
    replyTo: { name: "Neil", email: "neil@digitaldude.co.uk" },
    subject: "Hi",
    text: "Body",
    headers: { "List-Unsubscribe": "<https://x>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };

  it("posts plain text with sender, reply-to and one-click unsubscribe headers", async () => {
    vi.stubEnv("BREVO_API_KEY", "k");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ messageId: "<abc@x>" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await new BrevoProvider().send(msg);
    expect(r.providerMessageId).toBe("<abc@x>");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ sender: msg.from, replyTo: msg.replyTo, to: [{ email: "lead@example.com.au" }], textContent: "Body", headers: msg.headers });
    expect(sent.htmlContent).toBeUndefined();
  });
  it("a 4xx is a definite rejection; a 5xx or network error is an unknown outcome", async () => {
    vi.stubEnv("BREVO_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "bad sender" }), { status: 400 })));
    await expect(new BrevoProvider().send(msg)).rejects.toBeInstanceOf(ProviderRejectedError);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 502 })));
    const e1 = await new BrevoProvider().send(msg).catch((e) => e);
    expect(e1).not.toBeInstanceOf(ProviderRejectedError);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    const e2 = await new BrevoProvider().send(msg).catch((e) => e);
    expect(e2).not.toBeInstanceOf(ProviderRejectedError);
    expect(String(e2.message)).toMatch(/unknown/);
  });
});

describe("recipient allowlist", () => {
  it("allows everyone when unset, otherwise only listed emails/domains", () => {
    expect(isAllowedRecipient("a@b.com", null)).toBe(true);
    expect(isAllowedRecipient("me@gmail.com", ["me@gmail.com"])).toBe(true);
    expect(isAllowedRecipient("ME@gmail.com", ["me@gmail.com"])).toBe(true);
    expect(isAllowedRecipient("other@gmail.com", ["me@gmail.com"])).toBe(false);
    expect(isAllowedRecipient("x@mine.com.au", ["mine.com.au"])).toBe(true);
    expect(isAllowedRecipient("x@notmine.com.au", ["mine.com.au"])).toBe(false);
  });
});

describe("Sydney day helpers", () => {
  it("day start is midnight Sydney time", () => {
    const now = new Date("2026-10-12T20:00:00Z"); // 07:00 on 13 Oct in Sydney (AEDT, +11)
    expect(sydneyDayKey(now)).toBe("2026-10-13");
    expect(sydneyDayStart(now).toISOString()).toBe("2026-10-12T13:00:00.000Z");
  });
});

/** Minimal chainable fake of the supabase client for sendMessage(). */
function fakeDb(message: Record<string, unknown>) {
  const updates: { table: string; values: Record<string, unknown> }[] = [];
  const audits: string[] = [];
  const db = {
    from(table: string) {
      let mode: "select" | "update" | "insert" = "select";
      let values: Record<string, unknown> = {};
      const b: Record<string, unknown> = {
        select: () => b,
        eq: () => b,
        single: async () => ({ data: message, error: null }),
        update: (v: Record<string, unknown>) => {
          mode = "update";
          values = v;
          return b;
        },
        insert: (v: Record<string, unknown>) => {
          mode = "insert";
          if (table === "acq_audit_logs") audits.push(String(v.action));
          return b;
        },
        then: (resolve: (v: unknown) => void) => {
          if (mode === "update") updates.push({ table, values });
          resolve({ data: [{ id: "x" }], error: null });
        },
      };
      return b;
    },
  };
  return { db: db as unknown as Db, updates, audits };
}

const baseMessage = {
  id: "m1", subject: "Hi", body: "Body", kind: "initial", direction: "outbound", status: "approved", campaign_lead_id: "l1",
  acq_campaign_leads: { id: "l1", campaign_id: "c1", contact_id: "ct1", acq_campaigns: { sender_name: "Neil", sender_email: "neil@digitaldude.co.uk" }, acq_contacts: { email: "me@example.com.au" } },
};
const okProvider = (send = vi.fn(async (_m: OutboundEmail) => ({ providerMessageId: "<p1@x>" }))): EmailProvider & { send: typeof send } => ({ name: "t", send, verifyAndParseWebhook: () => [] });

describe("sendMessage", () => {
  const env = () => vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "u".repeat(40));
  const deps = { senderEmail: "hello@mail.digitaldude.co.uk", allowlist: null };

  it("reserves, sends once, then records sent", async () => {
    env();
    const { db, updates } = fakeDb(baseMessage);
    const provider = okProvider();
    const reserve = vi.fn(async () => ({ ok: true as const }));
    const r = await sendMessage(db, "m1", { ...deps, provider, reserve });
    expect(r).toEqual({ status: "sent", providerMessageId: "<p1@x>" });
    expect(reserve).toHaveBeenCalledOnce();
    expect(provider.send).toHaveBeenCalledOnce();
    const sent = provider.send.mock.calls[0][0];
    expect(sent.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(sent.from.email).toBe("hello@mail.digitaldude.co.uk");
    expect(updates.find((u) => u.table === "acq_email_messages")?.values).toMatchObject({ status: "sent", provider_message_id: "<p1@x>" });
    expect(updates.find((u) => u.table === "acq_campaign_leads")?.values).toMatchObject({ status: "sent", sequence_step: 1 });
  });

  it("never calls the provider when the database gate says no", async () => {
    env();
    const { db, updates } = fakeDb(baseMessage);
    const provider = okProvider();
    for (const reason of ["sending_paused", "suppressed", "daily_limit_reached", "campaign_content_changed", "consent_invalid"]) {
      const r = await sendMessage(db, "m1", { ...deps, provider, reserve: async () => ({ ok: false, reason }) });
      expect(r).toEqual({ status: "skipped", reason });
    }
    expect(provider.send).not.toHaveBeenCalled();
    expect(updates).toHaveLength(0);
  });

  it("refuses recipients outside the allowlist before reserving", async () => {
    env();
    const { db } = fakeDb(baseMessage);
    const provider = okProvider();
    const reserve = vi.fn(async () => ({ ok: true as const }));
    const r = await sendMessage(db, "m1", { ...deps, allowlist: ["someone@else.com"], provider, reserve });
    expect(r).toEqual({ status: "skipped", reason: "not_in_allowlist" });
    expect(reserve).not.toHaveBeenCalled();
    expect(provider.send).not.toHaveBeenCalled();
  });

  it("does nothing without a configured sender or for follow-ups", async () => {
    env();
    const provider = okProvider();
    const reserve = vi.fn(async () => ({ ok: true as const }));
    expect(await sendMessage(fakeDb(baseMessage).db, "m1", { allowlist: null, senderEmail: null, provider, reserve })).toMatchObject({ status: "skipped", reason: "sender_not_configured" });
    expect(await sendMessage(fakeDb({ ...baseMessage, kind: "follow_up" }).db, "m1", { ...deps, provider, reserve })).toMatchObject({ status: "skipped" });
    expect(reserve).not.toHaveBeenCalled();
  });

  it("a definite provider rejection marks the message failed", async () => {
    env();
    const { db, updates } = fakeDb(baseMessage);
    const provider = okProvider(vi.fn(async () => { throw new ProviderRejectedError("bad sender", 400); }));
    const r = await sendMessage(db, "m1", { ...deps, provider, reserve: async () => ({ ok: true }) });
    expect(r.status).toBe("failed");
    expect(updates.find((u) => u.table === "acq_email_messages")?.values).toEqual({ status: "failed" });
  });

  it("an ambiguous failure leaves the message in 'sending' (no status write, no retry)", async () => {
    env();
    const { db, updates, audits } = fakeDb(baseMessage);
    const provider = okProvider(vi.fn(async () => { throw new Error("timeout, outcome unknown"); }));
    const r = await sendMessage(db, "m1", { ...deps, provider, reserve: async () => ({ ok: true }) });
    expect(r.status).toBe("unknown");
    expect(updates).toHaveLength(0);
    expect(audits).toContain("send.outcome_unknown");
  });
});
