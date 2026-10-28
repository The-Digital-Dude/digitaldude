import { extractJson, type AiProvider } from "@/lib/acquisition/providers/ai";
import { COMPANY_FACTS, allowedLinks, caseStudyFacts } from "./facts";
import { validatePost, type GeneratedPost, type Validation } from "./validate";
import type { BlogTopic } from "./topics";

const SYSTEM = `You are a careful UK-English content writer for The Digital Dude, a custom software studio. You write helpful, honest, specific articles for business owners and managers who are researching a software decision.

HARD RULES (a post that breaks them is rejected):
1. FACTS: You may state something as true about The Digital Dude, its prices, timelines, process or projects ONLY if it appears in the FACT SHEET or PROJECTS below. Everything else must be general advice, phrased as advice ("you should", "teams often"), never as a claim about us, a client or a result.
2. NUMBERS: Use money amounts, percentages and multipliers ONLY if they appear in the fact sheet or projects. Otherwise write without numbers. Never invent statistics, studies, surveys, rankings, awards, customer quotes, client names or case histories.
3. No guarantees, no superlatives ("best", "leading", "world-class"), no hype words. You may name well-known products neutrally for context, but never rank or criticise them and never quote their prices; say "check the vendor's current pricing". Never write "we've seen", "in our experience" or "many of our clients": the fact sheet has no evidence for that.
4. Links: use ONLY markdown links to the INTERNAL PAGES listed, written as [anchor text](/path). Never use external links. Include at least three different internal links, naturally in the text, and finish with a short call to action linking to /contact.
5. Structure: no "# " title in the content (the page shows the title). Start with a short, direct opening paragraph that uses the primary keyword. Then at least four "## " sections with clear headings, short paragraphs, and bullet or numbered lists where they help. Then a "## Frequently Asked Questions" section with 4 "### Question?" entries, each followed by a concise answer. End with a short "## Next step" section containing the call to action.
6. Length: 1,300 to 1,800 words of useful content. Be specific and practical, not padded. Plain English; short sentences.
7. Be even-handed. Say when off-the-shelf or a competitor is the right choice. Never disparage.
8. If asked about law (GDPR etc.), give general information and say it is not legal advice.
9. Do NOT repeat company boilerplate. Mention The Digital Dude, the price bands and the delivery process at most once each, only where they genuinely help, and never in more than one FAQ answer. FAQ answers must answer the reader's question about the topic, not restate our fact sheet. Most of the article should be useful advice that would help the reader even if they never hired us.
10. "excerpt" must be a SHORT plain summary of 120 to 220 characters (one or two sentences).

Return ONLY one JSON object with these string fields:
"title" (the H1, 40-70 characters, contains the primary keyword naturally),
"metaTitle" (30-58 characters, no brand suffix needed),
"metaDescription" (130-158 characters, includes the keyword, ends with a reason to click),
"excerpt" (100-220 characters, a plain summary),
"content" (the article in markdown).`;

export function buildUserPrompt(topic: BlogTopic, extraLinks: string[], feedback: string[] = []): string {
  const links = [...allowedLinks(extraLinks)].sort().join("\n");
  return `TOPIC
Working title: ${topic.title}
Primary keyword: ${topic.keyword}
Secondary keywords: ${topic.secondary.join(", ")}
Author voice: written by ${topic.author} for The Digital Dude blog (first person plural "we" is fine for the company; do not invent personal anecdotes).

THE POST MUST COVER
${topic.angle.map((a) => `- ${a}`).join("\n")}

Pages it should link to (and may add others from the allowed list): ${topic.links.join(", ")}

FACT SHEET (the only things you may claim about The Digital Dude)
${COMPANY_FACTS}

PROJECTS (published; mention only what is written here)
${caseStudyFacts()}

INTERNAL PAGES YOU MAY LINK TO
${links}
${feedback.length ? `\nYOUR PREVIOUS ATTEMPT WAS REJECTED. Fix every one of these problems:\n${feedback.map((f) => `- ${f}`).join("\n")}\n` : ""}
Write the post now. Return only the JSON object.`;
}

export interface Attempt {
  post: GeneratedPost | null;
  validation: Validation | null;
  error?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Fixes things that are cosmetic rather than wrong, so a good article is not thrown away for them: an over-long excerpt is cut at a
 * sentence or word boundary, and a missing or too-short one is taken from the meta description.
 */
export function normalisePost(p: GeneratedPost): GeneratedPost {
  let excerpt = p.excerpt;
  if (excerpt.length > 260) {
    const cut = excerpt.slice(0, 240);
    const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    excerpt = sentence >= 100 ? cut.slice(0, sentence + 1) : `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}...`;
  }
  if (excerpt.length < 80) excerpt = p.metaDescription;
  return { ...p, excerpt };
}

/** One writing attempt. Never throws: a failed call or unreadable answer comes back as `error`. */
export async function generatePost(provider: AiProvider, topic: BlogTopic, opts: { extraLinks?: string[]; feedback?: string[] } = {}): Promise<Attempt> {
  const extra = opts.extraLinks ?? [];
  let raw: string;
  try {
    raw = await provider.completeJson({ system: SYSTEM, user: buildUserPrompt(topic, extra, opts.feedback) });
  } catch (e) {
    return { post: null, validation: null, error: e instanceof Error ? e.message : String(e) };
  }
  let obj: Record<string, unknown>;
  try {
    obj = extractJson(raw) as Record<string, unknown>;
  } catch (e) {
    return { post: null, validation: null, error: `unreadable answer: ${e instanceof Error ? e.message : String(e)}` };
  }
  const post = normalisePost({ title: str(obj.title), metaTitle: str(obj.metaTitle), metaDescription: str(obj.metaDescription), excerpt: str(obj.excerpt), content: str(obj.content) });
  return { post, validation: validatePost(post, topic, extra) };
}
