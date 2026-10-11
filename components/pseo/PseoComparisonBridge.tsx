import Link from "next/link";
import { Scale, ArrowRight, CheckCircle2, TrendingDown, DollarSign } from "lucide-react";
import { pseoComparisons } from "@/lib/pseo/data/comparisons";

interface PseoComparisonBridgeProps {
  industrySlug: string;
  serviceSlug: string;
  industryName: string;
  serviceName: string;
}

export function PseoComparisonBridge({
  industrySlug,
  serviceSlug,
  industryName,
  serviceName,
}: PseoComparisonBridgeProps) {
  // Determine best matching competitor comparison guide
  let compSlug = "custom-crm-vs-hubspot";
  if (serviceSlug === "marketplace-development" || industrySlug === "community") {
    compSlug = "custom-marketplace-vs-sharetribe";
  } else if (industrySlug === "logistics" || serviceSlug === "internal-tools-portal") {
    compSlug = "bespoke-erp-vs-netsuite";
  } else if (industrySlug === "property" || serviceSlug === "crm-development") {
    compSlug = "custom-crm-vs-salesforce";
  } else if (serviceSlug === "saas-development" || serviceSlug === "mobile-app-development") {
    compSlug = "custom-software-vs-bubble-no-code";
  }

  const comp = pseoComparisons.find((c) => c.slug === compSlug) || pseoComparisons[0];

  return (
    <div className="my-12 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-lavender/20 p-6 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple">
          <Scale className="h-4 w-4" />
          Build vs. Buy Architectural Decision
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
          Evaluated for {industryName} Operations
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-xl md:text-2xl font-extrabold text-navy tracking-tight">
            Considering {comp.competitorName} for {industryName}? Here&apos;s the Architectural Tradeoff.
          </h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {comp.summary}
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>£0 / Seat Fees:</strong> Give all {industryName.toLowerCase()} operators and contractors access.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Custom Relational Schema:</strong> Built around physical jobs, routes, and compliance proof.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Full Code Ownership:</strong> Deployed directly to your cloud without vendor lock-in.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Fast Agile Launch:</strong> Shipped in 6–10 weeks vs. multi-month enterprise consultant cycles.</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              href={`/compare/${comp.slug}#tco-simulator`}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition cursor-pointer"
            >
              <span>Run Interactive TCO Simulator vs {comp.competitorName}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href={`/compare/${comp.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple transition"
            >
              Read Full Comparison Matrix &rarr;
            </Link>
          </div>
        </div>

        {/* Financial Stat Card */}
        <div className="lg:col-span-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Multi-Year Cost Comparison
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-900 border border-red-100 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              Typical {comp.competitorName} Expense:
            </div>
            <div className="text-sm font-extrabold text-red-700 font-mono">
              {comp.typicalMonthlyExpense}
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950 border border-emerald-100 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Bespoke Asset Model:
            </div>
            <div className="text-sm font-extrabold text-emerald-800 font-mono">
              Fixed proposal + £0 / user fees
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PseoComparisonBridge;
