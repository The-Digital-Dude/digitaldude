import { SITE_URL } from "@/lib/utils";

export interface InternalLinkCandidate {
  url: string;
  title: string;
  category: "service" | "comparison" | "case-study" | "solution";
  anchorSuggestion: string;
  relevanceKeywords: string[];
}

export const INTERNAL_SITE_CATALOG: InternalLinkCandidate[] = [
  // Core Services
  {
    url: "/services/crm-development",
    title: "Custom CRM Development",
    category: "service",
    anchorSuggestion: "custom CRM development",
    relevanceKeywords: ["crm", "pipeline", "leads", "sales", "dispatch", "portals", "hubspot", "salesforce"],
  },
  {
    url: "/services/marketplace-development",
    title: "Two-Sided & Three-Sided Marketplace Development",
    category: "service",
    anchorSuggestion: "three-sided marketplace architecture",
    relevanceKeywords: ["marketplace", "sharetribe", "booking", "escrow", "stripe connect", "providers"],
  },
  {
    url: "/services/mvp-development",
    title: "Rapid MVP & SaaS Product Engineering",
    category: "service",
    anchorSuggestion: "rapid MVP development",
    relevanceKeywords: ["mvp", "saas", "startup", "prototype", "launch", "founder"],
  },
  {
    url: "/services/internal-tools-portal",
    title: "Custom Internal Tools & Operator Dashboards",
    category: "service",
    anchorSuggestion: "bespoke internal operations tools",
    relevanceKeywords: ["internal tools", "dashboard", "backoffice", "admin", "erp", "operations"],
  },

  // High-Intent Comparisons
  {
    url: "/compare/custom-crm-vs-salesforce",
    title: "Custom CRM vs Salesforce Decision Guide",
    category: "comparison",
    anchorSuggestion: "Salesforce vs bespoke CRM comparison",
    relevanceKeywords: ["salesforce", "per-seat", "apex", "licensing", "consultant", "crm switch"],
  },
  {
    url: "/compare/custom-crm-vs-hubspot",
    title: "Custom CRM vs HubSpot 3-Year TCO Guide",
    category: "comparison",
    anchorSuggestion: "custom CRM vs HubSpot decision guide",
    relevanceKeywords: ["hubspot", "marketing hub", "sales hub", "custom objects", "contacts"],
  },
  {
    url: "/compare/bespoke-erp-vs-netsuite",
    title: "Bespoke ERP vs Oracle NetSuite",
    category: "comparison",
    anchorSuggestion: "bespoke ERP vs NetSuite analysis",
    relevanceKeywords: ["netsuite", "erp", "oracle", "suitesuccess", "inventory", "dispatch", "logistics"],
  },
  {
    url: "/compare/custom-marketplace-vs-sharetribe",
    title: "Custom Marketplace vs Sharetribe (0% Take-Rate)",
    category: "comparison",
    anchorSuggestion: "custom marketplace vs Sharetribe",
    relevanceKeywords: ["sharetribe", "take-rate", "commission", "booking", "rental"],
  },
  {
    url: "/compare/custom-software-vs-bubble-no-code",
    title: "Custom Software vs Bubble & No-Code Tools",
    category: "comparison",
    anchorSuggestion: "Next.js architecture vs Bubble no-code",
    relevanceKeywords: ["bubble", "no-code", "workload units", "latency", "portability", "sql"],
  },
  {
    url: "/compare/custom-crm-vs-zoho",
    title: "Custom CRM vs Zoho CRM Architecture Guide",
    category: "comparison",
    anchorSuggestion: "custom CRM vs Zoho decision guide",
    relevanceKeywords: ["zoho", "zoho one", "deluge", "field service", "per-seat", "crm"],
  },
  {
    url: "/compare/custom-crm-vs-monday",
    title: "Custom CRM vs Monday.com Sales CRM",
    category: "comparison",
    anchorSuggestion: "bespoke software vs Monday CRM",
    relevanceKeywords: ["monday", "monday.com", "kanban", "automation limits", "crm"],
  },
  {
    url: "/compare/custom-crm-vs-pipedrive",
    title: "Custom CRM vs Pipedrive Architecture & TCO",
    category: "comparison",
    anchorSuggestion: "custom CRM vs Pipedrive comparison",
    relevanceKeywords: ["pipedrive", "pipeline", "deals", "dispatch", "portals", "crm"],
  },

  // Case Studies
  {
    url: "/work/property-compliance-crm",
    title: "Property Compliance CRM Case Study",
    category: "case-study",
    anchorSuggestion: "production property compliance CRM",
    relevanceKeywords: ["property", "compliance", "certificates", "eicr", "landlord", "inspections"],
  },
  {
    url: "/work/airline-ticketing-crm",
    title: "Airline Ticketing & High-Concurrency Portal",
    category: "case-study",
    anchorSuggestion: "high-concurrency ticketing architecture",
    relevanceKeywords: ["travel", "ticketing", "airline", "booking", "concurrency"],
  },
  {
    url: "/work/logistics-platform",
    title: "Logistics Coordination & Fleet Dispatch Platform",
    category: "case-study",
    anchorSuggestion: "fleet dispatch coordination platform",
    relevanceKeywords: ["logistics", "fleet", "driver", "freight", "transport", "manifest"],
  },
  {
    url: "/work/cleaning-marketplace",
    title: "On-Demand Home Services Marketplace",
    category: "case-study",
    anchorSuggestion: "on-demand services marketplace",
    relevanceKeywords: ["cleaning", "home services", "contractors", "dispatch", "mobile"],
  },

  // Vertical Solutions Hubs
  {
    url: "/solutions/property/crm-development",
    title: "Property Management CRM Solutions",
    category: "solution",
    anchorSuggestion: "property operations software",
    relevanceKeywords: ["property", "estate agent", "landlord", "lettings"],
  },
  {
    url: "/solutions/logistics/crm-development",
    title: "CRM for Logistics & Freight Operations",
    category: "solution",
    anchorSuggestion: "CRM for logistics operations",
    relevanceKeywords: ["logistics", "freight", "dispatch", "fleet"],
  },
];

/**
 * Match relevant internal links based on query keywords
 */
export function getRecommendedInternalLinks(
  focusKeyword: string,
  secondaryKeywords: string[] = []
): InternalLinkCandidate[] {
  const allTokens = [
    ...focusKeyword.toLowerCase().split(/\s+/),
    ...secondaryKeywords.flatMap((k) => k.toLowerCase().split(/\s+/)),
  ].filter((t) => t.length > 2);

  const scored = INTERNAL_SITE_CATALOG.map((candidate) => {
    let score = 0;
    for (const token of allTokens) {
      if (candidate.relevanceKeywords.some((rk) => rk.includes(token) || token.includes(rk))) {
        score += 3;
      }
      if (candidate.title.toLowerCase().includes(token)) {
        score += 2;
      }
    }
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.candidate);
}

export interface BlogOutlineSection {
  heading: string;
  level: "h2" | "h3";
  description: string;
  targetWords: number;
}

export interface BlogOutlineResult {
  title: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  category: string;
  sections: BlogOutlineSection[];
  recommendedLinks: InternalLinkCandidate[];
}

export interface GeneratedArticleResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  meta_title?: string;
  meta_description?: string;
  slug: string;
  excerpt: string;
  category: string;
  readingTimeMinutes: number;
  content: string;
  focusKeyword?: string;
  faqs: Array<{ q: string; a: string }>;
}

/**
 * Helper to call available external LLM API if configured in environment
 */
async function callExternalLlm(prompt: string, systemPrompt: string): Promise<string | null> {
  // 1. Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nTask:\n${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn("Gemini LLM call failed, trying next provider", e);
    }
  }

  // 2. OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {
      console.warn("OpenAI LLM call failed", e);
    }
  }

  return null;
}

/**
 * Step 1: Generate Outline & Internal Link Recommendations
 */
export async function generateBlogOutline(params: {
  focusKeyword: string;
  secondaryKeywords?: string[];
  targetAudience?: string;
  contentGoal?: string;
}): Promise<BlogOutlineResult> {
  const kw = params.focusKeyword.trim();
  const secondary = params.secondaryKeywords || [];
  const audience = params.targetAudience || "Growing Service Businesses & Technical Leaders";
  const goal = params.contentGoal || "Demonstrate architectural superiority and ROI of custom software";

  const recommendedLinks = getRecommendedInternalLinks(kw, secondary);

  const cleanSlug = kw
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Try LLM generation first
  const systemPrompt = `You are a Principal Software Architect and SEO Director at The Digital Dude (digitaldude.co.uk), a premium UK custom software development studio.
Create an exhaustive, highly structured blog post outline targeting the primary keyword: "${kw}".
Audience: ${audience}.
Goal: ${goal}.
Return strictly valid JSON with no markdown wrapping. Format:
{
  "title": "Compelling Title under 60 chars",
  "metaTitle": "SEO Title under 60 chars with keyword | The Digital Dude",
  "metaDescription": "Concise meta description 140-155 chars with keyword and call-to-action.",
  "slug": "${cleanSlug}",
  "category": "CRM Systems / Custom Software / Architecture",
  "sections": [
    { "heading": "Heading text", "level": "h2", "description": "What to cover", "targetWords": 250 },
    { "heading": "Subheading text", "level": "h3", "description": "What to cover", "targetWords": 200 }
  ]
}`;

  const llmResponse = await callExternalLlm(
    `Generate an in-depth 6 to 8 section technical outline for "${kw}". Secondary keywords: ${secondary.join(", ")}.`,
    systemPrompt
  );

  if (llmResponse) {
    try {
      const cleaned = llmResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        recommendedLinks,
      };
    } catch {}
  }

  // High-fidelity architectural outline synthesizer fallback
  const capitalizedKw = kw.replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${capitalizedKw}: Architectural Guide & ROI Breakdown (2026)`,
    focusKeyword: kw,
    metaTitle: `${capitalizedKw}: Architecture & ROI Guide | The Digital Dude`,
    metaDescription: `Comprehensive decision framework for ${kw}. Compare off-the-shelf software with bespoke architecture, total cost of ownership, and migration timing.`,
    slug: cleanSlug,
    category: kw.includes("crm") ? "CRM Systems" : kw.includes("market") ? "Marketplace Development" : "Custom Software",
    sections: [
      {
        heading: `The Enterprise Inflection Point: Why ${capitalizedKw} Matters Now`,
        level: "h2",
        description: `Examine the operational bottlenecks and software friction that lead growing service businesses to evaluate ${kw}.`,
        targetWords: 300,
      },
      {
        heading: "Packaged SaaS vs Bespoke Engineering: The Architectural Tradeoff",
        level: "h2",
        description: "Direct comparative breakdown of per-seat licensing penalties vs fixed asset equity.",
        targetWords: 350,
      },
      {
        heading: "The Relational Data Model Advantage",
        level: "h3",
        description: "Why bespoke PostgreSQL schemas outperform rigid standard SaaS entity structures.",
        targetWords: 250,
      },
      {
        heading: "3-Year Total Cost of Ownership (TCO) Formula",
        level: "h2",
        description: "Real financial modeling calculating subscription fees, onboarding charges, and maintenance.",
        targetWords: 300,
      },
      {
        heading: "Zero-Downtime Migration & Rollout Roadmap",
        level: "h2",
        description: "Four-phase operational transition plan from discovery to database cutover.",
        targetWords: 300,
      },
      {
        heading: "Frequently Asked Questions",
        level: "h2",
        description: "Objective answers to commercial, technical, and maintenance questions for executive teams.",
        targetWords: 250,
      },
    ],
    recommendedLinks,
  };
}

/**
 * Step 2: Generate Full ~1,500w Article Markdown with Embedded Links & FAQs
 */
export async function generateFullBlogArticle(params: {
  outline: BlogOutlineResult;
  selectedLinks: InternalLinkCandidate[];
  customInstructions?: string;
}): Promise<GeneratedArticleResult> {
  const { outline, selectedLinks, customInstructions } = params;
  const kw = outline.focusKeyword;

  const linksInstruction = selectedLinks
    .map((l) => `- Link to "${l.url}" using natural anchor text like "${l.anchorSuggestion}" or contextual variations.`)
    .join("\n");

  const systemPrompt = `You are a Principal Solutions Architect at The Digital Dude (digitaldude.co.uk).
Write an exhaustive, authoritative ~1,500 to 2,000-word engineering and business guide.
Primary Target Keyword: "${kw}" (Ensure it appears naturally 6-10 times across headings and paragraphs).
Tone: Authoritative, objective, commercially astute, and technically concrete. Avoid generic marketing fluff. Include Markdown tables, comparison lists, alert callouts, and real-world examples.
Embed the following internal links naturally into relevant sections:
${linksInstruction}
Ensure the final section is "## Frequently Asked Questions" containing 3 to 4 detailed Q&As formatted as:
### Q: [Question]
[Detailed Answer]

Return strictly valid JSON:
{
  "title": "${outline.title}",
  "metaTitle": "${outline.metaTitle}",
  "metaDescription": "${outline.metaDescription}",
  "slug": "${outline.slug}",
  "excerpt": "Compelling 2-sentence executive summary under 180 characters.",
  "category": "${outline.category}",
  "readingTimeMinutes": 7,
  "content": "Full markdown content...",
  "faqs": [
    { "q": "Question 1", "a": "Answer 1" },
    { "q": "Question 2", "a": "Answer 2" },
    { "q": "Question 3", "a": "Answer 3" }
  ]
}`;

  const prompt = `Write the complete article adhering to this outline:\n${outline.sections
    .map((s) => `${s.level === "h2" ? "##" : "###"} ${s.heading}\nFocus: ${s.description}`)
    .join("\n\n")}\n\nAdditional Instructions: ${customInstructions || "None"}`;

  const llmResponse = await callExternalLlm(prompt, systemPrompt);

  if (llmResponse) {
    try {
      const cleaned = llmResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.content) {
        return {
          ...parsed,
          meta_title: parsed.metaTitle || parsed.meta_title,
          meta_description: parsed.metaDescription || parsed.meta_description,
          focusKeyword: kw,
        };
      }
    } catch {}
  }

  // High-fidelity fallback article synthesizer
  const capitalizedKw = kw.replace(/\b\w/g, (c) => c.toUpperCase());
  const link1 = selectedLinks[0] || { url: "/services/crm-development", anchorSuggestion: "custom software development" };
  const link2 = selectedLinks[1] || { url: "/compare", anchorSuggestion: "build vs buy comparison guides" };
  const link3 = selectedLinks[2] || { url: "/work", anchorSuggestion: "production case studies" };

  const content = `## The Enterprise Inflection Point: Why ${capitalizedKw} Matters Now

Every growing service enterprise, logistics operator, and multi-branch business inevitably encounters an operational plateau. Early on, off-the-shelf software and spreadsheet patchwork are sufficient to coordinate daily tasks. But as team headcount scales and transactional volume surges, leaders discover that generic tools become an administrative tax on company growth.

At this juncture, evaluating **${kw}** is no longer just a technical exercise—it is a core balance-sheet decision. Rather than paying escalating monthly per-user licenses for software you can never own or adapt, modern technical leaders are commissioning purpose-built applications tailored strictly to how their operations run.

In this architectural guide, we evaluate when **${kw}** delivers measurable return on investment, how to model 3-year total cost of ownership, and what technical standards separate production-grade systems from brittle prototypes.

---

## Packaged SaaS vs Bespoke Engineering: The Architectural Tradeoff

When evaluating software procurement, organizations face two fundamentally divergent operational philosophies:

| Architectural Dimension | Off-The-Shelf SaaS Platform | Bespoke Custom Software Engine |
| :--- | :--- | :--- |
| **Pricing Model** | $120–$300+ per user seat/month recurring forever | Fixed milestone build proposal with £0 per-seat licenses |
| **Data Ownership** | 100% vendor lock-in governed by third-party terms | 100% proprietary intellectual property & PostgreSQL database |
| **Workflow Fit** | Rigid standard stages requiring plugin patchwork | 100% custom-mapped to physical jobs, routes & approvals |
| **External Portals** | Punitive licensing for contractor or customer logins | Unlimited client self-service portals at zero incremental cost |
| **Scalability** | Tiered price jumps at contact and data thresholds | Predictable cloud hosting on dedicated serverless infrastructure |

As illustrated in our comprehensive [${link2.anchorSuggestion}](${link2.url}), off-the-shelf software excels when your business fits standard sales funnels. However, when your operational flow represents your core competitive moat, investing in [${link1.anchorSuggestion}](${link1.url}) provides unmatched operational velocity.

---

## The Relational Data Model Advantage

Standard SaaS platforms force your business entities into generic contacts, companies, and deals. If your daily operations revolve around statutory property certificates, vehicle fleet routes, technician dispatch manifests, or milestone escrow disbursements, working around closed data models generates massive friction.

A purpose-built system models your authentic business domain:

- **Entity Relationship Integrity:** Direct foreign key constraints between field operators, customer assets, and billing milestones.
- **Granular Row-Level Security (RLS):** Strict multi-tenant isolation ensuring staff, contractors, and external clients see only authorized data slices.
- **Sub-Second Performance:** Direct SQL indexing on PostgreSQL delivering sub-second response times, rather than rate-limited REST API middleware.

Review our [${link3.anchorSuggestion}](${link3.url}) to inspect how tailored database architectures eliminated thousands of wasted administrative hours for operational service providers.

---

## 3-Year Total Cost of Ownership (TCO) Formula

To make an objective procurement decision regarding **${kw}**, technical directors must compare authentic three-to-five year total expenditure:

$$\\text{SaaS TCO} = (\\text{Seats} \\times \\text{Monthly Rate} \\times 36) + \\text{Required Onboarding} + \\text{Support Contracts} + \\text{Add-On Integrations}$$

$$\\text{Bespoke TCO} = \\text{Fixed Milestone Build} + (\\text{Cloud Hosting} \\times 36) + (\\text{Annual Maintenance} \\times 3)$$

### The Financial Inflection Point
For a team of 25 operators paying $165 per user/month, packaged software costs **$148,500 over 3 years**, excluding mandatory support retainers and contact overages. Conversely, a focused custom platform commissioned for £25,000 ($32,000) with $100/mo serverless hosting costs roughly **$35,600 over 3 years**—representing a **76% total expenditure reduction** while securing an owned corporate asset.

---

## Zero-Downtime Migration & Rollout Roadmap

Transitioning operations to custom software requires a disciplined, four-phase delivery methodology:

1. **Phase 1: Architectural Discovery & Object Mapping (Weeks 1–2):** Audit legacy records, deduplicate contacts, and design normalized relational schemas.
2. **Phase 2: Core Platform & Portal Engineering (Weeks 3–5):** Build modern Next.js 16 role-based interfaces with strict TypeScript schema validation.
3. **Phase 3: Automated Data ETL & Sandbox Acceptance (Weeks 6–7):** Programmatically extract historical databases and run parallel reconciliation tests.
4. **Phase 4: Production Cutover & Team Training (Weeks 8–9):** Execute seamless DNS switch with full source code handover and 30-day warranty coverage.

---

## Frequently Asked Questions

### Q: How long does it take to implement a bespoke solution for ${kw}?
A focused operational platform typically takes 4 to 6 weeks from technical discovery to production deployment. Multi-portal SaaS platforms coordinating hundreds of external users typically progress over 8 to 12 weeks with weekly staging demos.

### Q: Who owns the underlying source code and database assets?
At The Digital Dude, our clients receive 100% intellectual property ownership of the delivered TypeScript source code, database schemas, and cloud deployment accounts upon final milestone delivery.

### Q: What are the ongoing hosting and server maintenance costs?
A modern serverless web application deployed on Vercel and Supabase PostgreSQL typically costs between £50 and £150 per month ($65–$200/mo) in cloud infrastructure, scaling smoothly to hundreds of thousands of monthly page views without per-seat licensing penalties.
`;

  return {
    title: outline.title,
    metaTitle: outline.metaTitle,
    metaDescription: outline.metaDescription,
    meta_title: outline.metaTitle,
    meta_description: outline.metaDescription,
    slug: outline.slug,
    excerpt: `Discover why growing service enterprises evaluate ${kw} to eliminate per-seat SaaS taxes and build an owned corporate software asset.`,
    category: outline.category,
    readingTimeMinutes: 8,
    content,
    focusKeyword: kw,
    faqs: [
      {
        q: `How long does it take to implement a bespoke solution for ${kw}?`,
        a: "A focused operational platform typically takes 4 to 6 weeks from technical discovery to production deployment. Multi-portal systems typically take 8 to 12 weeks with weekly milestone staging.",
      },
      {
        q: "Who owns the underlying source code and database assets?",
        a: "Clients retain 100% intellectual property ownership of delivered source code, PostgreSQL schemas, and cloud accounts upon delivery.",
      },
      {
        q: "What are the ongoing hosting and server maintenance costs?",
        a: "Modern serverless Next.js and Supabase infrastructure typically costs £50–£150/mo, scaling without per-user licensing fees.",
      },
    ],
  };
}
