import Link from "next/link";
import { Calendar, ArrowRight, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

interface PseoBookingCtaProps {
  city?: string;
  country?: string;
  serviceName?: string;
}

export function PseoBookingCta({
  city,
  country,
  serviceName = "Custom Software System",
}: PseoBookingCtaProps) {
  return (
    <div className="my-14 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-slate-950 p-8 md:p-12 text-white shadow-xl relative">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-accent-primary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-accent-primary border border-white/10">
            <Clock className="h-3.5 w-3.5" />
            30-Minute Architectural Discovery Call
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Ready to Build Your Bespoke {serviceName}
            {city ? ` in ${city}` : ""}?
          </h3>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Speak directly with an engineering principal. We’ll review your operational bottlenecks, evaluate off-the-shelf vs bespoke ROI, and outline a fixed-scope milestone delivery roadmap.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Fixed Price & Milestone Timeline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>100% IP Code Ownership</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Zero Ongoing Seat Fees</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
          <Link
            href={`/contact?source=pseo${city ? `&location=${encodeURIComponent(city)}` : ""}${country ? `&country=${encodeURIComponent(country)}` : ""}${serviceName ? `&service=${encodeURIComponent(serviceName)}` : ""}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-accent-primary/90 text-center"
          >
            <Calendar className="h-4 w-4" />
            Schedule Instant Discovery Call
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white border border-white/10 transition hover:bg-white/20 text-center"
          >
            Explore Case Studies
          </Link>
        </div>
      </div>
    </div>
  );
}
