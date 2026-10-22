import { describe, it, expect, vi } from "vitest";
import { CODE_RE, bookLinkUrl, createBookLink, getBookLink, isBot, isExpired, markBooked, newCode, recordClick, recordView } from "@/lib/bookLinks";
import { defaultLanding, fillTokens, landingSchema, sanitizeLanding, sectionFor, sectionSchema } from "@/lib/landing";
import { INDUSTRY_NAMES } from "@/lib/industryTemplates";
import { fakeDb } from "./helpers/fakedb";

describe("short private codes", () => {
  it("are 10 characters from an unambiguous alphabet, and effectively unique", () => {
    const codes = new Set(Array.from({ length: 2000 }, () => newCode()));
    expect(codes.size).toBe(2000);
    for (const c of codes) {
      expect(c).toMatch(CODE_RE);
      expect(c).toHaveLength(10);
      expect(c).not.toMatch(/[0O1lI]/);
    }
    expect(bookLinkUrl("abc12345XY")).toMatch(/\/b\/abc12345XY$/);
  });

  it("the format check rejects anything that is not a plain code", () => {
    for (const bad of ["", "short", "has space1", "../etc/passwd", "a".repeat(13), "abc'; drop--", "<script>1</script>"]) expect(CODE_RE.test(bad), bad).toBe(false);
  });
});

describe("createBookLink", () => {
  it("stores who sent it, who it is for and what it was, lower-casing the address and trimming the text", async () => {
    const { db, tables } = fakeDb({ rep_book_links: [] });
    const r = await createBookLink(db, { employeeId: "r1", contactId: "c1", recipientEmail: " Dan@Plum.com.au ", recipientName: " Dan Lee ", companyName: "Plum", industry: "Property management", stage: "cold", templateUsed: "industry_x", design: "minimal" });
    expect(r?.code).toMatch(CODE_RE);
    expect(r?.url).toContain(`/b/${r?.code}`);
    expect(tables.rep_book_links[0]).toMatchObject({ employee_id: "r1", contact_id: "c1", recipient_email: "dan@plum.com.au", recipient_name: "Dan Lee", stage: "cold", source: "rep_outreach", design: "minimal" });
  });

  it("retries on a code clash, and returns null (so the email still goes out) on any other failure", async () => {
    let calls = 0;
    const db = { from: () => ({ insert: async () => (++calls < 3 ? { error: { code: "23505", message: "dup" } } : { error: null }) }) } as never;
    expect(await createBookLink(db, { employeeId: "r1", stage: "cold" })).not.toBeNull();
    expect(calls).toBe(3);
    const broken = { from: () => ({ insert: async () => ({ error: { code: "XX000", message: "boom" } }) }) } as never;
    expect(await createBookLink(broken, { employeeId: "r1", stage: "cold" })).toBeNull();
  });
});

describe("link lookups and counters", () => {
  const link = { code: "Abcdefgh23", employee_id: "r1", expires_at: "2099-01-01T00:00:00Z", booking_id: null };
  it("only looks up well-formed codes", async () => {
    const { db } = fakeDb({ rep_book_links: [link] });
    expect(await getBookLink(db, "Abcdefgh23")).toMatchObject({ employee_id: "r1" });
    expect(await getBookLink(db, "nope")).toBeNull();
    expect(await getBookLink(db, "Zzzzzzzz23")).toBeNull();
  });
  it("counts views and clicks through the atomic database functions", async () => {
    const { db, rpcCalls } = fakeDb({}, { rpc: { rep_book_link_view: () => null, rep_book_link_click: () => null } });
    await recordView(db, "Abcdefgh23");
    await recordClick(db, "Abcdefgh23");
    expect(rpcCalls.map((c) => c.name)).toEqual(["rep_book_link_view", "rep_book_link_click"]);
  });
  it("records the booking on the link once: the first booking wins", async () => {
    const { db, tables } = fakeDb({ rep_book_links: [{ ...link }] });
    await markBooked(db, "Abcdefgh23", "bk1");
    await markBooked(db, "Abcdefgh23", "bk2");
    expect(tables.rep_book_links[0].booking_id).toBe("bk1");
  });
  it("expiry and bot detection", () => {
    expect(isExpired({ expires_at: "2020-01-01T00:00:00Z" })).toBe(true);
    expect(isExpired({ expires_at: "2099-01-01T00:00:00Z" })).toBe(false);
    for (const ua of [null, "", "Googlebot/2.1", "Mozilla/5.0 (compatible; SecurityScanner)", "python-requests/2.31", "curl/8.0", "Slackbot-LinkExpanding", "HeadlessChrome"]) expect(isBot(ua), String(ua)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toBe(false);
  });
});

describe("landing content", () => {
  it("has a default and a tailored version for every industry we write for", () => {
    const d = defaultLanding();
    expect(landingSchema.safeParse(d).success).toBe(true);
    for (const name of INDUSTRY_NAMES.filter((n) => n !== "Business automation")) expect(d.industries[name]?.painPoints?.length, name).toBeGreaterThan(0);
  });

  it("an industry overrides the default only where it has something; empty overrides fall through", () => {
    const c = sanitizeLanding({ default: defaultLanding().default, industries: { Logistics: { headline: "Dispatch without the phone calls", painPoints: [] } } });
    const s = sectionFor(c, "logistics"); // case-insensitive
    expect(s.headline).toBe("Dispatch without the phone calls");
    expect(s.painPoints).toEqual(defaultLanding().industries.Logistics.painPoints); // empty list ignored, built-in industry default stays
    expect(sectionFor(c, "Underwater basket weaving").headline).toBe(defaultLanding().default.headline);
    expect(sectionFor(c, null).headline).toBe(defaultLanding().default.headline);
  });

  it("repairs a bad save field by field instead of breaking the page", () => {
    const c = sanitizeLanding({ default: { headline: "", accent: "red", imageUrl: "http://insecure.example/x.png", painPoints: ["ok", "<b>fine as text</b>"], ctaLabel: "Book now" } });
    expect(c.default.headline).toBe(defaultLanding().default.headline);
    expect(c.default.accent).toBe("#7b61ff");
    expect(c.default.imageUrl).toBe("");
    expect(c.default.ctaLabel).toBe("Book now");
    expect(c.default.painPoints).toEqual(["ok", "<b>fine as text</b>"]); // kept as plain text; React escapes it when rendered
    expect(sanitizeLanding(null)).toEqual(defaultLanding());
    expect(sanitizeLanding("junk")).toEqual(defaultLanding());
  });

  it("the admin save schema refuses oversized lists, insecure images, bad colours and unknown proof types", () => {
    const base = defaultLanding().default;
    expect(sectionSchema.safeParse(base).success).toBe(true);
    expect(sectionSchema.safeParse({ ...base, painPoints: Array(7).fill("x") }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, imageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, accent: "#12" }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, proof: [{ type: "script", src: "x" }] }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, proof: [{ type: "case_study", slug: "../admin" }] }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, proof: [{ type: "custom", title: "Cut admin time", metric: "-30%", detail: "Real client, approved." }] }).success).toBe(true);
  });

  it("fills the personal tokens as plain text, with friendly fallbacks", () => {
    const t = "Hi {{first_name}}, {{rep_name}} thought of {{company}}";
    expect(fillTokens(t, { firstName: "Dan", company: "Plum", repName: "Farhad" })).toBe("Hi Dan, Farhad thought of Plum");
    expect(fillTokens(t, {})).toBe("Hi there, The Digital Dude team thought of your team");
    expect(fillTokens(t, { firstName: "<img onerror=x>" })).toContain("<img onerror=x>"); // stays text; never interpreted here
  });
});

import { summariseLinks, type LinkRow } from "@/lib/acquisition/reports";

describe("link report", () => {
  const row = (o: Partial<LinkRow>): LinkRow => ({ employee_id: "r1", industry: "Logistics", stage: "cold", template_used: "t1", design: "minimal", views: 0, cta_clicks: 0, booking_id: null, ...o });
  it("counts sent, opened, clicked and booked per group, best first", () => {
    const rows = [row({ views: 2, cta_clicks: 1, booking_id: "b1" }), row({ views: 1 }), row({}), row({ industry: "Home services", views: 3, cta_clicks: 2 }), row({ industry: null })];
    const g = summariseLinks(rows, (r) => r.industry ?? "");
    expect(g[0]).toEqual({ key: "Logistics", sent: 3, views: 3, opened: 2, clicks: 1, bookings: 1 });
    expect(g.find((x) => x.key === "Home services")).toMatchObject({ sent: 1, opened: 1, clicks: 2, bookings: 0 });
    expect(g.find((x) => x.key === "(none)")).toMatchObject({ sent: 1 });
  });
  it("is empty for no links", () => {
    expect(summariseLinks([], () => "x")).toEqual([]);
  });
});
