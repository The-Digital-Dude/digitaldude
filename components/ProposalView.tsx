"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Share2,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  Cpu,
  ShieldCheck,
  Building,
  Mail,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Check
} from "lucide-react";
import { Proposal, ArchitectureModule, DeliverablePhase } from "@/lib/content/proposals";

import Image from "next/image";

export function ProposalView({ proposal }: { proposal: Proposal }) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback
      }
    }
  };

  const techStackList: string[] = Array.isArray(proposal.tech_stack)
    ? proposal.tech_stack
    : typeof proposal.tech_stack === "string"
      ? JSON.parse(proposal.tech_stack || "[]")
      : [];

  const modulesList: ArchitectureModule[] = Array.isArray(proposal.architecture_modules)
    ? proposal.architecture_modules
    : typeof proposal.architecture_modules === "string"
      ? JSON.parse(proposal.architecture_modules || "[]")
      : [];

  const phasesList: DeliverablePhase[] = Array.isArray(proposal.deliverable_phases)
    ? proposal.deliverable_phases
    : typeof proposal.deliverable_phases === "string"
      ? JSON.parse(proposal.deliverable_phases || "[]")
      : [];

  return (
    <div className="min-h-screen bg-slate-50 text-navy selection:bg-purple/20 selection:text-purple">
      {/* Top Floating Action Bar (Hidden during print) */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center"
          >
            <Image
              src="/logo-full-color.png"
              alt="The Digital Dude"
              width={160}
              height={30}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy/70 hover:bg-slate-50 hover:text-navy transition shadow-2xs"
            >
              <Share2 size={13} />
              {copied ? "Link Copied!" : "Share Link"}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-1.5 text-xs font-bold text-white hover:bg-purple/90 transition shadow-xs"
            >
              <Printer size={13} />
              Save as PDF / Print
            </button>
          </div>
        </div>
      </nav>

      {/* Main Printable Document Container */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:p-0">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-12 print:rounded-none print:border-none print:p-0 print:shadow-none">
          
          {/* Printable Official Letterhead Header (Visible in PDF / Print) */}
          <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-full-color.png"
              alt="The Digital Dude"
              className="h-8 w-auto"
            />
            <div className="text-right text-[11px] text-slate-600 leading-tight">
              <strong className="text-slate-900 font-bold block">The Digital Dude Ltd</strong>
              <span>digitaldude.co.uk · info@digitaldude.co.uk</span>
            </div>
          </div>

          {proposal.status === "instant_draft" && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 print:hidden">
              <strong className="font-bold">This is an automatic starting point, not a final quote.</strong>{" "}
              It was generated instantly from your booking form, before anyone on our team has spoken with you.
              Timeline and scope below are illustrative — nothing here is confirmed until we&rsquo;ve talked and
              agreed a real proposal together.
            </div>
          )}

          {/* Header & Meta Bar */}
          <div className="border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-purple/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple">
                  <Sparkles size={13} /> Technical Specification & Project Scope
                </span>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy sm:text-4xl">
                  {proposal.project_title}
                </h1>
                <p className="mt-2 text-sm text-navy/70 sm:text-base">
                  Prepared for <strong className="text-navy font-semibold">{proposal.company_name}</strong> · Attention: {proposal.client_name}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-1.5 text-navy/70 min-w-[200px]">
                <div>
                  <span className="text-navy/50 font-medium">Ref Code:</span>{" "}
                  <strong className="font-mono text-navy">{proposal.slug}</strong>
                </div>
                <div>
                  <span className="text-navy/50 font-medium">Status:</span>{" "}
                  <span className="capitalize font-bold text-emerald-600">{proposal.status}</span>
                </div>
                <div>
                  <span className="text-navy/50 font-medium">Valid Until:</span>{" "}
                  <strong className="text-navy">{proposal.valid_until}</strong>
                </div>
                <div>
                  <span className="text-navy/50 font-medium">Region:</span>{" "}
                  <strong className="text-navy">{proposal.country}</strong>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1">
                  <Layers size={13} className="text-purple" /> System Type
                </span>
                <p className="mt-1 text-sm font-bold text-navy">{proposal.system_type}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1">
                  <Clock size={13} className="text-purple" /> Target Timeline
                </span>
                <p className="mt-1 text-sm font-bold text-navy">{proposal.target_timeline}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1">
                  <Zap size={13} className="text-purple" /> Estimated Budget
                </span>
                <p className="mt-1 text-sm font-bold text-navy">{proposal.budget_range}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-purple" /> IP Ownership
                </span>
                <p className="mt-1 text-sm font-bold text-emerald-600">100% Client Owned</p>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Scope Summary & Problem Statement */}
          <div className="py-8 border-b border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple/10 text-xs font-bold text-purple">1</span>
              Executive Summary & Problem Statement
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-navy/80">
              {proposal.scope_summary}
            </p>

            {proposal.problem_statement && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 text-xs sm:text-sm text-navy/80">
                <strong className="block font-bold text-amber-900 mb-1">Current Operational Challenge / Bottleneck:</strong>
                {proposal.problem_statement}
              </div>
            )}
          </div>

          {/* Section 2: Recommended Modern Technical Architecture */}
          <div className="py-8 border-b border-slate-200 space-y-5">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple/10 text-xs font-bold text-purple">2</span>
              Recommended Modern Technical Architecture
            </h2>
            <p className="text-xs sm:text-sm text-navy/70 leading-relaxed">
              We engineer bespoke software on state-of-the-art enterprise foundations ensuring zero recurring seat licenses, sub-second latency, and complete proprietary ownership.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {techStackList.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple/10 text-purple">
                    <Check size={14} />
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm font-bold text-navy">{item}</strong>
                    <p className="text-[11px] text-navy/60 mt-0.5">
                      Production standard, high-concurrency, SOC2/GDPR compliant.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: System Architecture Modules & Deliverables */}
          <div className="py-8 border-b border-slate-200 space-y-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple/10 text-xs font-bold text-purple">3</span>
              System Architecture Modules & Scope Breakdown
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {modulesList.map((mod, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-navy">{mod.name}</h3>
                    {mod.phase && (
                      <span className="rounded-md bg-purple/10 px-2 py-0.5 text-[10px] font-bold text-purple uppercase tracking-wider">
                        {mod.phase}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-navy/70 leading-relaxed">{mod.description}</p>

                  {mod.deliverables && mod.deliverables.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy/50 block">
                        Included Deliverables:
                      </span>
                      {mod.deliverables.map((d, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-2 text-xs text-navy/80">
                          <CheckCircle2 size={13} className="text-purple shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: 4-Phase Agile Implementation Roadmap */}
          <div className="py-8 border-b border-slate-200 space-y-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple/10 text-xs font-bold text-purple">4</span>
              4-Phase Agile Implementation Roadmap
            </h2>

            <div className="space-y-4">
              {phasesList.map((phase, pIdx) => (
                <div key={pIdx} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-navy">{phase.phase}</h3>
                    <span className="rounded-md bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-navy/70">
                      {phase.duration}
                    </span>
                  </div>

                  {phase.milestones && phase.milestones.length > 0 && (
                    <ul className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-slate-200/60">
                      {phase.milestones.map((m, mIdx) => (
                        <li key={mIdx} className="flex items-center gap-2 text-xs text-navy/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Commercial Guarantees & Client Protections */}
          <div className="py-8 border-b border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple/10 text-xs font-bold text-purple">5</span>
              Commercial Guarantees & Ownership Terms
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <strong className="text-xs font-bold text-navy block">100% Intellectual Property</strong>
                <p className="mt-1 text-xs text-navy/70 leading-relaxed">
                  You own all source code, database schemas, Figma design files, and deployment keys upon final milestone completion.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <strong className="text-xs font-bold text-navy block">Zero Per-Seat SaaS Taxes</strong>
                <p className="mt-1 text-xs text-navy/70 leading-relaxed">
                  Built to scale from 5 to 500 team members without monthly per-user licensing fees.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <strong className="text-xs font-bold text-navy block">30-Day Post-Launch Hypercare</strong>
                <p className="mt-1 text-xs text-navy/70 leading-relaxed">
                  Dedicated bug fixes, staff onboarding assistance, and performance monitoring included post-deployment.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Next Steps & Booking Confirmation */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
            <div>
              <h3 className="text-base font-bold text-navy">Ready to kick off or discuss adjustments?</h3>
              <p className="text-xs sm:text-sm text-navy/70 mt-1">
                We review this specification line-by-line on our discovery call and tailor all milestones to your exact operational schedule.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-slate-50 shadow-xs transition"
              >
                <Printer size={14} /> Print / Save PDF
              </button>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-xs transition"
              >
                Book Discovery Call <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block pt-8 text-center text-[11px] text-slate-500 border-t border-slate-200 mt-8">
            <p className="font-semibold text-slate-700">The Digital Dude Ltd · Bespoke Web Applications, CRMs & Cloud Architecture</p>
            <p className="mt-1 font-mono text-[10px]">Specification Reference: {proposal.slug} · Generated on {new Date(proposal.created_at).toLocaleDateString()}</p>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm 15mm;
            size: A4 portrait;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #main {
            padding: 0 !important;
            margin: 0 !important;
          }
          nav, header, footer, button, .print-hidden, [role="dialog"], a[href="/contact"] {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .rounded-3xl {
            border-radius: 0 !important;
            border: none !important;
            padding: 0 !important;
          }
          .shadow-sm, .shadow-2xs, .shadow-xs, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
