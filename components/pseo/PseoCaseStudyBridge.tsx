import Link from "next/link";
import { ArrowRight, CheckCircle2, Award } from "lucide-react";
import { caseStudies } from "@/lib/content/caseStudies";

interface PseoCaseStudyBridgeProps {
  caseStudySlug?: string;
  categoryLabel?: string;
}

export function PseoCaseStudyBridge({
  caseStudySlug = "property-compliance-crm",
  categoryLabel = "Related Production Case Study",
}: PseoCaseStudyBridgeProps) {
  const match = caseStudies.find((c) => c.slug === caseStudySlug) || caseStudies[0];

  if (!match) return null;

  return (
    <div className="my-12 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-primary">
          <Award className="h-4 w-4" />
          {categoryLabel}
        </div>
        <span className="text-xs font-medium text-slate-500">{match.tag}</span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-3">
          <h4 className="text-xl md:text-2xl font-bold text-navy">
            {match.title}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {match.summary}
          </p>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Key Capabilities Delivered:
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {match.whatWeBuilt?.slice(0, 4).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4">
            <Link
              href={`/work/${match.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent-primary hover:text-accent-primary/80 transition"
            >
              Read In-Depth Case Study & Technical Architecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stats card */}
        <div className="lg:col-span-4 flex flex-col justify-center rounded-xl bg-white p-5 border border-slate-200 shadow-inner">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Validated Metrics
          </div>
          <div className="mt-4 space-y-3">
            {match.stats?.slice(0, 3).map((statStr, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                <div className="text-sm font-bold text-navy">{statStr}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
