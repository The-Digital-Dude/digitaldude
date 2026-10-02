import Link from "next/link";
import type { IndustryPage } from "@/lib/content/industries";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { services } from "@/lib/content/services";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ProjectCard } from "@/components/ProjectCard";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  ArrowRight 
} from "lucide-react";

import { ViewContentTracker } from "@/components/ViewContentTracker";

export function IndustryTemplate({ industry }: { industry: IndustryPage }) {
  const caseStudy = getCaseStudy(industry.caseStudySlug);
  const relatedServices = industry.relatedServiceSlugs
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const industryUrl = `${SITE_URL}/industries/${industry.slug}`;

  const industryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${industryUrl}#webpage`,
        url: industryUrl,
        name: industry.headline,
        description: industry.intro,
        isPartOf: {
          "@type": "WebSite",
          name: "The Digital Dude",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Industries",
            item: `${SITE_URL}/#industries`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: industry.navLabel,
            item: industryUrl,
          },
        ],
      },
      ...(industry.faqs && industry.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: industry.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <ViewContentTracker
        contentName={industry.headline}
        contentCategory={industry.displayLabel}
        contentIds={[industry.slug]}
        contentType="industry"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(industryJsonLd) }}
      />

      {/* Hero */}
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple mb-4">
          <Sparkles size={14} />
          {industry.displayLabel}
        </div>
        <h1 className="max-w-4xl text-3xl font-extrabold text-navy sm:text-5xl leading-[1.15] tracking-tight">
          {industry.headline}
        </h1>
        <p className="mt-5 max-w-3xl text-lg sm:text-xl text-navy/75 leading-relaxed font-normal">
          {industry.intro}
        </p>

        {/* Industry Key Stats */}
        {industry.stats && industry.stats.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3 rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
            {industry.stats.map((stat, idx) => (
              <div key={idx} className="border-l-2 border-purple pl-4">
                <span className="text-2xl sm:text-3xl font-bold text-navy">{stat.metric}</span>
                <p className="text-xs font-bold uppercase tracking-wide text-purple mt-0.5">{stat.label}</p>
                <p className="text-xs text-navy/60 mt-1 leading-normal">{stat.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Operational Bottlenecks We Eliminate */}
      <section className="mx-auto max-w-content px-6 py-12 border-t border-black/5">
        <div className="max-w-3xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500">Industry Bottlenecks</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
            <AlertTriangle size={24} className="text-amber-500" />
            What Holds Growing Businesses Back in {industry.navLabel}
          </h2>
          <p className="text-sm text-navy/60 mt-1">
            Common operational failure points we solve when replacing spreadsheets and generic software.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {industry.painPoints.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-red-100 bg-red-50/40 p-5 shadow-xs flex items-start gap-3.5">
              <span className="h-2 w-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <p className="text-sm font-medium text-navy/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Build: Custom Systems */}
      <section className="bg-lavender/40 py-16 border-y border-black/5">
        <div className="mx-auto max-w-content px-6">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Bespoke Engineering</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
              <Layers size={24} className="text-purple" />
              Custom Systems &amp; Workflows We Deploy for {industry.navLabel}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {industry.whatWeBuild.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-black/5 bg-white p-5 shadow-xs flex items-start gap-3.5">
                <CheckCircle2 size={18} className="text-purple flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-navy/85 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Matrix if available */}
      {industry.comparison && industry.comparison.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-16">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Strategic ROI</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
              <TrendingUp size={24} className="text-purple" />
              Custom System vs. Spreadsheets &amp; Legacy Tools
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-navy">
                    <th className="p-4 sm:p-5 w-1/4">Workflow Area</th>
                    <th className="p-4 sm:p-5 w-3/8 text-purple bg-purple/5">Bespoke Solution (The Digital Dude)</th>
                    <th className="p-4 sm:p-5 w-3/8 text-navy/50">Spreadsheets &amp; Manual Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {industry.comparison.map((row, idx) => (
                    <tr key={idx} className="transition hover:bg-slate-50/50">
                      <td className="p-4 sm:p-5 font-bold text-navy">{row.dimension}</td>
                      <td className="p-4 sm:p-5 text-navy/90 font-medium bg-purple/5 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-purple flex-shrink-0 mt-0.5" />
                          <span>{row.bespokeSolution}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 text-navy/60 leading-relaxed">{row.genericOrSpreadsheet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Real Work Case Study in this Industry */}
      {caseStudy && (
        <section className="mx-auto max-w-content px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Production Proof</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">
                Featured Case Study in {industry.navLabel}
              </h2>
            </div>
            <Link
              href={`/work/${caseStudy.slug}`}
              className="text-xs font-bold text-purple hover:underline flex items-center gap-1"
            >
              Read full breakdown <ArrowRight size={14} />
            </Link>
          </div>
          <div className="max-w-md">
            <ProjectCard project={caseStudy} />
          </div>
        </section>
      )}

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-10 border-t border-black/5">
          <h2 className="text-xl font-bold text-navy">Related Engineering Capabilities</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {relatedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy hover:border-purple hover:text-purple shadow-xs transition"
              >
                {service.navLabel} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Industry Specific FAQs */}
      <section className="mx-auto max-w-content px-6 py-16">
        <div className="max-w-3xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-purple">Industry FAQs</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-3xl">
          <FaqAccordion faqs={industry.faqs} />
        </div>
      </section>

      <StandardCTA />
    </>
  );
}
