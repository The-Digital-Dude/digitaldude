import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pseoComparisons } from "@/lib/pseo/data/comparisons";
import { getPseoPage } from "@/lib/pseo/engine";
import { PseoBreadcrumbs } from "@/components/pseo/PseoBreadcrumbs";
import { CompetitorCompareInteractive } from "@/components/compare/CompetitorCompareInteractive";
import { ComparisonJumpBar } from "@/components/compare/ComparisonJumpBar";
import { PseoRoiCalculator } from "@/components/pseo/PseoRoiCalculator";
import { PseoCaseStudyBridge } from "@/components/pseo/PseoCaseStudyBridge";
import { PseoBookingCta } from "@/components/pseo/PseoBookingCta";
import { PseoJsonLd } from "@/components/pseo/PseoJsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_URL } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Scale,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Layers,
  Clock,
  Database,
  Server,
  DollarSign,
  TrendingDown
} from "lucide-react";

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

          {/* Hero Section */}
          <section id="overview" className="rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
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

              {/* Author & Editorial Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <User className="h-4 w-4 text-accent-primary" />
                  <span>By <a href="https://www.linkedin.com/in/farhad-hossain-a03522195/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary underline">Farhad Hossain</a>, Solutions Architect</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Updated: 10 October 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Reviewed for TCO & Architectural Accuracy</span>
                </div>
              </div>
            </div>

            {/* Core Stats */}
            {page.stats && page.stats.length > 0 && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
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

          {/* Sticky Long-Form Jump Navigation Bar */}
          <ComparisonJumpBar />

          {/* Editorial Integrity & Commercial Bias Disclosure */}
          <section className="my-8 rounded-2xl bg-amber-50/70 p-6 border border-amber-200/80 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs md:text-sm text-amber-900 leading-relaxed">
                <span className="font-bold block">Editorial Integrity & Commercial Disclosure:</span>
                DigitalDude is a custom software engineering studio. We build bespoke web platforms, so we have a clear commercial bias toward custom code. However, packaged solutions are frequently the right choice for small teams, standard pipelines, and early validation. We routinely advise clients to stay on {page.competitorName} when it serves their needs. This guide outlines the concrete operational and financial inflection points where bespoke software becomes viable.
              </div>
            </div>
          </section>

          {/* Head-to-Head Comparison Matrix Table */}
          {page.comparisonMatrix && page.comparisonMatrix.length > 0 && (
            <section id="matrix" className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
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

          {/* Interactive Decision Tool & 3/5-Year TCO Simulator */}
          <section id="tco-simulator" className="my-12 scroll-mt-24">
            <CompetitorCompareInteractive
              competitorName={compData?.competitorName || page.competitorName || "Off-the-shelf SaaS"}
              slug={slug}
              config={compData?.calculatorConfig}
              checklistItems={compData?.checklistItems}
            />
          </section>

          {/* 3-Year & 5-Year Total Cost of Ownership (TCO) Breakdown */}
          {page.tcoModels && page.tcoModels.length > 0 && (
            <section className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Financial Decision Framework
                </div>
                <h2 className="text-2xl font-bold text-navy">
                  Total Cost of Ownership (TCO) Analysis
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Honest multi-year financial modeling factoring licensing, onboarding, hosting, and developer retainers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {page.tcoModels.map((model, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <h3 className="font-bold text-navy text-base">{model.timeline}</h3>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          <TrendingDown className="h-3 w-3" />
                          {model.netDifference}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white p-4 border border-slate-200">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {page.competitorName}
                          </div>
                          <div className="text-xl font-extrabold text-red-600 mt-1">
                            {model.competitorEstimate}
                          </div>
                          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                            {model.competitorDetails.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl bg-emerald-50/80 p-4 border border-emerald-200">
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            Bespoke System
                          </div>
                          <div className="text-xl font-extrabold text-emerald-700 mt-1">
                            {model.bespokeEstimate}
                          </div>
                          <ul className="mt-3 space-y-1.5 text-xs text-emerald-900">
                            {model.bespokeDetails.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 italic pt-2 border-t border-slate-200">
                      *Note: Bespoke estimates include upfront build and cloud infrastructure. Client retains 100% intellectual property ownership upon final delivery.
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* When to Choose Competitor vs When to Choose Bespoke */}
          {page.whenToChoose && page.whenToChoose.length > 0 && (
            <section className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-navy">
                  Decision Matrix: When to Choose Which Option
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Practical guidelines to help technical leaders make an objective architecture choice
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.whenToChoose.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-5 border ${
                      item.recommendation === "bespoke"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-navy uppercase tracking-wider">
                        Scenario: {item.scenario}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          item.recommendation === "bespoke"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {item.recommendation === "bespoke" ? "Choose Bespoke" : `Choose ${page.competitorName}`}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                      {item.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Architecture Blueprint */}
          {page.architectureBlueprint && (
            <section className="my-12 rounded-3xl bg-navy text-white p-6 md:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/20 px-3 py-1 text-xs font-bold text-accent-primary mb-2">
                  <Server className="h-3.5 w-3.5" />
                  Engineering Specification
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Bespoke Production Stack Blueprint
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  The modern cloud architecture powering DigitalDude bespoke client systems
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-accent-primary uppercase tracking-wider">Frontend</div>
                  <div className="text-sm font-semibold text-white">{page.architectureBlueprint.frontend}</div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-accent-primary uppercase tracking-wider">Backend & Logic</div>
                  <div className="text-sm font-semibold text-white">{page.architectureBlueprint.backend}</div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-accent-primary uppercase tracking-wider">Database & Storage</div>
                  <div className="text-sm font-semibold text-white">{page.architectureBlueprint.database}</div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-accent-primary uppercase tracking-wider">Infrastructure</div>
                  <div className="text-sm font-semibold text-white">{page.architectureBlueprint.cloud}</div>
                </div>
              </div>

              {page.architectureBlueprint.integrations && page.architectureBlueprint.integrations.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Turnkey Third-Party Integrations:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {page.architectureBlueprint.integrations.map((tool, i) => (
                      <span key={i} className="text-xs bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Phased Migration Roadmap */}
          {page.migrationRoadmap && page.migrationRoadmap.length > 0 && (
            <section className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-3 py-1 text-xs font-bold text-accent-primary mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  Predictable Delivery
                </div>
                <h2 className="text-2xl font-bold text-navy">
                  Zero-Downtime Migration Roadmap
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  How we safely extract your historical data and transition operations from {page.competitorName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {page.migrationRoadmap.map((step, idx) => (
                  <div key={idx} className="rounded-2xl bg-slate-50 p-5 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-accent-primary uppercase tracking-wider">
                          {step.phase.split(":")[0]}
                        </span>
                        <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                          {step.duration}
                        </span>
                      </div>
                      <h3 className="font-bold text-navy text-sm mt-2">{step.phase.includes(":") ? step.phase.split(":")[1].trim() : step.phase}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{step.focus}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deliverables:</div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {step.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pros & Drawbacks Grid */}
          {compData && (
            <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor Limitations */}
              <div className="rounded-2xl bg-white p-6 border border-red-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                  <XCircle className="h-4 w-4" />
                  Key Limitations of {compData.competitorName}
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
                  Strategic Advantages of Bespoke Engineering
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

          {/* Case Study Bridge */}
          <PseoCaseStudyBridge
            caseStudySlug="property-compliance-crm"
            categoryLabel="Production Case Study Replacement"
          />

          {/* FAQs */}
          {page.faqs && page.faqs.length > 0 && (
            <section id="faqs" className="my-12 space-y-4 scroll-mt-24">
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
              Explore More Software & Platform Comparisons:
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
          <div id="booking" className="scroll-mt-24">
            <PseoBookingCta serviceName={`Software Alternative to ${page.competitorName}`} />
          </div>
        </div>
      </main>
    </>
  );
}
