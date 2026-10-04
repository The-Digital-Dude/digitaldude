import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pseoLocations } from "@/lib/pseo/data/locations";
import { pseoServices } from "@/lib/pseo/data/services";
import { getPseoPage, getAllCodePseoPages } from "@/lib/pseo/engine";
import { PseoBreadcrumbs } from "@/components/pseo/PseoBreadcrumbs";
import { PseoRoiCalculator } from "@/components/pseo/PseoRoiCalculator";
import { PseoCaseStudyBridge } from "@/components/pseo/PseoCaseStudyBridge";
import { PseoArchitectureDiagram } from "@/components/pseo/PseoArchitectureDiagram";
import { PseoBookingCta } from "@/components/pseo/PseoBookingCta";
import { PseoJsonLd } from "@/components/pseo/PseoJsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_URL } from "@/lib/utils";
import { MapPin, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Building2 } from "lucide-react";

interface PageProps {
  params: Promise<{ city: string; service: string }>;
}

export async function generateStaticParams() {
  const params: Array<{ city: string; service: string }> = [];
  for (const loc of pseoLocations) {
    for (const srv of pseoServices) {
      params.push({ city: loc.slug, service: srv.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city, service } = await params;
  const slug = `locations/${city}/${service}`;
  const page = await getPseoPage(slug);

  if (!page) {
    return { title: "Page Not Found | The Digital Dude" };
  }

  const url = `${SITE_URL}/${page.slug}`;
  const ogUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(page.heroHeadline)}&category=${encodeURIComponent(`${page.city} Hub • ${page.country}`)}&tag=${encodeURIComponent(`Bespoke ${page.serviceName} • £0 / Seat Licensing`)}`;

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

export default async function LocationServicePage({ params }: PageProps) {
  const { city, service } = await params;
  const slug = `locations/${city}/${service}`;
  const page = await getPseoPage(slug);

  if (!page) {
    notFound();
  }

  const locationData = pseoLocations.find((l) => l.slug === city);
  const otherServices = pseoServices.filter((s) => s.slug !== service);

  return (
    <>
      <PseoJsonLd page={page} />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumbs */}
          <PseoBreadcrumbs items={page.breadcrumbs} />

          {/* Hero Section */}
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

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-accent-primary" />
                  {page.city}, {page.country}
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  100% IP Code Ownership
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  Fixed-Price Milestone Delivery
                </span>
              </div>
            </div>

            {/* Core Stats Row */}
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

          {/* Interactive ROI Calculator */}
          <PseoRoiCalculator
            serviceName={page.serviceName || "Custom System"}
            currencySymbol={page.currencySymbol || "£"}
          />

          {/* Deliverables Grid */}
          {page.deliverables && page.deliverables.length > 0 && (
            <section className="my-12 rounded-2xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-navy">
                  What We Engineer for {page.city} Enterprises
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete production deliverables included in your bespoke rollout
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

          {/* Contextual Case Study Bridge */}
          <PseoCaseStudyBridge
            caseStudySlug={page.featuredCaseStudySlug}
            categoryLabel={`Featured Case Study • ${page.serviceName}`}
          />

          {/* Architecture Diagram */}
          <PseoArchitectureDiagram
            title={`Modular Architecture Blueprint for ${page.city} Operations`}
            serviceName={page.serviceName}
            techStack={page.techStack}
          />

          {/* Local Market Context */}
          {locationData && (
            <section className="my-12 rounded-2xl bg-white p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-primary">
                <Building2 className="h-4 w-4" />
                Local Ecosystem & Districts
              </div>
              <h3 className="text-xl font-bold text-navy">
                Partnering with High-Velocity Businesses in Greater {locationData.region}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {locationData.localIntro}
              </p>

              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Areas & Districts Served in {locationData.city}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {locationData.suburbsAndAreas.map((area, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* FAQs */}
          {page.faqs && page.faqs.length > 0 && (
            <section className="my-12 space-y-4">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-navy">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Everything you need to know about bespoke development in {page.city}
                </p>
              </div>
              <FaqAccordion faqs={page.faqs} />
            </section>
          )}

          {/* Related Services in this City */}
          <section className="my-12 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy">
              Other Software Engineering Services in {page.city}:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherServices.map((srv) => (
                <Link
                  key={srv.slug}
                  href={`/locations/${city}/${srv.slug}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700 hover:bg-accent-primary hover:text-white transition group"
                >
                  <span>{srv.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {/* Booking CTA */}
          <PseoBookingCta
            city={page.city}
            country={page.country}
            serviceName={page.serviceName}
          />
        </div>
      </main>
    </>
  );
}
