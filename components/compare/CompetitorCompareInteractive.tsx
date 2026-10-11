"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  DollarSign,
  Calculator,
  Layers,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Building2,
  Calendar,
  Zap,
} from "lucide-react";
import {
  ComparisonCalculatorConfig,
  ComparisonChecklistItem,
  ComparisonTier,
} from "@/lib/pseo/types";

interface CompetitorCompareInteractiveProps {
  competitorName: string;
  slug: string;
  config?: ComparisonCalculatorConfig;
  checklistItems?: ComparisonChecklistItem[];
  className?: string;
}

export function CompetitorCompareInteractive({
  competitorName,
  slug,
  config,
  checklistItems = [],
  className = "",
}: CompetitorCompareInteractiveProps) {
  const [selectedTab, setSelectedTab] = useState<"tco" | "checklist">("tco");

  // Fallback defaults if config is missing
  const currency = config?.currencySymbol || "$";
  const isGmvMode = config?.mode === "gmv";

  // State: Seat mode
  const [seats, setSeats] = useState<number>(config?.defaultSeats || 20);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [timelineYears, setTimelineYears] = useState<number>(3); // 3 or 5 years

  // State: GMV mode
  const [annualGmv, setAnnualGmv] = useState<number>(config?.defaultGmv || 1000000);

  // State: Checklist
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedTier: ComparisonTier | undefined =
    config?.tiers && config.tiers.length > 0
      ? config.tiers[selectedTierIndex] || config.tiers[0]
      : undefined;

  // Calculation logic
  const calculations = useMemo(() => {
    const months = timelineYears * 12;

    if (isGmvMode) {
      const takeRate = config?.competitorTakeRatePercent || 1.5;
      const baseMonthly = config?.competitorMonthlyBasePlan || 399;

      const competitorTakeRateCut = (annualGmv * (takeRate / 100)) * timelineYears;
      const competitorBaseSub = baseMonthly * months;
      const totalCompetitor = competitorTakeRateCut + competitorBaseSub;

      const bespokeBuild = config?.bespokeBuildCost || 28000;
      const bespokeHosting = (config?.bespokeMonthlyHosting || 100) * months;
      const bespokeMaintenance = (config?.bespokeAnnualMaintenance || 1000) * timelineYears;
      const totalBespoke = bespokeBuild + bespokeHosting + bespokeMaintenance;

      const netSavings = Math.max(0, totalCompetitor - totalBespoke);
      const percentSaved = totalCompetitor > 0 ? Math.round((netSavings / totalCompetitor) * 100) : 0;

      const monthlyCompetitorCost = (annualGmv * (takeRate / 100) / 12) + baseMonthly;
      const monthlyBespokeCost = (config?.bespokeMonthlyHosting || 100) + ((config?.bespokeAnnualMaintenance || 1000) / 12);
      const monthlyNetSave = Math.max(1, monthlyCompetitorCost - monthlyBespokeCost);
      const breakEvenMonth = Math.max(1, Math.ceil(bespokeBuild / monthlyNetSave));

      const trajectory = [6, 12, 24, 36, 60].map((m) => {
        const comp = (annualGmv * (takeRate / 100) * (m / 12)) + (baseMonthly * m);
        const besp = bespokeBuild + ((config?.bespokeMonthlyHosting || 100) * m) + ((config?.bespokeAnnualMaintenance || 1000) * (m / 12));
        return {
          months: m,
          label: m < 12 ? `${m} Mos` : `${m / 12} Yr${m === 12 ? '' : 's'}`,
          competitor: Math.round(comp),
          bespoke: Math.round(besp),
          savings: Math.round(comp - besp),
        };
      });

      return {
        totalCompetitor,
        competitorBreakdown: [
          { label: `${takeRate}% Platform Take-Rate Cut`, amount: competitorTakeRateCut },
          { label: `Base Subscription (${currency}${baseMonthly}/mo)`, amount: competitorBaseSub },
        ],
        totalBespoke,
        bespokeBreakdown: [
          { label: "Fixed Milestone Build Proposal", amount: bespokeBuild },
          { label: `Predictable Cloud Hosting (${timelineYears} yrs)`, amount: bespokeHosting },
          { label: `Framework & Security Buffer (${timelineYears} yrs)`, amount: bespokeMaintenance },
        ],
        netSavings,
        percentSaved,
        breakEvenMonth,
        monthlyNetSave,
        trajectory,
      };
    } else {
      // Seat Mode
      const monthlyPerSeat = selectedTier?.monthlyPerSeat || 120;
      const competitorBaseMonthly = (config?.competitorBaseMonthly || 0) * months;
      const competitorSeatSub = seats * monthlyPerSeat * months;
      const competitorOnboarding = config?.competitorOnboardingFee || 0;
      const competitorSupport = (config?.competitorSupportAnnual || 0) * timelineYears;
      const totalCompetitor =
        competitorSeatSub + competitorBaseMonthly + competitorOnboarding + competitorSupport;

      const bespokeBuild = config?.bespokeBuildCost || 25000;
      const bespokeHosting = (config?.bespokeMonthlyHosting || 100) * months;
      const bespokeMaintenance = (config?.bespokeAnnualMaintenance || 1000) * timelineYears;
      const totalBespoke = bespokeBuild + bespokeHosting + bespokeMaintenance;

      const netSavings = Math.max(0, totalCompetitor - totalBespoke);
      const percentSaved = totalCompetitor > 0 ? Math.round((netSavings / totalCompetitor) * 100) : 0;

      const monthlyCompetitorCost = (seats * monthlyPerSeat) + (config?.competitorBaseMonthly || 0) + ((config?.competitorSupportAnnual || 0) / 12);
      const monthlyBespokeCost = (config?.bespokeMonthlyHosting || 100) + ((config?.bespokeAnnualMaintenance || 1000) / 12);
      const monthlyNetSave = Math.max(1, monthlyCompetitorCost - monthlyBespokeCost);
      const upfrontDiff = Math.max(1, bespokeBuild - competitorOnboarding);
      const breakEvenMonth = Math.max(1, Math.ceil(upfrontDiff / monthlyNetSave));

      const trajectory = [6, 12, 24, 36, 60].map((m) => {
        const comp = (seats * monthlyPerSeat * m) + ((config?.competitorBaseMonthly || 0) * m) + competitorOnboarding + ((config?.competitorSupportAnnual || 0) * (m / 12));
        const besp = bespokeBuild + ((config?.bespokeMonthlyHosting || 100) * m) + ((config?.bespokeAnnualMaintenance || 1000) * (m / 12));
        return {
          months: m,
          label: m < 12 ? `${m} Mos` : `${m / 12} Yr${m === 12 ? '' : 's'}`,
          competitor: Math.round(comp),
          bespoke: Math.round(besp),
          savings: Math.round(comp - besp),
        };
      });

      return {
        totalCompetitor,
        competitorBreakdown: [
          {
            label: `${seats} Seats × ${currency}${monthlyPerSeat}/mo (${months} mos)`,
            amount: competitorSeatSub,
          },
          ...(competitorBaseMonthly > 0
            ? [{ label: `Base Platform License (${currency}${config?.competitorBaseMonthly}/mo)`, amount: competitorBaseMonthly }]
            : []),
          ...(competitorOnboarding > 0
            ? [{ label: "Mandatory Vendor Onboarding / Setup", amount: competitorOnboarding }]
            : []),
          ...(competitorSupport > 0
            ? [{ label: `Mandatory Enterprise Support (${timelineYears} yrs)`, amount: competitorSupport }]
            : []),
        ],
        totalBespoke,
        bespokeBreakdown: [
          { label: "Fixed Milestone Build (100% Owned)", amount: bespokeBuild },
          { label: `Dedicated Cloud Hosting (${timelineYears} yrs)`, amount: bespokeHosting },
          { label: `Maintenance & Patch Buffer (${timelineYears} yrs)`, amount: bespokeMaintenance },
        ],
        netSavings,
        percentSaved,
        breakEvenMonth,
        monthlyNetSave,
        trajectory,
      };
    }
  }, [isGmvMode, annualGmv, seats, selectedTier, timelineYears, config, currency]);

  // Checklist counts
  const competitorChecked = checklistItems.filter(
    (i) => i.target === "competitor" && checkedItems[i.id]
  ).length;
  const bespokeChecked = checklistItems.filter(
    (i) => i.target === "bespoke" && checkedItems[i.id]
  ).length;

  const totalAnswered = competitorChecked + bespokeChecked;
  const bespokeScore = totalAnswered > 0 ? Math.round((bespokeChecked / totalAnswered) * 100) : 50;
  const competitorScore = 100 - bespokeScore;

  const contactUrl = `/contact?ref=${encodeURIComponent(slug)}&competitor=${encodeURIComponent(
    competitorName
  )}&timeline=${timelineYears}&savings=${Math.round(calculations.netSavings)}&breakEven=${calculations.breakEvenMonth}&source=tco-simulator${
    isGmvMode ? `&gmv=${annualGmv}` : `&seats=${seats}`
  }`;

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm ${className}`}
      id="tco-simulator"
    >
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple/10 px-3 py-1 text-xs font-bold text-purple">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Decision Tool
          </span>
          <h3 className="mt-2 text-xl md:text-2xl font-extrabold text-navy tracking-tight">
            Compare True Total Cost of Ownership (TCO) vs. {competitorName}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 3-year and 5-year capital outlay, licensing penalties, and long-term asset ownership.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSelectedTab("tco")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              selectedTab === "tco"
                ? "bg-white text-navy shadow-xs"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            TCO Simulator
          </button>
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
        </div>
      </div>

      {/* TAB 1: TCO Simulator */}
      {selectedTab === "tco" && (
        <div className="mt-6 space-y-8">
          {/* Controls Bar */}
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Select Timeframe &amp; Scope
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimelineYears(3)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    timelineYears === 3
                      ? "bg-purple text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  3-Year Projection
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineYears(5)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    timelineYears === 5
                      ? "bg-purple text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  5-Year Projection
                </button>
              </div>
            </div>

            {/* Mode-specific Controls */}
            {isGmvMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-navy">
                  <span>Annual Marketplace Gross Merchandise Value (GMV):</span>
                  <span className="text-base text-purple font-extrabold font-mono">
                    {currency}
                    {annualGmv.toLocaleString()} / year
                  </span>
                </div>
                <input
                  type="range"
                  min={config?.minGmv || 100000}
                  max={config?.maxGmv || 5000000}
                  step={50000}
                  value={annualGmv}
                  onChange={(e) => setAnnualGmv(Number(e.target.value))}
                  className="w-full accent-purple cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{currency}100k/yr</span>
                  <span>{currency}1M/yr</span>
                  <span>{currency}2.5M/yr</span>
                  <span>{currency}5M/yr</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Seat Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-navy">
                    <span>Number of Full-Access Internal User Seats:</span>
                    <span className="text-base text-purple font-extrabold font-mono">
                      {seats} Team Seats
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config?.minSeats || 5}
                    max={config?.maxSeats || 100}
                    step={1}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full accent-purple cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>{config?.minSeats || 5} seats</span>
                    <span>25 seats</span>
                    <span>50 seats</span>
                    <span>{config?.maxSeats || 100}+ seats</span>
                  </div>
                </div>

                {/* Tier Selector */}
                {config?.tiers && config.tiers.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Competitor Product Edition / Tier:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.tiers.map((tier, idx) => (
                        <div
                          key={tier.name}
                          onClick={() => setSelectedTierIndex(idx)}
                          className={`cursor-pointer rounded-xl border p-3 transition ${
                            selectedTierIndex === idx
                              ? "border-purple bg-purple/5 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-navy">{tier.name}</span>
                            <span className="text-xs font-mono font-bold text-purple">
                              {currency}
                              {tier.monthlyPerSeat}/seat/mo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{tier.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Break-Even Month Highlight Banner */}
          <div className="rounded-2xl border border-purple/20 bg-gradient-to-r from-purple/5 via-lavender/40 to-indigo-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple text-white shadow-xs shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple">
                    Break-Even Milestone
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                    100% Capital Payback
                  </span>
                </div>
                <h5 className="text-base sm:text-lg font-extrabold text-navy mt-0.5">
                  Month {calculations.breakEvenMonth}: Bespoke Software Breaks Even vs. {competitorName}
                </h5>
                <p className="text-xs text-navy/70 mt-0.5">
                  After Month {calculations.breakEvenMonth}, your team stops paying recurring per-seat subscriptions and retains 100% operational margin.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-purple/20 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Monthly Net Savings:</span>
              <span className="text-sm font-extrabold font-mono text-emerald-600">
                +{currency}{Math.round(calculations.monthlyNetSave).toLocaleString()}/mo
              </span>
            </div>
          </div>

          {/* Results Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competitor Card */}
            <div className="rounded-2xl border border-red-200 bg-red-50/20 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                    {competitorName} (Rented SaaS)
                  </span>
                  <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full">
                    {timelineYears}-Year Projected Outlay
                  </span>
                </div>

                <div className="mt-4 text-3xl font-extrabold text-red-600 font-mono">
                  {currency}
                  {Math.round(calculations.totalCompetitor).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Recurring subscription overhead without code or database equity
                </p>

                <div className="mt-5 space-y-2 border-t border-red-100 pt-4 text-xs">
                  {calculations.competitorBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{item.label}:</span>
                      <span className="font-semibold font-mono text-navy">
                        {currency}
                        {Math.round(item.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-red-100 text-[11px] text-slate-500 italic">
                *Excludes: Custom object overage packs, portal add-ons, consultant retainers, and contractual price indexation.
              </div>
            </div>

            {/* Bespoke Card */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/20 p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                100% Owned Asset
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Bespoke System (Digital Dude)
                  </span>
                </div>

                <div className="mt-4 text-3xl font-extrabold text-emerald-700 font-mono">
                  {currency}
                  {Math.round(calculations.totalBespoke).toLocaleString()}
                </div>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  Fixed milestone build with £0 / user seat licenses forever
                </p>

                <div className="mt-5 space-y-2 border-t border-emerald-200/60 pt-4 text-xs">
                  {calculations.bespokeBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{item.label}:</span>
                      <span className="font-semibold font-mono text-emerald-900">
                        {currency}
                        {Math.round(item.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200/60 text-[11px] text-emerald-900 font-medium">
                ✓ Full IP code ownership, unlimited user logins, and client portal access included in scope.
              </div>
            </div>
          </div>

          {/* Visual Cost Trajectory Progression Table */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Cumulative Cost Trajectory Over Time
              </span>
              <span className="text-[11px] text-slate-400">
                {isGmvMode ? `${currency}${annualGmv.toLocaleString()}/yr GMV` : `${seats} Active Seats`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {calculations.trajectory.map((point) => {
                const isBespokeCheaper = point.savings > 0;
                return (
                  <div key={point.months} className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">{point.label}</div>
                    <div className="text-xs text-red-600 font-mono font-semibold flex justify-between">
                      <span className="text-[10px] text-slate-400">SaaS:</span>
                      <span>{currency}{point.competitor.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-mono font-semibold flex justify-between">
                      <span className="text-[10px] text-slate-400">Bespoke:</span>
                      <span>{currency}{point.bespoke.toLocaleString()}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 text-[11px] font-bold text-navy flex justify-between">
                      <span className="text-[10px] text-slate-400">Delta:</span>
                      <span className={isBespokeCheaper ? "text-emerald-600" : "text-amber-600"}>
                        {isBespokeCheaper ? `-${currency}${point.savings.toLocaleString()}` : `+${currency}${Math.abs(point.savings).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Net Savings Callout & Conversion Bar */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400 mb-2">
                <TrendingDown className="h-3.5 w-3.5" />
                Net Projected Financial Impact
              </div>
              <h4 className="text-2xl font-extrabold text-white">
                Save ~{currency}
                {Math.round(calculations.netSavings).toLocaleString()} over {timelineYears} Years ({calculations.percentSaved}% Reduction)
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Free your budget from recurring per-seat taxes. Build a purpose-mapped system that your team owns completely on your company balance sheet.
              </p>
            </div>

            <Link
              href={contactUrl}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple px-6 py-3.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition cursor-pointer"
            >
              <span>Book Strategy Call with this Scope</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: Decision Checklist */}
      {selectedTab === "checklist" && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Check the statements that reflect your company&apos;s operational realities to calculate an objective architecture recommendation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistItems.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isChecked
                      ? item.target === "competitor"
                        ? "border-amber-300 bg-amber-50/50 shadow-xs"
                        : "border-emerald-300 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div click
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-purple focus:ring-purple cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-navy leading-snug">
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

          {/* Dynamic Scorecard & Recommendation Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Decision Scorecard
                </div>
                <h5 className="text-base font-extrabold text-navy mt-0.5">
                  {totalAnswered === 0
                    ? "Check requirements above to generate live architecture fit"
                    : bespokeScore > competitorScore
                    ? `${bespokeScore}% Match for Bespoke Custom Architecture`
                    : competitorScore > bespokeScore
                    ? `${competitorScore}% Match for Packaged ${competitorName}`
                    : `50/50 Hybrid Fit: Both Options Address Valid Constraints`}
                </h5>
              </div>

              {totalAnswered > 0 && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
                    Bespoke: {bespokeScore}%
                  </span>
                  <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1">
                    {competitorName}: {competitorScore}%
                  </span>
                </div>
              )}
            </div>

            {/* Visual Score Meter Bar */}
            {totalAnswered > 0 && (
              <div className="h-3.5 w-full bg-amber-200 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-500 rounded-l-full"
                  style={{ width: `${bespokeScore}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-500 rounded-r-full"
                  style={{ width: `${competitorScore}%` }}
                />
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {totalAnswered === 0 && "Select criteria that reflect your team's workflow constraints to see score weighting."}
                {bespokeScore > competitorScore && "Your operational workflows, client portal needs, and licensing constraints make bespoke software the highest-ROI corporate investment."}
                {competitorScore > bespokeScore && `${competitorName} provides standard off-the-shelf velocity if your workflow fits standard pipelines and launch speed is the #1 priority.`}
                {totalAnswered > 0 && bespokeScore === competitorScore && `A hybrid approach often works best: utilize ${competitorName} for outbound pipeline, and engineer a custom operational portal for fulfillment.`}
              </p>

              <Link
                href={contactUrl}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-110 transition"
              >
                Discuss Scored Architecture
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitorCompareInteractive;
