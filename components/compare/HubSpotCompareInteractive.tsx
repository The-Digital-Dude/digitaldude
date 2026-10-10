"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, DollarSign, Calculator, Layers, Sparkles } from "lucide-react";

interface ChecklistItem {
  id: string;
  question: string;
  target: "hubspot" | "custom";
  description: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "pipeline",
    question: "Is your workflow recognizably a conventional sales pipeline (leads, deals, emails, sequences)?",
    target: "hubspot",
    description: "HubSpot's core objects are specifically engineered for standard lead-to-opportunity cycles.",
  },
  {
    id: "speed",
    question: "Do you need to launch and onboard your team within days rather than waiting 4–8 weeks?",
    target: "hubspot",
    description: "Packaged SaaS provides instant account provisioning and standard UI.",
  },
  {
    id: "marketing",
    question: "Do marketing and sales teams need to share one connected, out-of-the-box ecosystem?",
    target: "hubspot",
    description: "HubSpot's Marketing, Sales, and Content Hubs share unified tracking and contact activity out of the box.",
  },
  {
    id: "maintenance",
    question: "Does your organization prefer vendor-managed platform maintenance over software asset ownership?",
    target: "hubspot",
    description: "SaaS vendors manage infrastructure, security patches, compliance certifications, and framework upgrades.",
  },
  {
    id: "operations",
    question: "Does your CRM need to coordinate field technicians, compliance inspections, certificates, or dispatch?",
    target: "custom",
    description: "Operational workflows with non-standard roles and field requirements require custom data models and portals.",
  },
  {
    id: "portals",
    question: "Do external clients, contractors, or agencies need dedicated, branded self-service portals?",
    target: "custom",
    description: "A bespoke system can provide unlimited client logins without expensive per-portal seat tiers.",
  },
  {
    id: "data-model",
    question: "Is your proprietary workflow and relational data model central to your competitive advantage?",
    target: "custom",
    description: "Bespoke databases start with your exact operational entities (properties, routes, bookings, certificates).",
  },
  {
    id: "licensing",
    question: "Are seat-based or contact-tier price escalations becoming a punitive tax on your company's growth?",
    target: "custom",
    description: "Bespoke code on your cloud eliminates per-seat SaaS tax, shifting costs to stable hosting and maintenance.",
  },
];

export function HubSpotCompareInteractive() {
  const [selectedTab, setSelectedTab] = useState<"checklist" | "tco">("checklist");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hubspotScore = checklistItems
    .filter((i) => i.target === "hubspot" && checkedItems[i.id])
    .length;
  const customScore = checklistItems
    .filter((i) => i.target === "custom" && checkedItems[i.id])
    .length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple/10 px-3 py-1 text-xs font-bold text-purple">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Decision Tool
          </span>
          <h3 className="mt-2 text-xl font-bold text-navy">
            Evaluate Your Specific Build vs. Buy Tradeoffs
          </h3>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSelectedTab("checklist")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              selectedTab === "checklist"
                ? "bg-white text-navy shadow-xs"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            Decision Checklist
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("tco")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              selectedTab === "tco"
                ? "bg-white text-navy shadow-xs"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            3-Year TCO Comparison
          </button>
        </div>
      </div>

      {/* Tab 1: Decision Checklist */}
      {selectedTab === "checklist" && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Check the statements that reflect your organization&apos;s current operational reality to see an objective architecture recommendation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistItems.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isChecked
                      ? item.target === "hubspot"
                        ? "border-amber-300 bg-amber-50/50 shadow-xs"
                        : "border-emerald-300 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-purple focus:ring-purple cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-semibold text-navy leading-snug">
                        {item.question}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Recommendation Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Match Assessment:
                </div>
                <div className="mt-1 text-base font-bold text-navy">
                  {hubspotScore === 0 && customScore === 0 && "Select your operational constraints above"}
                  {hubspotScore > customScore && "Leaning HubSpot: Your process aligns with standard sales pipeline strengths"}
                  {customScore > hubspotScore && "Leaning Custom CRM: Operational workflows & data models justify an owned system"}
                  {hubspotScore > 0 && customScore > 0 && hubspotScore === customScore && "Hybrid Architecture Recommended: Keep HubSpot for sales/marketing & build a bespoke operational portal"}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Selected: {hubspotScore} HubSpot factors · {customScore} Custom CRM factors
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
              >
                Discuss Your Requirements
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 3-Year TCO Comparison */}
      {selectedTab === "tco" && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            *Illustrative comparisons based on public HubSpot pricing verified 10 October 2026. Excludes VAT/local taxes and currency conversion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example A */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Packaged Scenario A
                </div>
                <h4 className="mt-1 text-lg font-bold text-navy">HubSpot Sales Hub Pro</h4>
                <div className="mt-3 text-2xl font-extrabold text-navy">$66,300</div>
                <div className="text-[11px] text-slate-500">3-Year Projected Total (20 Seats)</div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Subscription:</span>
                    <span className="font-semibold text-navy">$64,800</span>
                  </div>
                  <div className="text-[11px] text-slate-400">20 seats × $90/mo × 36 mos</div>
                  <div className="flex justify-between pt-1">
                    <span>Required Onboarding:</span>
                    <span className="font-semibold text-navy">$1,500</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200/60">
                  <strong>Excluded Costs:</strong> Extra hubs (Marketing/Service), contact overages, consulting retainers, and internal admin hours.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 text-center">
                Best for standard B2B sales teams
              </div>
            </div>

            {/* Example B */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Packaged Scenario B
                </div>
                <h4 className="mt-1 text-lg font-bold text-navy">HubSpot Enterprise</h4>
                <div className="mt-3 text-2xl font-extrabold text-navy">$111,500</div>
                <div className="text-[11px] text-slate-500">3-Year Projected Total (20 Seats)</div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Subscription:</span>
                    <span className="font-semibold text-navy">$108,000</span>
                  </div>
                  <div className="text-[11px] text-slate-400">20 seats × $150/mo × 36 mos</div>
                  <div className="flex justify-between pt-1">
                    <span>Required Onboarding:</span>
                    <span className="font-semibold text-navy">$3,500</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200/60">
                  <strong>Excluded Costs:</strong> Custom object add-ons past limits, advanced API rate-limit tiers, multi-brand portals, and contract renewals.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 text-center">
                Best when enterprise governance is vital
              </div>
            </div>

            {/* Custom CRM Scenario */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Bespoke Asset Model
                </div>
                <h4 className="mt-1 text-lg font-bold text-navy">Custom CRM Architecture</h4>
                <div className="mt-3 text-2xl font-extrabold text-navy">Scoped Proposal</div>
                <div className="text-[11px] text-emerald-800 font-semibold">100% Owned Code & Database</div>

                <div className="mt-4 space-y-2 border-t border-emerald-100 pt-3 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Initial Fixed Build:</span>
                    <span className="font-semibold text-navy">Typically £6k–£18k</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per-Seat License Fees:</span>
                    <span className="font-semibold text-emerald-700">£0 forever</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cloud Hosting (Supabase/Vercel):</span>
                    <span className="font-semibold text-navy">£50–£150/mo</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-3 text-[11px] text-slate-600 border border-slate-200">
                  <strong>Ongoing Owner Responsibilities:</strong> Bug fixes, security audits, third-party messaging costs (Twilio/WhatsApp), and feature additions over 3 years.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-100 text-xs font-bold text-emerald-800 text-center">
                Best when workflow is your competitive moat
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
