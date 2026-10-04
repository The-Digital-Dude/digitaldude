import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pseoLocations } from "@/lib/pseo/data/locations";
import { pseoServices } from "@/lib/pseo/data/services";
import { MapPin, ArrowRight, CheckCircle2, Globe, ShieldCheck } from "lucide-react";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Engineering Hubs & Regional Locations | The Digital Dude",
  description: "Bespoke software engineering, custom CRM development, and multi-tenant SaaS architecture for high-growth service enterprises across the UK and Australia.",
  alternates: {
    canonical: `${SITE_URL}/locations`,
  },
};

export default function LocationsIndexPage() {
  const ukLocations = pseoLocations.filter((l) => l.countryCode === "UK");
  const auLocations = pseoLocations.filter((l) => l.countryCode === "AU");

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold text-accent-primary">
              <Globe className="h-4 w-4" />
              United Kingdom & Australia Engineering Hubs
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight">
              Bespoke Software & Custom Systems in Your Local Market
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              We design, architect, and deploy high-performance CRMs, SaaS platforms, and operational workflows for high-growth enterprises across key metropolitan corridors.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-navy">10 Hubs</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                UK & Australia Coverage
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Local timezone engineering & compliance alignment (GDPR, APP)
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-emerald-600">£0 / Seat</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Zero Per-User Licensing
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Scale your team without recurring software penalties
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-accent-primary">100% IP</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Proprietary Codebase
              </div>
              <div className="text-xs text-slate-500 mt-2">
                You own all code, schemas, and relational assets
              </div>
            </div>
          </div>

          {/* UK Section */}
          <div className="mt-16 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <span className="text-3xl">🇬🇧</span>
              <div>
                <h2 className="text-2xl font-bold text-navy">United Kingdom Locations</h2>
                <p className="text-xs text-slate-500">London, Manchester, West Midlands, Yorkshire & Scotland</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ukLocations.map((loc) => (
                <div
                  key={loc.slug}
                  id={loc.slug}
                  className="flex flex-col justify-between rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-navy">{loc.city}</h3>
                      <span className="text-xs font-medium text-slate-400">{loc.region}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {loc.heroTagline}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Available Services:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {pseoServices.slice(0, 3).map((srv) => (
                          <Link
                            key={srv.slug}
                            href={`/locations/${loc.slug}/${srv.slug}`}
                            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-accent-primary hover:text-white transition"
                          >
                            {srv.navLabel}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/locations/${loc.slug}/${pseoServices[0].slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-accent-primary/80 transition"
                    >
                      Explore {loc.city} Hub
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Australia Section */}
          <div className="mt-16 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <span className="text-3xl">🇦🇺</span>
              <div>
                <h2 className="text-2xl font-bold text-navy">Australia Locations</h2>
                <p className="text-xs text-slate-500">Sydney, Melbourne, Brisbane & Perth</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {auLocations.map((loc) => (
                <div
                  key={loc.slug}
                  id={loc.slug}
                  className="flex flex-col justify-between rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-navy">{loc.city}</h3>
                      <span className="text-xs font-medium text-slate-400">{loc.region}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {loc.heroTagline}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Available Services:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {pseoServices.map((srv) => (
                          <Link
                            key={srv.slug}
                            href={`/locations/${loc.slug}/${srv.slug}`}
                            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-accent-primary hover:text-white transition"
                          >
                            {srv.navLabel}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/locations/${loc.slug}/${pseoServices[0].slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-accent-primary/80 transition"
                    >
                      Explore {loc.city} Hub
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
