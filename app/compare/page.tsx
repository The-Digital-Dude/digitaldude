import type { Metadata } from "next";
import Link from "next/link";
import { pseoComparisons } from "@/lib/pseo/data/comparisons";
import { Scale, ArrowRight, ShieldCheck, CheckCircle2, TrendingDown } from "lucide-react";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Build vs Buy Software Comparison Guides | The Digital Dude",
  description: "Detailed comparisons of custom software vs off-the-shelf SaaS (Salesforce, HubSpot, Sharetribe, NetSuite, Bubble). Compare pricing, IP ownership, and scalability.",
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
};

export default function CompareIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold text-accent-primary">
              <Scale className="h-4 w-4" />
              Build vs. Buy Architectural Guides
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-navy tracking-tight">
              Bespoke Software vs. Off-The-Shelf SaaS
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              Tired of paying thousands in recurring per-user monthly software licenses? Discover the true long-term ROI, IP ownership advantages, and scalability of custom engineering.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pseoComparisons.map((comp) => (
              <div
                key={comp.slug}
                className="flex flex-col justify-between rounded-3xl bg-white p-7 border border-slate-200 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {comp.category}
                  </div>
                  <h2 className="text-xl font-bold text-navy mt-3">
                    Custom vs {comp.competitorName}
                  </h2>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {comp.summary}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <TrendingDown className="h-4 w-4 shrink-0" />
                      <span className="font-semibold">Typical SaaS: {comp.typicalMonthlyExpense}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="font-semibold">Bespoke: £0 / user seat fees</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/compare/${comp.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-accent-primary/80 transition"
                  >
                    Read Full Comparison Matrix
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
