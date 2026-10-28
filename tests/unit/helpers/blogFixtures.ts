import type { GeneratedPost } from "@/lib/blog/validate";

const filler = (n: number) => Array.from({ length: n }, (_, i) => `Teams often keep customer details in one place and then find that people edit the same rows at the same time, which makes the history hard to trust (${i}).`).join(" ");

/** A well-formed article for the first topic ("can a spreadsheet be a crm") that passes the quality check. */
export function goodContent(): string {
  return [
    `Can a spreadsheet be a CRM? For a very small team with a simple process, yes, and this guide explains when that stops being true.`,
    filler(3),
    `## When a spreadsheet CRM works\n\n${filler(6)}\n\n- Simple process\n- Few people\n- Low volume`,
    `## The signs it is breaking\n\n${filler(6)}\n\nRead [why growing service businesses outgrow spreadsheets](/blog/why-growing-service-businesses-outgrow-spreadsheets) for more.`,
    `## What a real CRM adds\n\n${filler(6)}\n\nSee the [cost guide](/blog/custom-crm-development-cost-uk) and our [CRM development service](/services/crm-development).`,
    `## A short checklist\n\n${filler(6)}`,
    `## Frequently Asked Questions\n\n### Can a spreadsheet replace a CRM?\n\n${filler(2)}\n\n### When should I move on?\n\n${filler(2)}\n\n### Is a custom CRM expensive?\n\nA focused CRM is typically roughly $5,500 to $12,000. ${filler(1)}\n\n### What about data protection?\n\n${filler(2)}`,
    `## Next step\n\nIf you would like to talk it through, [book a discovery call](/contact).`,
  ].join("\n\n");
}

export const goodPost = (): GeneratedPost => ({
  title: "Can a Spreadsheet Be a CRM? When It Works and When to Move On",
  metaTitle: "Can a Spreadsheet Be a CRM? When to Move On",
  metaDescription: "Can a spreadsheet be a CRM? Learn when a spreadsheet is enough for a small team, the signs it is breaking, and what a real CRM adds.",
  excerpt: "A spreadsheet can work as a CRM for a very small team. Here are the signs it is breaking and what to do next.",
  content: goodContent(),
});
