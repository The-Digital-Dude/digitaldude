import { describe, it, expect } from "vitest";
import { DEFAULT_BRAND, DESIGNS, brandSchema, defaultDesignFor, renderEmail, sanitizeBrand, type DesignId, type RenderInput } from "@/lib/emailDesign";

const base = (design: DesignId, o: Partial<RenderInput> = {}): RenderInput => ({
  design,
  brand: DEFAULT_BRAND,
  subject: "Reducing admin at Plum",
  body: "Hi Dan,\n\nI saw Plum manages 40 properties. Is reporting done by hand?\n\nSecond paragraph.",
  signature: { name: "Farhad Hossain", role: "Founder", photoUrl: "https://cdn.example.com/f.jpg", siteUrl: "https://www.digitaldude.co.uk" },
  button: { url: "https://www.digitaldude.co.uk/b/k7Xq2" },
  footerHtml: '<p>The Digital Dude &middot; Dhanmondi, Dhaka</p><p><a href="https://x.test/u?t=1">unsubscribe here</a></p>',
  footerText: "The Digital Dude, Dhanmondi, Dhaka. Unsubscribe: https://x.test/u?t=1",
  industry: "Property management",
  siteUrl: "https://www.digitaldude.co.uk",
  ...o,
});

describe("stage defaults", () => {
  it("cold is minimal, follow-up is plain", () => {
    expect(defaultDesignFor("cold")).toBe("minimal");
    expect(defaultDesignFor("follow_up")).toBe("plain");
  });
});

describe.each(DESIGNS)("%s design", (design) => {
  it("always carries the message, the sender identity and the unsubscribe link, in both html and text", () => {
    const { html, text } = renderEmail(base(design));
    expect(html).toContain("I saw Plum manages 40 properties");
    expect(html).toContain("Second paragraph.");
    expect(html).toContain("unsubscribe here");
    expect(html).toContain("Dhanmondi, Dhaka");
    expect(text).toContain("Unsubscribe: https://x.test/u?t=1");
    expect(text).toContain("Farhad Hossain");
    expect(text).toContain("Hi Dan,");
  });

  it("shows the booking button only when asked, with the rep's own link", () => {
    const withBtn = renderEmail(base(design));
    expect(withBtn.html).toContain("https://www.digitaldude.co.uk/b/k7Xq2");
    expect(withBtn.text).toContain("Book a 30-minute call: https://www.digitaldude.co.uk/b/k7Xq2");
    const without = renderEmail(base(design, { button: null }));
    expect(without.html).not.toContain("/b/k7Xq2");
    expect(without.text).not.toContain("Book a 30-minute call");
  });

  it("escapes everything a person typed, so nothing can inject markup", () => {
    const evil = '<script>alert(1)</script><img src=x onerror=alert(2)>"quoted"';
    const { html } = renderEmail(base(design, { body: evil, signature: { name: evil, role: evil, photoUrl: "javascript:alert(3)", siteUrl: "javascript:alert(4)" }, subject: evil }));
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img[^>]*onerror/i);
    expect(html).not.toContain("javascript:");
  });

  it("is a complete document with a title and no leftover template markers", () => {
    const { html } = renderEmail(base(design));
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<title>Reducing admin at Plum</title>");
    expect(html).not.toMatch(/\{\{|undefined|\[object/);
  });
});

describe("design specifics", () => {
  it("plain has no card, header, images or button styling, and shows the button as a labelled link", () => {
    const { html } = renderEmail(base("plain"));
    expect(html).not.toMatch(/<table|<img|background-color:#/i);
    expect(html).toContain('<a href="https://www.digitaldude.co.uk/b/k7Xq2">');
  });

  it("minimal shows the rep's photo, or initials when there is none, and no brand header", () => {
    expect(renderEmail(base("minimal")).html).toContain('src="https://cdn.example.com/f.jpg"');
    const noPhoto = renderEmail(base("minimal", { signature: { name: "Farhad Hossain", photoUrl: null } })).html;
    expect(noPhoto).toContain(">FH<");
    expect(noPhoto).not.toContain("<img");
    expect(noPhoto).not.toContain("#1a1a4e"); // no header bar
  });

  it("branded card has the header and card; industry card adds the industry line and accent", () => {
    const brand = { ...DEFAULT_BRAND, industryLines: { "Property management": { accent: "#0f766e", line: "Built for property teams" } } };
    const card = renderEmail(base("branded_card", { brand })).html;
    expect(card).toContain("background-color:#1a1a4e");
    expect(card).not.toContain("Built for property teams");
    const themed = renderEmail(base("industry_card", { brand })).html;
    expect(themed).toContain("Built for property teams");
    expect(themed).toContain("#0f766e");
    expect(renderEmail(base("industry_card", { brand, industry: "Logistics" })).html).not.toContain("Built for property teams");
  });

  it("brand settings change the look: colours, button label and shape, font", () => {
    const brand = brandSchema.parse({ buttonBg: "#ff0000", buttonLabel: "Pick a time", buttonShape: "pill", font: "georgia" });
    const { html } = renderEmail(base("minimal", { brand }));
    expect(html).toContain("background-color:#ff0000");
    expect(html).toContain("Pick a time");
    expect(html).toContain("border-radius:999px");
    expect(html).toContain("Georgia");
  });

  it("a button with an unsafe address is dropped rather than rendered", () => {
    expect(renderEmail(base("minimal", { button: { url: "javascript:alert(1)" } })).html).not.toContain("javascript:");
  });
});

describe("brand settings validation", () => {
  it("rejects bad colours, non-https logos and out-of-range values", () => {
    for (const bad of [{ accent: "red" }, { accent: "#12345" }, { logoUrl: "http://x.com/a.png" }, { logoUrl: "javascript:alert(1)" }, { buttonLabel: "x" }, { fontSize: 40 }, { font: "comic" }]) {
      expect(brandSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(brandSchema.safeParse({ logoUrl: "https://cdn.example.com/logo.png", accent: "#AABBCC" }).success).toBe(true);
  });

  it("sanitizeBrand falls back per field, so one bad saved value never breaks sending", () => {
    const b = sanitizeBrand({ accent: "not-a-colour", buttonLabel: "Pick a time", fontSize: 99 });
    expect(b.accent).toBe(DEFAULT_BRAND.accent);
    expect(b.fontSize).toBe(DEFAULT_BRAND.fontSize);
    expect(b.buttonLabel).toBe("Pick a time");
    expect(sanitizeBrand(null)).toEqual(DEFAULT_BRAND);
    expect(sanitizeBrand("garbage")).toEqual(DEFAULT_BRAND);
  });
});
