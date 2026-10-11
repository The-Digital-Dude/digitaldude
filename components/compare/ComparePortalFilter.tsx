"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PseoComparison } from "@/lib/pseo/types";
import { 
  Search, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  Calculator,
  RotateCcw
} from "lucide-react";

interface ComparePortalFilterProps {
  comparisons: PseoComparison[];
}

export function ComparePortalFilter({ comparisons }: ComparePortalFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(comparisons.map((c) => c.category)));
    return ["all", ...cats];
  }, [comparisons]);

  const categoryLabels: Record<string, string> = {
    all: "All Platforms",
    CRM: "Sales & Operational CRMs",
    ERP: "ERP & Multi-Depot Operations",
    Marketplace: "On-Demand Marketplaces",
    "No-Code": "No-Code & Low-Code Engines",
  };

  const filteredComparisons = useMemo(() => {
    return comparisons.filter((comp) => {
      const matchesCategory =
        selectedCategory === "all" || comp.category.toLowerCase() === selectedCategory.toLowerCase();
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        comp.competitorName.toLowerCase().includes(query) ||
        comp.summary.toLowerCase().includes(query) ||
        comp.category.toLowerCase().includes(query) ||
        comp.targetNiche.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [comparisons, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Search and Category Control Bar */}
      <div className="rounded-3xl bg-white p-5 md:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SaaS vendor, niche, or platform..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs md:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5 text-purple" />
            <span>Showing {filteredComparisons.length} of {comparisons.length} Architectural Guides</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {categories.map((cat) => {
            const count =
              cat === "all"
                ? comparisons.length
                : comparisons.filter((c) => c.category.toLowerCase() === cat.toLowerCase()).length;
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-purple text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy"
                }`}
              >
                <span>{categoryLabels[cat] || cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flagship Comparison Highlights (When viewing All or CRM) */}
      {(selectedCategory === "all" || selectedCategory === "CRM") && !searchQuery && (
        <div className="rounded-3xl bg-gradient-to-br from-navy via-navy to-slate-900 text-white p-7 md:p-10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-200 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              Flagship Decision Guide
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Custom CRM vs HubSpot: Full 3-Year TCO Analysis
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Discover when HubSpot Sales Hub is the smarter launchpad and when operational workflows, unusual entities, or escalating seat tiers warrant engineering a custom asset with full source-code ownership.
            </p>
            
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/compare/custom-crm-vs-hubspot"
                className="inline-flex items-center gap-2 rounded-full bg-purple px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 transition shadow-sm"
              >
                <span>Read Verified Decision Guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/compare/custom-crm-vs-hubspot#decision-checklist"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/20 transition"
              >
                <Calculator className="h-3.5 w-3.5 text-purple-200" />
                <span>Interactive Fit Checklist</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Filtered Comparisons */}
      {filteredComparisons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComparisons.map((comp) => {
            const isHubSpot = comp.slug === "custom-crm-vs-hubspot";
            const targetUrl = isHubSpot ? "/compare/custom-crm-vs-hubspot" : `/compare/${comp.slug}`;
            const tcoSimulatorUrl = isHubSpot
              ? "/compare/custom-crm-vs-hubspot#decision-checklist"
              : `/compare/${comp.slug}#tco-simulator`;

            return (
              <div
                key={comp.slug}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 md:p-7 border border-slate-200/90 shadow-xs hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {comp.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Bespoke Alternative
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-navy mt-3 group-hover:text-purple transition">
                    Custom vs {comp.competitorName}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {comp.summary}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-semibold truncate">Typical SaaS: {comp.typicalMonthlyExpense}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-semibold">Bespoke: £0 / user seat fees</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={tcoSimulatorUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple hover:underline"
                  >
                    <span>Live Simulator</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <Link
                    href={targetUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:text-accent-primary/80 transition"
                  >
                    <span>Comparison Matrix</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-navy">No matching comparison guides found</h3>
          <p className="text-xs text-slate-500">
            We couldn&apos;t find an existing comparison matching &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple/10 px-4 py-2 text-xs font-bold text-purple hover:bg-purple/20 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Search &amp; Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
