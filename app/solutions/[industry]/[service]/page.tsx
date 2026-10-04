import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pseoIndustries } from "@/lib/pseo/data/industries";
import { pseoServices } from "@/lib/pseo/data/services";
import { getPseoPage } from "@/lib/pseo/engine";
import { PseoBreadcrumbs } from "@/components/pseo/PseoBreadcrumbs";
import { PseoRoiCalculator } from "@/components/pseo/PseoRoiCalculator";
import { PseoCaseStudyBridge } from "@/components/pseo/PseoCaseStudyBridge";
import { PseoArchitectureDiagram } from "@/components/pseo/PseoArchitectureDiagram";
import { PseoBookingCta } from "@/components/pseo/PseoBookingCta";
import { PseoJsonLd } from "@/components/pseo/PseoJsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_URL } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles, AlertTriangle, FileCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ industry: string; service: string }>;
}

export async function generateStaticParams() {
  const params: Array<{ industry: string; service: string }> = [];
  for (const ind of pseoIndustries) {
    for (const srv of pseoServices) {
      params.push({ industry: ind.slug, service: srv.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry, service } = await params;
  const slug = `solutions/${industry}/${service}`;
  const page = await getPseoPage(slug);

  if (!page) {
    return { title: "Solution Not Found | The Digital Dude" };
  }

  const url = `${SITE_URL}/${page.slug}`;
  const ogUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(page.heroHeadline)}&category=${encodeURIComponent(`${page.industryName} Solution`)}&tag=${encodeURIComponent(`Bespoke ${page.serviceName} • Full IP Ownership`)}`;

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

export default async function IndustrySolutionPage({ params }: PageProps) {
  const { industry, service } = await params;
  const slug = `solutions/${industry}/${service}`;
  const page = await getPseoPage(slug);

  if (!page) {
    notFound();
  }

  const industryData = pseoIndustries.find((i) => i.slug === industry);
  const otherServices = pseoServices.filter((s) => s.slug !== service);

  return (
    <>
      <PseoJsonLd page={page} />
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <PseoBreadcrumbs items={page.breadcrumbs} />

          {/* Hero */}
          <section className="rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-3.5 py-1 text-xs font-bold text-accent-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {page.heroBadge}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight leading-tight">
                {page.heroHeadline}
              </h1>

              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                {page.heroSubheadline}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Statutory Compliance Built-In
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  Unlimited User & Portal Seats
                </span>
              </div>
            </div>

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

          {/* Industry Pain Points Breakdown */}
          {industryData && (
            <section className="my-12 rounded-2xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Operational Bottlenecks We Eliminate
                </div>
                <h2 className="text-2xl font-bold text-navy mt-1">
                  Why Off-The-Shelf Software Fails {industryData.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industryData.corePainPoints.map((p, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 p-5 border border-slate-100 space-y-1">
                    <h3 className="text-sm font-bold text-navy">{p.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Interactive ROI Calculator */}
          <PseoRoiCalculator
            serviceName={page.serviceName || "Custom System"}
            currencySymbol="£"
          />

          {/* Key Workflows / Deliverables */}
          {page.deliverables && page.deliverables.length > 0 && (
            <section className="my-12 rounded-2xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-navy">
                  Bespoke Workflows Built for Your Operations
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Engineered around your exact team roles, dispatch sequences, and client deliverables
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary font-bold text-xs">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Statutory Compliance Standards */}
          {industryData && (
            <section className="my-12 rounded-2xl bg-slate-900 p-8 text-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-primary">
                <FileCheck className="h-4 w-4" />
                Statutory Regulatory & Compliance Readiness
              </div>
              <h3 className="text-xl font-bold text-white">
                Built to Comply with UK & Australian Standards
              </h3>
              <p className="text-xs text-slate-300">
                We embed audit logging, mandatory checklists, and time-stamped proof to satisfy regulatory scrutiny:
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {industryData.statutoryCompliance.map((std, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 font-mono border border-white/10"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Case Study Bridge */}
          <PseoCaseStudyBridge
            caseStudySlug={page.featuredCaseStudySlug}
            categoryLabel={`Relevant Case Study • ${page.industryName}`}
          />

          {/* Architecture Diagram */}
          <PseoArchitectureDiagram
            title={`System Topology for ${page.industryName}`}
            serviceName={page.serviceName}
            techStack={page.techStack}
          />

          {/* FAQs */}
          {page.faqs && page.faqs.length > 0 && (
            <section className="my-12 space-y-4">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-navy">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Answers to common questions about {page.serviceName} for {page.industryName}
                </p>
              </div>
              <FaqAccordion faqs={page.faqs} />
            </section>
          )}

          {/* Cross-Link Other Services in this Industry */}
          <section className="my-12 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy">
              Other Systems for {industryData?.name || "This Industry"}:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherServices.map((srv) => (
                <Link
                  key={srv.slug}
                  href={`/solutions/${industry}/${srv.slug}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 hover:bg-accent-primary hover:text-white transition group"
                >
                  <span>{srv.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {/* Booking CTA */}
          <PseoBookingCta serviceName={`${page.serviceName} for ${page.industryName}`} />
        </div>
      </main>
      <Footer />
    </>
  );
}
