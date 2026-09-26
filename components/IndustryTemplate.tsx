import Link from "next/link";
import type { IndustryPage } from "@/lib/content/industries";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { services } from "@/lib/content/services";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ProjectCard } from "@/components/ProjectCard";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

export function IndustryTemplate({ industry }: { industry: IndustryPage }) {
  const caseStudy = getCaseStudy(industry.caseStudySlug);
  const relatedServices = industry.relatedServiceSlugs
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const industryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: industry.navLabel,
            item: `${SITE_URL}/industries/${industry.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: industry.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(industryJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <span className="text-xs font-semibold uppercase tracking-wide text-purple">
          {industry.displayLabel}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold text-navy sm:text-4xl">
          {industry.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">{industry.intro}</p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">What we hear from businesses like yours</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {industry.painPoints.map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">What we build</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {industry.whatWeBuild.map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {caseStudy && (
        <section className="mx-auto max-w-content px-6 py-10">
          <h2 className="text-xl font-bold text-navy">Real work in this industry</h2>
          <div className="mt-6 max-w-md">
            <ProjectCard project={caseStudy} />
          </div>
        </section>
      )}

      {relatedServices.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-10">
          <h2 className="text-xl font-bold text-navy">Related services</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {relatedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="rounded-full border border-tint bg-lavender px-4 py-2 text-sm font-semibold text-purple hover:border-purple"
              >
                {service.navLabel}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">FAQs</h2>
        <div className="mt-6 max-w-3xl">
          <FaqAccordion faqs={industry.faqs} />
        </div>
      </section>

      <StandardCTA />
    </>
  );
}
