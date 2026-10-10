import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pseoComparisons } from "@/lib/pseo/data/comparisons";
import { getPseoPage } from "@/lib/pseo/engine";
import { PseoBreadcrumbs } from "@/components/pseo/PseoBreadcrumbs";
import { PseoRoiCalculator } from "@/components/pseo/PseoRoiCalculator";
import { PseoCaseStudyBridge } from "@/components/pseo/PseoCaseStudyBridge";
import { PseoArchitectureDiagram } from "@/components/pseo/PseoArchitectureDiagram";
import { PseoBookingCta } from "@/components/pseo/PseoBookingCta";
import { PseoJsonLd } from "@/components/pseo/PseoJsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_URL } from "@/lib/utils";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Scale, DollarSign } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return pseoComparisons
    .filter((c) => c.slug !== "custom-crm-vs-hubspot")
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPseoPage(`compare/${slug}`);

  if (!page) {
    return { title: "Comparison Not Found | The Digital Dude" };
  }

  const url = `${SITE_URL}/${page.slug}`;
  const ogUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(page.heroHeadline)}&category=${encodeURIComponent(`Build vs Buy • vs ${page.competitorName}`)}&tag=${encodeURIComponent(`Zero Per-Seat Fees • Full IP Ownership`)}`;

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url,
      siteName: "The Digital Dude",
      type: "website",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
      images: [ogUrl],
    },
  };
}

export default async function ComparisonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPseoPage(`compare/${slug}`);

  if (!page) {
    notFound();
  }

  const compData = pseoComparisons.find((c) => c.slug === slug);
  const otherComparisons = pseoComparisons.filter((c) => c.slug !== slug);

  return (
    <>
      <PseoJsonLd page={page} />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <PseoBreadcrumbs items={page.breadcrumbs} />

          {/* Hero */}
          <section className="rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-3.5 py-1 text-xs font-bold text-accent-primary">
                <Scale className="h-3.5 w-3.5" />
                {page.heroBadge}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight leading-tight">
                {page.heroHeadline}
              </h1>

              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                {page.heroSubheadline}
              </p>
            </div>

            {/* Core Stats */}
            {page.stats && page.stats.length > 0 && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                {page.stats.slice(0, 3).map((stat, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="text-2xl font-extrabold text-navy">{stat.metric}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      {stat.label}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{stat.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Head-to-Head Comparison Matrix Table */}
          {page.comparisonMatrix && page.comparisonMatrix.length > 0 && (
            <section className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-navy">
                  Head-to-Head Feature & Cost Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  How bespoke software architecture compares against {page.competitorName}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-4 font-bold text-navy text-xs uppercase tracking-wider w-1/4">
                        Evaluation Criteria
                      </th>
                      <th className="p-4 font-bold text-emerald-700 bg-emerald-50/70 text-xs uppercase tracking-wider w-3/8 rounded-t-lg">
                        ✨ Bespoke Software (Digital Dude)
                      </th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider w-3/8">
                        {page.competitorName} (Off-the-Shelf)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {page.comparisonMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-semibold text-slate-800 text-xs md:text-sm">
                          {row.dimension}
                        </td>
                        <td className="p-4 text-emerald-900 bg-emerald-50/30 text-xs md:text-sm font-medium">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{row.bespoke}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 text-xs md:text-sm">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>{row.competitorOrOffTheShelf}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Pros & Drawbacks Grid */}
          {compData && (
            <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor Drawbacks */}
              <div className="rounded-2xl bg-white p-6 border border-red-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                  <XCircle className="h-4 w-4" />
                  Limitations of {compData.competitorName}
                </div>
                <ul className="space-y-3">
                  {compData.competitorDrawbacks.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bespoke Advantages */}
              <div className="rounded-2xl bg-white p-6 border border-emerald-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Advantages of Bespoke Engineering
                </div>
                <ul className="space-y-3">
                  {compData.bespokeAdvantages.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Interactive ROI Calculator */}
          <PseoRoiCalculator
            serviceName={`System vs ${page.competitorName}`}
            currencySymbol="£"
          />

          {/* Case Study Bridge */}
          <PseoCaseStudyBridge
            caseStudySlug="property-compliance-crm"
            categoryLabel="Production Case Study Replacement"
          />

          {/* Architecture Diagram */}
          <PseoArchitectureDiagram
            title="Next.js 16 + Supabase Modern Stack Architecture"
            serviceName="Bespoke System"
          />

          {/* FAQs */}
          {page.faqs && page.faqs.length > 0 && (
            <section className="my-12 space-y-4">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-navy">Migration & Comparison FAQs</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Common questions regarding migrating from {page.competitorName}
                </p>
              </div>
              <FaqAccordion faqs={page.faqs} />
            </section>
          )}

          {/* Related Comparisons */}
          <section className="my-12 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy">
              Other Software & Platform Comparisons:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherComparisons.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 hover:bg-accent-primary hover:text-white transition group"
                >
                  <span>Custom vs {c.competitorName}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {/* Booking CTA */}
          <PseoBookingCta serviceName={`Software Alternative to ${page.competitorName}`} />
        </div>
      </main>
    </>
  );
}
