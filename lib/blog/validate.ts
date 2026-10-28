import { allowedFigures, allowedLinks, extractFigures } from "./facts";
import type { BlogTopic } from "./topics";

export interface GeneratedPost {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
}

export interface Validation {
  ok: boolean;
  problems: string[];
  words: number;
}

/** Phrases that signal an invented claim, hype, or text that should never reach a published page. */
const BANNED: { re: RegExp; why: string }[] = [
  { re: /\bguarantee[ds]?\b/i, why: "makes a guarantee" },
  { re: /\b(?:#1|number one|no\. ?1)\b/i, why: "claims to be number one" },
  { re: /\b(?:best in the world|world[- ]class|industry[- ]leading|market[- ]leading|award[- ]winning)\b/i, why: "unsupported superlative" },
  { re: /\b(?:revolutionary|game[- ]chang\w+|cutting[- ]edge|next[- ]gen\w*)\b/i, why: "hype wording" },
  { re: /\b(?:studies show|research shows|research suggests|according to (?:a|recent) (?:study|survey|report)|surveys? (?:show|found))\b/i, why: "cites an unnamed study" },
  { re: /\b(?:one of our clients|a client of ours|our client[s]? (?:said|told|saw|reported)|we helped a)\b/i, why: "invented client anecdote" },
  { re: /\bas an ai\b|\blanguage model\b/i, why: "mentions being an AI" },
  { re: /lorem ipsum|\bTODO\b|\[INTERNAL LINK|\[EXTERNAL LINK|\{\{|\}\}/i, why: "contains placeholder text" },
  { re: /```/, why: "contains a code fence" },
];

const MIN_WORDS = 1000;
const MAX_WORDS = 2300;

function wordCount(markdown: string): number {
  return markdown.replace(/[#>*_`\[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
}

/** Internal links found in markdown: `[text](/path)`. External links are a problem on their own. */
function linksIn(markdown: string): { internal: string[]; external: string[] } {
  const internal: string[] = [];
  const external: string[] = [];
  for (const m of markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (href.startsWith("/")) internal.push(href.split(/[?#]/)[0].replace(/\/$/, "") || "/");
    else external.push(href);
  }
  return { internal, external };
}

export function validatePost(post: GeneratedPost, topic: BlogTopic, extraLinks: string[] = []): Validation {
  const problems: string[] = [];
  const content = post.content ?? "";
  const words = wordCount(content);

  if (!post.title || post.title.length < 20 || post.title.length > 75) problems.push(`title must be 20-75 characters (is ${post.title?.length ?? 0})`);
  if (!post.metaTitle || post.metaTitle.length < 25 || post.metaTitle.length > 62) problems.push(`metaTitle must be 25-62 characters (is ${post.metaTitle?.length ?? 0})`);
  if (!post.metaDescription || post.metaDescription.length < 120 || post.metaDescription.length > 160) problems.push(`metaDescription must be 120-160 characters (is ${post.metaDescription?.length ?? 0})`);
  if (!post.excerpt || post.excerpt.length < 80 || post.excerpt.length > 260) problems.push(`excerpt must be 80-260 characters (is ${post.excerpt?.length ?? 0})`);

  if (words < MIN_WORDS) problems.push(`too short: ${words} words (need at least ${MIN_WORDS})`);
  if (words > MAX_WORDS) problems.push(`too long: ${words} words (max ${MAX_WORDS})`);

  const h2 = content.match(/^## .+$/gm) ?? [];
  if (h2.length < 4) problems.push(`needs at least 4 "##" sections (has ${h2.length})`);
  if (/^# /m.test(content)) problems.push('do not include a "# " title heading in the content; the page already shows the title');

  const kw = topic.keyword.toLowerCase();
  const lower = content.toLowerCase();
  const firstPara = lower.slice(0, 700);
  if (!firstPara.includes(kw.split(" ").slice(0, 3).join(" "))) problems.push(`the opening paragraph should mention the topic ("${topic.keyword}")`);
  if (!lower.includes(kw) && !topic.secondary.some((s) => lower.includes(s.toLowerCase()))) problems.push(`the primary keyword "${topic.keyword}" never appears`);

  // FAQ section with real questions.
  const faq = content.match(/##+\s*(?:Frequently Asked Questions|FAQs?)\s*\n([\s\S]*?)(?=\n##\s+[^\n#]|$)/i);
  if (!faq) problems.push('needs a "## Frequently Asked Questions" section');
  else {
    const qs = faq[1].match(/^###\s+.+\?\s*$/gm) ?? [];
    if (qs.length < 3) problems.push(`the FAQ needs at least 3 "### Question?" entries (has ${qs.length})`);
  }

  // Links: internal only, from the allowlist, at least three, and a call to action.
  const { internal, external } = linksIn(content);
  const allowed = allowedLinks(extraLinks);
  if (external.length) problems.push(`no external links allowed (found ${external.slice(0, 2).join(", ")})`);
  const bad = [...new Set(internal.filter((l) => !allowed.has(l)))];
  if (bad.length) problems.push(`links to pages that do not exist: ${bad.slice(0, 4).join(", ")}`);
  if (new Set(internal.filter((l) => allowed.has(l))).size < 3) problems.push("needs at least 3 different internal links from the allowed list");
  if (!internal.includes("/contact")) problems.push('should end with a call to action linking to "/contact"');

  // No invented figures: money, percentages and multipliers must come from the fact sheet.
  const okFigs = allowedFigures();
  for (const extra of ["10%", "15%"]) okFigs.add(extra);
  const badFigs = [...new Set(extractFigures(`${post.title} ${post.excerpt} ${content}`).filter((f) => !okFigs.has(f)))];
  if (badFigs.length) problems.push(`contains figures that are not in the fact sheet (${badFigs.slice(0, 5).join(", ")}); remove them or rewrite without numbers`);

  for (const b of BANNED) {
    const m = `${post.title}\n${post.excerpt}\n${content}`.match(b.re);
    if (m) problems.push(`${b.why}: "${m[0]}"`);
  }

  return { ok: problems.length === 0, problems, words };
}
