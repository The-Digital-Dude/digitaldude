import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/utils";
import { services } from "@/lib/content/services";
import { getCaseStudies } from "@/lib/caseStudiesServer";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export const revalidate = 3600; // Refresh every hour or on-demand

export async function GET() {
  const caseStudies = await getCaseStudies();

  // Fetch published blog posts from Supabase with fallback
  let blogPosts: Array<{ slug: string; title: string; excerpt?: string }> = [
    {
      slug: "why-growing-service-businesses-outgrow-spreadsheets",
      title: "Why Growing Service Businesses Outgrow Spreadsheets & Off-the-Shelf CRMs",
      excerpt: "In-depth architectural analysis of the failure points of spreadsheets and off-the-shelf software, and the ROI of bespoke operational CRMs."
    },
    {
      slug: "how-to-build-a-three-sided-marketplace-app",
      title: "How to Build a 3-App Marketplace: Customer, Provider & Admin Architecture",
      excerpt: "Technical breakdown of upfront payment flows, dispatch algorithms, proof-of-work photo enforcement, and automated Stripe payouts."
    }
  ];

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data && data.length > 0) {
        blogPosts = data;
      }
    }
  } catch {}

  const content = `# The Digital Dude
> We build custom CRMs, SaaS platforms, on-demand marketplaces, and operational software systems for growing service businesses in the UK and Australia.

## Summary
The Digital Dude is a specialized software engineering and technical growth agency. We design, architect, and deploy bespoke web applications, automated business workflows, multi-portal CRMs, and scalable SaaS platforms that replace spreadsheet bottlenecks and off-the-shelf software limitations.

## Core Capabilities
- **Custom CRM Development**: Bespoke sales pipelines, job dispatch, mobile technician apps, multi-portal architectures, and role-based permissions.
- **SaaS Platform Engineering**: Multi-tenant SaaS architectures, AI-powered automation workflows, subscription billing (Stripe), and real-time analytics.
- **On-Demand 3-Sided Marketplaces**: Synchronized ecosystems connecting customer booking apps, service provider dispatch interfaces, and central admin operations portals.
- **ERP & Operations Systems**: Automated job status transitions, billing integrations, and elimination of manual data entry.
- **Technical SEO & Web Architecture**: Next.js App Router edge rendering, sub-second Largest Contentful Paint (LCP), Article/Product Schema.org structured data, and Core Web Vitals optimization.

## Primary Services
${services
  .map(
    (s) => `- [${s.navLabel}](${SITE_URL}/services/${s.slug}): ${s.oneLiner}`
  )
  .join("\n")}

## Shipped Case Studies
${caseStudies
  .map(
    (c) => `- [${c.title}](${SITE_URL}/work/${c.slug}): ${c.summary}`
  )
  .join("\n")}

## Published Research & Technical Insights
${blogPosts
  .map(
    (b) => `- [${b.title}](${SITE_URL}/blog/${b.slug}): ${b.excerpt || "Read full technical breakdown and architectural blueprints."}`
  )
  .join("\n")}

## Target Geography & Clients
- Primary markets: United Kingdom and Australia.
- Industry verticals: Property & Real Estate, Logistics & Transportation, Home Services, Recruitment, Travel & Ticketing, Community & Matchmaking, and Education/Tutoring.

## Contact & Discovery
- Official Website: ${SITE_URL}
- Book a Discovery Call: ${SITE_URL}/contact
- Email: info@digitaldude.co.uk
- Company Registration: UK Registered Company

## Full Knowledge Base
For our exhaustive technical documentation, data models, and complete system breakdown, see:
- Full LLM Context: ${SITE_URL}/llms-full.txt
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
