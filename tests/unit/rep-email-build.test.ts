import { describe, it, expect } from "vitest";
import { buildRepEmail, isDesign, loadBrand, resolveDesign, BRAND_KEY } from "@/lib/repEmail";
import { sniffImage } from "@/app/api/rep/photo/route";
import { fakeDb } from "./helpers/fakedb";

const employee = { id: "r1", outreach_display_name: "Farhad | The Digital Dude", role_title: "Founder", photo_url: "https://x.supabase.co/storage/v1/object/public/rep-photos/r1/a.jpg" };
const settings = (brand?: unknown) => ({
  acq_settings: [{ key: "sender_identity", value: { business: "The Digital Dude", postalAddress: "Dhanmondi, Dhaka, Bangladesh" } }, ...(brand ? [{ key: BRAND_KEY, value: brand }] : [])],
  acq_contacts: [{ email_normalized: "dan@plum.com.au", acq_companies: { industry: "Property management" } }],
});

describe("design choice", () => {
  it("uses the rep's pick if it is a real design, otherwise the stage default", () => {
    expect(isDesign("plain")).toBe(true);
    expect(isDesign("fancy")).toBe(false);
    expect(resolveDesign(undefined, "cold")).toBe("minimal");
    expect(resolveDesign("nonsense", "follow_up")).toBe("plain");
    expect(resolveDesign("branded_card", "follow_up")).toBe("branded_card");
  });
});

describe("loadBrand", () => {
  it("returns defaults when nothing is saved, the saved look when it is, and never throws on a bad value", async () => {
    expect((await loadBrand(fakeDb(settings()).db)).buttonLabel).toBe("Book a 30-minute call");
    expect((await loadBrand(fakeDb(settings({ buttonLabel: "Pick a time", accent: "#112233" })).db)).buttonLabel).toBe("Pick a time");
    expect((await loadBrand(fakeDb(settings({ accent: "nonsense" })).db)).accent).toBe("#7b61ff");
  });
});

describe("buildRepEmail", () => {
  const args = (o = {}) => ({ employee, subject: "Hello Plum", message: "Hi Dan,\n\nIs reporting done by hand?", design: "minimal" as const, buttonUrl: "https://www.digitaldude.co.uk/contact?ref=farhad", unsubscribeUrl: "https://www.digitaldude.co.uk/outreach/unsubscribe?t=abc", ...o });

  it("builds the email with the saved brand, the rep's signature and photo, the button, and the mandatory footer", async () => {
    const { html, text } = await buildRepEmail(fakeDb(settings({ buttonLabel: "Pick a time", buttonBg: "#ff0000" })).db, args());
    expect(html).toContain("Pick a time");
    expect(html).toContain("background-color:#ff0000");
    expect(html).toContain("Farhad | The Digital Dude");
    expect(html).toContain("rep-photos/r1/a.jpg");
    expect(html).toContain("Dhanmondi, Dhaka, Bangladesh");
    expect(html).toContain("unsubscribe here");
    expect(text).toContain("Unsubscribe here: https://www.digitaldude.co.uk/outreach/unsubscribe?t=abc".replace("Unsubscribe", "unsubscribe"));
    expect(text).toContain("Pick a time: https://www.digitaldude.co.uk/contact?ref=farhad");
  });

  it("omits the button without a link, and uses the recipient's industry for the themed card", async () => {
    const db = fakeDb(settings({ industryLines: { "Property management": { accent: "#0f766e", line: "Built for property teams" } } })).db;
    expect((await buildRepEmail(db, args({ buttonUrl: null }))).html).not.toContain("/contact?ref=");
    expect((await buildRepEmail(db, args({ design: "industry_card", industry: "Property management" }))).html).toContain("Built for property teams");
  });

  it("falls back to a neutral signature rather than the rep's personal name", async () => {
    const { html } = await buildRepEmail(fakeDb(settings()).db, args({ employee: { id: "r1" } }));
    expect(html).toContain("The Digital Dude Partnerships");
  });
});

describe("photo upload type check", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(20).fill(0)]);
  it("accepts real JPEG, PNG and WebP files by their first bytes, and nothing else", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toMatchObject({ ext: "jpg" });
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47))).toMatchObject({ ext: "png" });
    const webp = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP"), 0, 0, 0, 0]);
    expect(sniffImage(webp)).toMatchObject({ ext: "webp" });
    expect(sniffImage(new Uint8Array(Buffer.from("<html><script>alert(1)</script></html>")))).toBeNull();
    expect(sniffImage(new Uint8Array(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")))).toBeNull();
    expect(sniffImage(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
