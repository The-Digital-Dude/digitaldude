import type { Metadata } from "next";
import Link from "next/link";
import { pseoIndustries } from "@/lib/pseo/data/industries";
import { pseoServices } from "@/lib/pseo/data/services";
import { Layers, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Industry Vertical Software Solutions | The Digital Dude",
  description: "Bespoke CRMs, operational portals, and cloud software engineered for Property, Logistics, Travel, Recruitment, Home Services, and EdTech.",
  alternates: {
    canonical: `${SITE_URL}/solutions`,
  },
};

export default function SolutionsIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold text-accent-primary">
              <Layers className="h-4 w-4" />
              Vertical Industry Solutions
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight">
              Bespoke Software Engineered for Your Industry Reality
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              We eliminate spreadsheet patchwork and rigid SaaS constraints with software custom-mapped to your exact industry workflows, compliance standards, and billing rules.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pseoIndustries.map((ind) => (
              <div
                key={ind.slug}
                id={ind.slug}
                className="flex flex-col justify-between rounded-3xl bg-white p-7 border border-slate-200 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="inline-block rounded-full bg-accent-primary/10 px-3 py-1 text-xs font-bold text-accent-primary">
                    {ind.badge}
                  </div>
                  <h2 className="text-xl font-bold text-navy mt-3">{ind.name}</h2>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {ind.overview}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Popular Solutions:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pseoServices.slice(0, 3).map((srv) => (
                        <Link
                          key={srv.slug}
                          href={`/solutions/${ind.slug}/${srv.slug}`}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-accent-primary hover:text-white transition"
                        >
                          {srv.navLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/solutions/${ind.slug}/${pseoServices[0].slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-accent-primary/80 transition"
                  >
                    View All {ind.name} Solutions
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
  );
}
