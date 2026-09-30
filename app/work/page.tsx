import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { IndustryFilterBar } from "@/components/IndustryFilterBar";
import { getCaseStudies } from "@/lib/caseStudiesServer";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("work", "/work");
export const revalidate = 60;

export default async function WorkPage() {
  const projects = await getCaseStudies();

  const workJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/work#webpage`,
        url: `${SITE_URL}/work`,
        name: "Case Studies & Shipped Client Systems | The Digital Dude",
        description: "Case studies of custom CRMs, SaaS platforms, marketplace engines, and operational ERP systems engineered and deployed by The Digital Dude.",
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
            name: "Work",
            item: `${SITE_URL}/work`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Shipped Systems & Case Studies",
        itemListElement: projects.map((proj, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: proj.title,
          description: proj.pageSummary || proj.headline,
          url: `${SITE_URL}/work/${proj.slug}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Systems our team has built and shipped
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">
          Production systems across multiple industries. We keep client names private,
          so each project is described by what it does, the architecture, and what changed.
        </p>

        <div className="mt-10">
          <IndustryFilterBar projects={projects} />
        </div>
      </section>

      <section className="bg-lavender py-16">
        <div className="mx-auto max-w-content px-6 text-center">
          <p className="mx-auto max-w-2xl text-navy/80">
            Don&rsquo;t see your industry? Most of what we build solves the same problem: too many
            tools, not enough visibility.{" "}
            <Link href="/contact" className="font-semibold text-purple">
              Book a call
            </Link>{" "}
            and tell us how your business runs.
          </p>
        </div>
      </section>
    </>
  );
}

