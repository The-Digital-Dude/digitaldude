import { describe, it, expect } from "vitest";
import { normalisePost } from "@/lib/blog/generate";
import { validatePost, type GeneratedPost } from "@/lib/blog/validate";
import { DEFAULT_TOPICS } from "@/lib/blog/topics";

const topic = DEFAULT_TOPICS[0];
const base: GeneratedPost = {
  title: "Can a Spreadsheet Be a CRM? When It Works and When to Move On",
  metaTitle: "Can a Spreadsheet Be a CRM? When to Move On",
  metaDescription: "Can a spreadsheet be a CRM? Learn when a spreadsheet is enough for a small team, the signs it is breaking, and what a real CRM adds.",
  excerpt: "A spreadsheet can work as a CRM for a very small team. Here are the signs it is breaking and what to do next.",
  content: "",
};

describe("excerpt repair", () => {
  it("cuts an over-long excerpt at a sentence boundary instead of rejecting the post", () => {
    const long = `${"A spreadsheet can work for a very small team with a simple process. ".repeat(2)}${"It starts to break when several people edit the same rows and history is lost. ".repeat(3)}`;
    expect(long.length).toBeGreaterThan(260);
    const fixed = normalisePost({ ...base, excerpt: long });
    expect(fixed.excerpt.length).toBeLessThanOrEqual(260);
    expect(fixed.excerpt.length).toBeGreaterThanOrEqual(80);
    expect(fixed.excerpt).toMatch(/[.!?]$|\.\.\.$/);
    expect(validatePost(fixed, topic).problems.join()).not.toMatch(/excerpt/);
  });

  it("falls back to the meta description when the excerpt is missing or too short", () => {
    expect(normalisePost({ ...base, excerpt: "Too short." }).excerpt).toBe(base.metaDescription);
    expect(normalisePost({ ...base, excerpt: "" }).excerpt).toBe(base.metaDescription);
  });

  it("leaves a good excerpt alone", () => {
    expect(normalisePost(base).excerpt).toBe(base.excerpt);
  });
});

describe("unsupported experience claims", () => {
  it("are rejected, because the fact sheet has no evidence for them", () => {
    for (const bad of ["We've seen many businesses reach this point.", "In our experience, teams outgrow sheets quickly.", "Many of our clients start with Excel.", "We have worked with dozens of agencies."]) {
      const v = validatePost({ ...base, content: `${bad} [x](/contact)` }, topic);
      expect(v.problems.join(" | "), bad).toMatch(/claims experience/);
    }
  });
});
