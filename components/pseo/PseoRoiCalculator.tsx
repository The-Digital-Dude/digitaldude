"use client";

import { useState } from "react";
import { Calculator, ArrowRight, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

interface PseoRoiCalculatorProps {
  serviceName: string;
  currencySymbol?: string;
  defaultMonthlySaaS?: number;
}

export function PseoRoiCalculator({
  serviceName,
  currencySymbol = "£",
  defaultMonthlySaaS = 150,
}: PseoRoiCalculatorProps) {
  const [teamSize, setTeamSize] = useState<number>(25);
  const [monthlySaaSCostPerSeat, setMonthlySaaSCostPerSeat] = useState<number>(defaultMonthlySaaS);
  const [estimatedBuildCost] = useState<number>(28000);

  // Math
  const monthlyOffTheShelfTotal = teamSize * monthlySaaSCostPerSeat;
  const annualOffTheShelfTotal = monthlyOffTheShelfTotal * 12;
  const threeYearOffTheShelfTotal = annualOffTheShelfTotal * 3;

  const annualCustomHosting = 1200; // Cloud serverless & maintenance
  const threeYearCustomTotal = estimatedBuildCost + annualCustomHosting * 3;

  const threeYearSavings = Math.max(0, threeYearOffTheShelfTotal - threeYearCustomTotal);
  const breakEvenMonths = Math.max(
    1,
    Math.round(estimatedBuildCost / Math.max(1, monthlyOffTheShelfTotal - annualCustomHosting / 12))
  );

  return (
    <div className="my-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy">
              Interactive ROI & Build vs. Buy Calculator
            </h3>
            <p className="text-sm text-slate-500">
              Estimate your 3-year cost savings of bespoke {serviceName} vs. recurring per-seat SaaS
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" />
          Zero Per-Seat License Model
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Input Sliders */}
        <div className="space-y-6 lg:col-span-6">
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <label htmlFor="team-size">Active Team / User Seats:</label>
              <span className="font-bold text-navy bg-slate-100 px-3 py-1 rounded-md">
                {teamSize} users
              </span>
            </div>
            <input
              id="team-size"
              type="range"
              min="5"
              max="200"
              step="5"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="mt-3 w-full accent-accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5 seats</span>
              <span>100 seats</span>
              <span>200+ seats</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <label htmlFor="saas-cost">Estimated Monthly SaaS Cost per User:</label>
              <span className="font-bold text-navy bg-slate-100 px-3 py-1 rounded-md">
                {currencySymbol}{monthlySaaSCostPerSeat} / user / mo
              </span>
            </div>
            <input
              id="saas-cost"
              type="range"
              min="50"
              max="400"
              step="25"
              value={monthlySaaSCostPerSeat}
              onChange={(e) => setMonthlySaaSCostPerSeat(Number(e.target.value))}
              className="mt-3 w-full accent-accent-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{currencySymbol}50 (Starter)</span>
              <span>{currencySymbol}200 (Mid-Tier)</span>
              <span>{currencySymbol}400+ (Enterprise)</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 space-y-2 border border-slate-100">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              What this includes:
            </div>
            <p>
              • 100% IP code & database ownership on your own cloud infrastructure.
            </p>
            <p>
              • Unlimited client portals & field contractor logins without added license tiers.
            </p>
          </div>
        </div>

        {/* Right: Projected Comparison Box */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-navy to-slate-900 p-6 text-white shadow-md lg:col-span-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
              Projected 3-Year Comparison
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs text-slate-400">Off-the-Shelf SaaS (3 Yrs)</div>
                <div className="text-lg font-bold text-red-300 mt-1 line-through">
                  {currencySymbol}{threeYearOffTheShelfTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  ({currencySymbol}{annualOffTheShelfTotal.toLocaleString()}/yr recurring)
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Bespoke System (3 Yrs)</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {currencySymbol}{threeYearCustomTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">(Fixed Build + Hosting)</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs text-slate-300 font-medium">Estimated 3-Year Cash Saved:</div>
              <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
                <span className="text-emerald-400">
                  {currencySymbol}{threeYearSavings.toLocaleString()}
                </span>
                <span className="text-xs font-normal text-slate-300">
                  (~{breakEvenMonths} mo break-even)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-300">Ready to review a tailored proposal?</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-primary/90"
            >
              Book Discovery Call
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
