import type { Metadata } from "next";
import Link from "next/link";
import { pseoComparisons } from "@/lib/pseo/data/comparisons";
import { Scale } from "lucide-react";
import { SITE_URL } from "@/lib/utils";
import { ComparePortalFilter } from "@/components/compare/ComparePortalFilter";

export const metadata: Metadata = {
  title: "Build vs Buy Software Comparison Guides | The Digital Dude",
  description:
    "Build vs buy guides: custom software against Salesforce, HubSpot, Zoho, Shopify, Airtable and more. Compare pricing, ownership and scalability.",
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: "Build vs Buy Software Comparison Guides | The Digital Dude",
    description:
      "Build vs buy guides: custom software against Salesforce, HubSpot, Zoho, Shopify, Airtable and more. Compare pricing, ownership and scalability.",
    url: `${SITE_URL}/compare`,
    siteName: "The Digital Dude",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Build vs Buy Software Comparison Guides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build vs Buy Software Comparison Guides | The Digital Dude",
    description:
      "Detailed comparisons of custom software vs off-the-shelf SaaS. Compare pricing, IP ownership, and scalability.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function CompareIndexPage() {
  const pageUrl = `${SITE_URL}/compare`;

  // Complete Schema.org Graph for CollectionPage & ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#collection`,
        url: pageUrl,
        name: "Build vs Buy Software Comparison Guides",
        headline: "Bespoke Software vs. Off-The-Shelf SaaS Platforms",
        description:
          "Build vs buy guides: custom software against Salesforce, HubSpot, Zoho, Shopify, Airtable and more. Compare pricing, ownership and scalability.",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: "The Digital Dude",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Comparisons",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Software Architecture Decision Guides",
        numberOfItems: pseoComparisons.length,
        itemListElement: pseoComparisons.map((comp, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: `Custom Software vs ${comp.competitorName}`,
          url: `${SITE_URL}/compare/${comp.slug === "custom-crm-vs-hubspot" ? "custom-crm-vs-hubspot" : comp.slug}`,
          description: comp.summary,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <section className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-navy transition">Home</Link>
            <span>/</span>
            <span className="font-semibold text-navy">Comparisons</span>
          </nav>

          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold text-accent-primary">
              <Scale className="h-4 w-4" />
              Build vs. Buy Architectural Decision Engine
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight">
              Bespoke Software vs. Off-The-Shelf SaaS
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              Tired of paying thousands in recurring per-user monthly software licenses? Discover the true long-term ROI, IP ownership advantages, and scalability of custom engineering.
            </p>
          </div>

          {/* Interactive Portal Filter & Directory */}
          <ComparePortalFilter comparisons={pseoComparisons} />
        </section>
      </main>
    </>
  );
}
