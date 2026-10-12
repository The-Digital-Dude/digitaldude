import { describe, it, expect, vi, afterEach } from "vitest";
import { GmailReader, isAuthenticatedSender, parseAddress, pollReplies, stripQuoted, toInboundMail, type InboundMail, type MailReader } from "@/lib/acquisition/replies/gmail";
import { recordInboundReply } from "@/lib/acquisition/replies/process";
import { fakeDb } from "./helpers/fakedb";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const b64 = (s: string) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

describe("parsing", () => {
  it("parses addresses with and without a display name", () => {
    expect(parseAddress('"Dan Smith" <Dan@Plum.com.au>')).toEqual({ email: "dan@plum.com.au", name: "Dan Smith" });
    expect(parseAddress("dan@plum.com.au")).toEqual({ email: "dan@plum.com.au", name: "" });
  });

  it("strips the quoted original so only the reply text is classified", () => {
    const t = "Sounds good, call me Tuesday.\n\nOn Mon, 12 Oct 2026 at 10:00, Neil <n@x.com> wrote:\n> Hi Dan\n> we build tools";
    expect(stripQuoted(t)).toBe("Sounds good, call me Tuesday.");
    expect(stripQuoted("Yes\n> quoted line\nmore")).toBe("Yes\nmore");
  });

  it("extracts text, sender and automated flag from a Gmail message", () => {
    const m = toInboundMail({
      id: "m1",
      internalDate: String(Date.parse("2026-10-12T00:00:00Z")),
      payload: {
        headers: [{ name: "From", value: "Dan <dan@plum.com.au>" }, { name: "Subject", value: "Re: hi" }, { name: "Auto-Submitted", value: "auto-replied" }],
        parts: [{ mimeType: "text/html", body: { data: b64("<p>x</p>") } }, { mimeType: "text/plain", body: { data: b64("I am away until Friday") } }],
      },
    });
    expect(m).toMatchObject({ id: "m1", fromEmail: "dan@plum.com.au", subject: "Re: hi", body: "I am away until Friday", automated: true, receivedAt: "2026-10-12T00:00:00.000Z" });
  });
});

describe("GmailReader", () => {
  it("is only configured when all three credentials exist", () => {
    expect(GmailReader.configured()).toBe(false);
    vi.stubEnv("GMAIL_CLIENT_ID", "a");
    vi.stubEnv("GMAIL_CLIENT_SECRET", "b");
    expect(GmailReader.configured()).toBe(false);
    vi.stubEnv("GMAIL_REFRESH_TOKEN", "c");
    expect(GmailReader.configured()).toBe(true);
  });

  it("refreshes a token, lists new inbox mail excluding our own, and reads only the From header", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
      if (url.includes("/messages?")) return new Response(JSON.stringify({ messages: [{ id: "m1" }] }));
      return new Response(JSON.stringify({ id: "m1", payload: { headers: [{ name: "From", value: "Dan <dan@plum.com.au>" }] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const out = await new GmailReader({ clientId: "a", clientSecret: "b", refreshToken: "c" }).list(1700000000);
    expect(out).toEqual({ items: [{ id: "m1", fromEmail: "dan@plum.com.au" }], truncated: false });
    const urls = fetchMock.mock.calls.map((c) => decodeURIComponent(String(c[0])));
    expect(urls.some((u) => u.includes("in:inbox -from:me after:1700000000"))).toBe(true);
    expect(urls.some((u) => u.includes("format=metadata"))).toBe(true);
  });

  it("pages through the inbox, oldest first, and reports when there is still more it did not list", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("oauth2.googleapis.com")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
      if (url.includes("/messages?")) { calls++; return new Response(JSON.stringify({ messages: [{ id: `m${calls}a` }, { id: `m${calls}b` }], nextPageToken: "more" })); }
      return new Response(JSON.stringify({ payload: { headers: [{ name: "From", value: "x@y.com" }] } }));
    }));
    const out = await new GmailReader({ clientId: "a", clientSecret: "b", refreshToken: "c" }).list(1);
    expect(calls).toBe(5);
    expect(out.truncated).toBe(true);
    expect(out.items).toHaveLength(10);
    expect(out.items[0].id).toBe("m5b"); // reversed: oldest listed last by Gmail comes first
  });

  it("throws a clear error when Google rejects the credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })));
    await expect(new GmailReader({ clientId: "a", clientSecret: "b", refreshToken: "c" }).list(1)).rejects.toThrow(/Gmail auth failed/);
  });
});

describe("sender authentication", () => {
  it("trusts DMARC pass, or a DKIM pass for the From domain (or a parent/sub domain), and nothing else", () => {
    expect(isAuthenticatedSender("mx.google.com; dkim=pass header.i=@plum.com.au; spf=pass; dmarc=pass (p=NONE)", "dan@plum.com.au")).toBe(true);
    expect(isAuthenticatedSender("mx.google.com; dkim=pass header.i=@mail.plum.com.au header.s=x", "dan@plum.com.au")).toBe(true);
    expect(isAuthenticatedSender("mx.google.com; dkim=pass header.d=plum.com.au", "dan@mail.plum.com.au")).toBe(true);
    // A pass for somebody else's domain proves nothing about the claimed sender.
    expect(isAuthenticatedSender("mx.google.com; dkim=pass header.i=@attacker.example; spf=pass", "dan@plum.com.au")).toBe(false);
    expect(isAuthenticatedSender("mx.google.com; spf=pass smtp.mailfrom=attacker.example; dkim=none; dmarc=fail", "dan@plum.com.au")).toBe(false);
    expect(isAuthenticatedSender("", "dan@plum.com.au")).toBe(false);
  });
  it("marks a Gmail message authenticated from its headers", () => {
    const base = { id: "m", payload: { headers: [{ name: "From", value: "Dan <dan@plum.com.au>" }], parts: [] as never[] } };
    expect(toInboundMail(base).authenticated).toBe(false);
    expect(toInboundMail({ ...base, payload: { ...base.payload, headers: [...base.payload.headers, { name: "Authentication-Results", value: "mx.google.com; dmarc=pass" }] } }).authenticated).toBe(true);
  });
});

describe("pollReplies", () => {
  const mail = (o: Partial<InboundMail> & { id: string; fromEmail: string }): InboundMail => ({ fromName: "", subject: "Re", body: "Interested, call me", receivedAt: "2026-10-12T00:00:00Z", automated: false, authenticated: true, ...o });
  const reader = (items: InboundMail[], truncated = false): MailReader => ({ list: async () => ({ items: items.map((m) => ({ id: m.id, fromEmail: m.fromEmail })), truncated }), get: async (id) => items.find((m) => m.id === id)! });
  const now = new Date("2026-10-12T10:00:00Z");

  it("records replies from known contacts, ignores strangers, system mail and automated mail, and notifies the rep for their own prospects", async () => {
    const { db, tables } = fakeDb(
      {
        acq_contacts: [{ id: "c1", email_normalized: "dan@plum.com.au" }, { id: "c2", email_normalized: "ooo@plum.com.au" }],
        rep_outreach_logs: [{ employee_id: "r1", recipient_email: "prospect@own.com", recipient_name: "Pat", sent_at: "2026-10-01" }],
      },
      { unique: { acq_notifications: "dedupe_key" } }
    );
    const record = vi.fn<typeof recordInboundReply>(async () => ({ replyId: "rp1" }));
    const r = await pollReplies(
      db,
      reader([
        mail({ id: "1", fromEmail: "Dan@Plum.com.au" }),
        mail({ id: "2", fromEmail: "stranger@nowhere.com" }),
        mail({ id: "3", fromEmail: "mailer-daemon@googlemail.com" }),
        mail({ id: "4", fromEmail: "ooo@plum.com.au", automated: true }),
        mail({ id: "5", fromEmail: "prospect@own.com", body: "Yes please" }),
      ]),
      now,
      record
    );
    expect(r).toEqual({ recorded: 1, repNotified: 1 });
    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][1]).toMatchObject({ email: "dan@plum.com.au", providerEventId: "gmail:1", humanMail: true });
    expect(tables.acq_notifications[0]).toMatchObject({ recipient_employee_id: "r1", kind: "reply", dedupe_key: "gmail:5" });
  });

  it("does not process a forged sender: it asks a person to look instead of stopping sequences or suppressing anyone", async () => {
    const { db, tables } = fakeDb({ acq_contacts: [{ id: "c1", email_normalized: "dan@plum.com.au" }], rep_outreach_logs: [{ employee_id: "r1", recipient_email: "prospect@own.com", sent_at: "2026-10-01" }] }, { unique: { acq_notifications: "dedupe_key" } });
    const record = vi.fn<typeof recordInboundReply>(async () => ({ replyId: "rp1" }));
    const r = await pollReplies(db, reader([mail({ id: "1", fromEmail: "dan@plum.com.au", body: "unsubscribe me", authenticated: false }), mail({ id: "2", fromEmail: "prospect@own.com", authenticated: false })]), now, record);
    expect(r).toEqual({ recorded: 0, repNotified: 0 });
    expect(record).not.toHaveBeenCalled();
    expect(tables.acq_notifications).toHaveLength(1);
    expect(tables.acq_notifications[0]).toMatchObject({ recipient_employee_id: null, kind: "reply_unverified" });
  });

  it("one failing message does not stop the rest, and the cursor stays put so it is retried", async () => {
    const { db, tables } = fakeDb({ acq_contacts: [{ id: "c1", email_normalized: "bad@plum.com.au" }, { id: "c2", email_normalized: "good@plum.com.au" }] }, { unique: { acq_notifications: "dedupe_key" } });
    const record = vi.fn<typeof recordInboundReply>(async (_db, a) => { if (a.email.startsWith("bad")) throw new Error("NUL byte"); return { replyId: "ok" }; });
    const r = await pollReplies(db, reader([mail({ id: "1", fromEmail: "bad@plum.com.au" }), mail({ id: "2", fromEmail: "good@plum.com.au" })]), now, record);
    expect(r.recorded).toBe(1);
    expect(tables.acq_settings?.find((s) => s.key === "gmail_cursor")).toBeUndefined();
    expect(tables.acq_notifications.some((n) => String(n.title).includes("could not be processed"))).toBe(true);
  });

  it("does not move the cursor when the listing was truncated", async () => {
    const { db, tables } = fakeDb({});
    await pollReplies(db, reader([], true), now, vi.fn<typeof recordInboundReply>());
    expect(tables.acq_settings?.find((s) => s.key === "gmail_cursor")).toBeUndefined();
  });

  it("remembers where it got to, and looks back two days on the very first run", async () => {
    const { db, tables } = fakeDb({});
    const list = vi.fn(async () => ({ items: [] as { id: string; fromEmail: string }[], truncated: false }));
    await pollReplies(db, { list, get: async () => { throw new Error("unused"); } }, now, vi.fn<typeof recordInboundReply>());
    expect(list).toHaveBeenCalledWith(Math.floor(now.getTime() / 1000) - 2 * 86400);
    expect(tables.acq_settings.find((s) => s.key === "gmail_cursor")?.value).toEqual({ at: Math.floor(now.getTime() / 1000) });
    await pollReplies(db, { list, get: async () => { throw new Error("unused"); } }, new Date(now.getTime() + 600_000), vi.fn<typeof recordInboundReply>());
    expect(list).toHaveBeenLastCalledWith(Math.floor(now.getTime() / 1000) - 3600); // an hour of overlap, not two days
  });
});
