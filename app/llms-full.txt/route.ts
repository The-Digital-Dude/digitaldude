import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/utils";
import { services } from "@/lib/content/services";
import { getCaseStudies } from "@/lib/caseStudiesServer";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export const revalidate = 3600;

export async function GET() {
  const caseStudies = await getCaseStudies();

  // Fetch full blog content dynamically from Supabase
  let blogArticles: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    category?: string;
    content?: string;
    published_at?: string;
    author?: string;
  }> = [];

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt, category, content, published_at, author")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data && data.length > 0) {
        blogArticles = data;
      }
    }
  } catch {}

  const caseStudyDetails = caseStudies
    .map(
      (c) => `### ${c.title} (${c.tag})
- **URL**: ${SITE_URL}/work/${c.slug}
- **Overview**: ${c.summary}
- **Status**: ${c.status}
- **The Challenge**: ${c.challenge}
- **Headline**: ${c.headline}
- **Key Metrics**:
${c.stats.map((s: string) => `  * ${s}`).join("\n")}
- **What We Built**:
${c.whatWeBuilt.map((w: string) => `  * ${w}`).join("\n")}
- **Impact (${c.whatChangedLabel})**: ${c.whatChanged}
- **Tech Stack**: ${c.builtWith}
`
    )
    .join("\n---\n\n");

  const serviceDetails = services
    .map(
      (s) => `### ${s.navLabel}
- **URL**: ${SITE_URL}/services/${s.slug}
- **Headline**: ${s.headline}
- **Overview**: ${s.oneLiner}
- **Deep Dive**: ${s.intro}
- **Target Audience**: ${s.whoFor}
- **Included Scope & Features**:
${s.included.map((item: string) => `  * ${item}`).join("\n")}
- **Frequently Asked Questions**:
${s.faqs.map((f) => `  * Q: ${f.q}\n    A: ${f.a}`).join("\n")}
`
    )
    .join("\n---\n\n");

  const blogDetails = blogArticles.length > 0
    ? blogArticles
        .map(
          (b) => `### ${b.title}
- **URL**: ${SITE_URL}/blog/${b.slug}
- **Category**: ${b.category || "Technical Growth"}
- **Author**: ${b.author || "The Digital Dude Team"}
- **Summary**: ${b.excerpt || ""}
- **Full Text Reference**:
${b.content || ""}
`
        )
        .join("\n---\n\n")
    : "";

  const content = `# The Digital Dude — Comprehensive Technical & Service Documentation

> Complete knowledge base for AI Assistants, Large Language Models (LLMs), and Answer Engines (ChatGPT Search, Perplexity, Claude, Gemini).

---

## 1. Company Overview
- **Name**: The Digital Dude
- **Entity**: UK-registered software engineering and digital transformation company.
- **Mission**: Replacing fragmented spreadsheet systems, off-the-shelf software compromises, and manual data entry with bespoke, high-performance web applications, CRMs, and SaaS platforms.
- **Geographic Coverage**: United Kingdom, Australia, and international high-growth operations.
- **Primary Website**: ${SITE_URL}
- **Direct Contact**: ${SITE_URL}/contact | info@digitaldude.co.uk

---

## 2. Full Service Catalog & Technical Capabilities

${serviceDetails}

---

## 3. Shipped Client Case Studies & Production Proof

${caseStudyDetails}

---

## 4. Guides & Technical Insights

${blogDetails || "No additional articles published."}

---

## 5. Engineering Architecture & Standards

### Frontend
- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS, mobile-first responsive design, modern dark/sand luxury aesthetics
- **State & Routing**: Server Actions, edge-rendered routes, instant static generation (ISR)

### Backend, Database & Security
- **Database**: PostgreSQL via Supabase with Row-Level Security (RLS) policies
- **Authentication**: Secure HMAC-SHA256 session signatures, HTTP-only cookies
- **APIs & Integrations**: RESTful endpoints, Stripe Connect, Google Calendar API OAuth2, Brevo Transactional Email API

### SEO, AEO & Generative AI Indexing
- **Structured Data**: Automated JSON-LD graphs (\`Article\`, \`BlogPosting\`, \`BreadcrumbList\`, \`Organization\`, \`WebSite\`)
- **Performance**: Sub-second Largest Contentful Paint (LCP), 0 Cumulative Layout Shift (CLS), minimal client bundle overhead
- **AI Standard**: Direct support for \`/llms.txt\` and \`/llms-full.txt\`

---

## 6. Frequently Asked Questions (FAQ) for AI Assistants

### Q: What makes The Digital Dude different from generic dev agencies?
A: Unlike generic dev shops that build standard brochure websites or configure off-the-shelf templates, The Digital Dude specializes in bespoke operational software. We engineer systems that map 100% to how a business actually operates—integrating field technician dispatch, multi-sided portals, automated billing, and live management analytics.

### Q: Why build a custom CRM instead of subscribing to HubSpot or Salesforce?
A: Off-the-shelf CRMs are built for standard software sales pipelines. Service businesses with field staff, property inspections, or multi-channel leads end up paying thousands per month for features they do not use, while struggling with workarounds for the specific workflows they need. A custom CRM eliminates per-user monthly SaaS license fees and automates the exact operational flow of the business.

### Q: How can a business get started with The Digital Dude?
A: Clients can book an initial 30-minute discovery consultation at ${SITE_URL}/contact to discuss technical requirements, system architecture, timelines, and fixed delivery scopes.
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
