"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  Flame,
  Target,
  BarChart3,
  CheckCircle2,
  Zap,
  Info,
  Layers,
} from "lucide-react";

export interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

export interface SourcedBooking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  slot_start: string;
  status: string;
  stage?: string;
  deal_value?: number;
  meeting_bonus_payout_status?: string;
  deal_commission_payout_status?: string;
  payout_notes?: string;
  created_at: string;
}

export interface RepProfile {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  employment_type: string;
  currency: string;
  referral_code?: string;
  assigned_outreach_email?: string;
  outreach_display_name?: string;
  meeting_bonus_min: number | null;
  meeting_bonus_max: number | null;
  deal_commission_percent_min: number | null;
  deal_commission_percent_max: number | null;
  status: string;
  onboarding_completed?: boolean;
  onboarding_checklist: ChecklistItem[];
  payout_details?: Record<string, string>;
  daily_outreach_limit?: number;
}

export interface CommissionSummary {
  currency: string;
  totalBookingsCount: number;
  qualifiedMeetings: number;
  meetingBonusRangeTotal: [number, number];
  meetingBonusPaidCount: number;
  wonDealsCount: number;
  wonDealValue: number;
  dealCommissionRangeTotal: [number, number];
  dealCommissionPaidCount: number;
  outreachSentCount: number;
}

export interface OutreachLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  company_name: string | null;
  subject: string;
  body_content: string;
  template_used: string | null;
  sent_at: string;
}

export interface RepLead {
  id: string;
  employee_id?: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title?: string | null;
  lead_source?: string;
  stage: string;
  estimated_deal_value?: number;
  deal_value?: number;
  currency?: string;
  notes?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
}

interface RepAnalyticsOverviewProps {
  profile: RepProfile | null;
  commissionSummary: CommissionSummary | null;
  bookings: SourcedBooking[];
  outreachLogs: OutreachLog[];
  leads?: RepLead[];
  currencySymbol: string;
  setActiveTab: (tab: "overview" | "leads" | "campaigns" | "outreach" | "onboarding" | "payouts") => void;
}

type TimeHorizon = "today" | "7d" | "30d" | "quarter" | "all";

export const RepAnalyticsOverview: React.FC<RepAnalyticsOverviewProps> = ({
  profile,
  commissionSummary,
  bookings,
  outreachLogs,
  currencySymbol,
  setActiveTab,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("30d");
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    calls: number;
    volume: number;
    x: number;
    y: number;
  } | null>(null);

  const bonusMin = Number(profile?.meeting_bonus_min) || 0;
  const bonusMax = Number(profile?.meeting_bonus_max) || bonusMin || 0;
  const commPctMin = Number(profile?.deal_commission_percent_min) || 0;
  const commPctMax = Number(profile?.deal_commission_percent_max) || commPctMin || 0;

  // 1. Time Horizon Filtered Calculations
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;

    if (timeHorizon === "today") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeHorizon === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeHorizon === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeHorizon === "quarter") {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const filteredBookings = cutoff
      ? bookings.filter((b) => new Date(b.created_at || b.slot_start) >= cutoff!)
      : bookings;

    const filteredOutreach = cutoff
      ? outreachLogs.filter((o) => new Date(o.sent_at) >= cutoff!)
      : outreachLogs;

    const totalBookingsCount = filteredBookings.length;
    const qualifiedMeetings = filteredBookings.filter((b) => b.stage !== "closed_lost").length;
    const wonBookings = filteredBookings.filter((b) => b.stage === "closed_won");
    const wonDealsCount = wonBookings.length;
    const wonDealValue = wonBookings.reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

    const meetingBonusMinTotal = qualifiedMeetings * bonusMin;
    const meetingBonusMaxTotal = qualifiedMeetings * bonusMax;
    const dealCommMinTotal = wonDealValue * (commPctMin / 100);
    const dealCommMaxTotal = wonDealValue * (commPctMax / 100);

    const outreachSentCount = filteredOutreach.length;

    return {
      totalBookingsCount,
      qualifiedMeetings,
      wonDealsCount,
      wonDealValue,
      meetingBonusRange: [meetingBonusMinTotal, meetingBonusMaxTotal] as [number, number],
      dealCommRange: [dealCommMinTotal, dealCommMaxTotal] as [number, number],
      outreachSentCount,
      filteredBookings,
    };
  }, [timeHorizon, bookings, outreachLogs, bonusMin, bonusMax, commPctMin, commPctMax]);

  // 2. Daily Outreach Streak Computation
  const streakDays = useMemo(() => {
    if (outreachLogs.length === 0) return 0;
    const datesWithActivity = new Set(
      outreachLogs.map((l) => new Date(l.sent_at).toISOString().split("T")[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (datesWithActivity.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [outreachLogs]);

  // 3. Tier Progress Calculation
  const tierInfo = useMemo(() => {
    const totalWon = bookings.filter((b) => b.stage === "closed_won").length;
    const lifetimeVolume = bookings
      .filter((b) => b.stage === "closed_won")
      .reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

    if (totalWon >= 16 || lifetimeVolume >= 75000) {
      return {
        currentTier: "President's Club",
        badgeColor: "from-amber-400 to-yellow-500",
        icon: "💎",
        nextTier: "Top Rank Achieved",
        progressPct: 100,
        remainingDeals: 0,
        targetDeals: 16,
      };
    } else if (totalWon >= 9 || lifetimeVolume >= 30000) {
      const progress = Math.min(100, Math.round(((totalWon - 9) / 7) * 100));
      return {
        currentTier: "Top Producer",
        badgeColor: "from-purple-400 to-indigo-500",
        icon: "🥇",
        nextTier: "President's Club",
        progressPct: progress || 10,
        remainingDeals: 16 - totalWon,
        targetDeals: 16,
      };
    } else if (totalWon >= 4 || lifetimeVolume >= 10000) {
      const progress = Math.min(100, Math.round(((totalWon - 4) / 5) * 100));
      return {
        currentTier: "Consistent Closer",
        badgeColor: "from-cyan-400 to-blue-500",
        icon: "🥈",
        nextTier: "Top Producer",
        progressPct: progress || 15,
        remainingDeals: 9 - totalWon,
        targetDeals: 9,
      };
    } else {
      const progress = Math.min(100, Math.round((totalWon / 4) * 100));
      return {
        currentTier: "Rising Rep",
        badgeColor: "from-emerald-400 to-teal-500",
        icon: "🥉",
        nextTier: "Consistent Closer",
        progressPct: progress || 5,
        remainingDeals: 4 - totalWon,
        targetDeals: 4,
      };
    }
  }, [bookings]);

  // 4. Trend Chart Data Bucketing (Last 6 chronological intervals)
  const chartData = useMemo(() => {
    const buckets: { label: string; calls: number; volume: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      const end = new Date(now);

      if (timeHorizon === "today" || timeHorizon === "7d") {
        start.setDate(now.getDate() - i);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - i);
        end.setHours(23, 59, 59, 999);
        const label = start.toLocaleDateString("en-US", { weekday: "short" });

        const calls = bookings.filter((b) => {
          const d = new Date(b.slot_start || b.created_at);
          return d >= start && d <= end;
        }).length;

        const volume = bookings
          .filter((b) => {
            const d = new Date(b.slot_start || b.created_at);
            return d >= start && d <= end && b.stage === "closed_won";
          })
          .reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

        buckets.push({ label, calls, volume });
      } else {
        const daysPerBucket = timeHorizon === "quarter" || timeHorizon === "all" ? 15 : 5;
        start.setDate(now.getDate() - (i + 1) * daysPerBucket);
        end.setDate(now.getDate() - i * daysPerBucket);
        const label = `${start.getDate()} ${start.toLocaleDateString("en-US", { month: "short" })}`;

        const calls = bookings.filter((b) => {
          const d = new Date(b.slot_start || b.created_at);
          return d >= start && d <= end;
        }).length;

        const volume = bookings
          .filter((b) => {
            const d = new Date(b.slot_start || b.created_at);
            return d >= start && d <= end && b.stage === "closed_won";
          })
          .reduce((sum, b) => sum + (Number(b.deal_value) || 0), 0);

        buckets.push({ label, calls, volume });
      }
    }
    return buckets;
  }, [bookings, timeHorizon]);

  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const maxVolume = Math.max(...chartData.map((d) => d.volume), 1000);
  const maxCalls = Math.max(...chartData.map((d) => d.calls), 5);

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / (chartData.length - 1)) * (chartWidth - paddingX * 2);
    const yVol = chartHeight - paddingY - (d.volume / maxVolume) * (chartHeight - paddingY * 2);
    const barHeight = (d.calls / maxCalls) * (chartHeight - paddingY * 2);
    return { ...d, x, yVol, barHeight };
  });

  const areaPath = `M ${points[0].x} ${chartHeight - paddingY} ` +
    points.map((p) => `L ${p.x} ${p.yVol}`).join(" ") +
    ` L ${points[points.length - 1].x} ${chartHeight - paddingY} Z`;

  const linePath = `M ${points[0].x} ${points[0].yVol} ` +
    points.slice(1).map((p) => `L ${p.x} ${p.yVol}`).join(" ");

  // 5. Conversion Funnel Calculations
  const funnelStages = useMemo(() => {
    const totalOutreach = Math.max(filteredData.outreachSentCount, filteredData.totalBookingsCount);
    const totalCalls = filteredData.totalBookingsCount;
    const qualifiedCalls = filteredData.qualifiedMeetings;
    const closedWon = filteredData.wonDealsCount;

    const callConv = totalOutreach > 0 ? ((totalCalls / totalOutreach) * 100).toFixed(1) : "0.0";
    const qualConv = totalCalls > 0 ? ((qualifiedCalls / totalCalls) * 100).toFixed(1) : "0.0";
    const wonConv = qualifiedCalls > 0 ? ((closedWon / qualifiedCalls) * 100).toFixed(1) : "0.0";
    const overallConv = totalOutreach > 0 ? ((closedWon / totalOutreach) * 100).toFixed(1) : "0.0";

    return {
      stages: [
        {
          name: "Outreach Sent",
          count: totalOutreach,
          color: "bg-blue-500",
          textColor: "text-blue-400",
          icon: Zap,
        },
        {
          name: "Discovery Booked",
          count: totalCalls,
          convRate: `${callConv}%`,
          color: "bg-purple-500",
          textColor: "text-purple-400",
          icon: Calendar,
        },
        {
          name: "Qualified Held",
          count: qualifiedCalls,
          convRate: `${qualConv}%`,
          color: "bg-cyan-500",
          textColor: "text-cyan-400",
          icon: Target,
        },
        {
          name: "Deals Won",
          count: closedWon,
          convRate: `${wonConv}%`,
          color: "bg-emerald-500",
          textColor: "text-emerald-400",
          icon: Award,
        },
      ],
      overallConv,
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Header Bar: Gamified Streak & Time Horizon Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#131B2E]/70 border border-white/[0.08] backdrop-blur-xl p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {streakDays > 0 ? `${streakDays}-Day Activity Streak!` : "Start Your Daily Streak"}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                {tierInfo.icon} {tierInfo.currentTier}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {tierInfo.remainingDeals > 0
                ? `${tierInfo.remainingDeals} more won deals to reach ${tierInfo.nextTier}`
                : "Top milestone unlocked! Elite President's Club."}
            </p>
          </div>
        </div>

        {/* Time Horizon Pills */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/[0.06] text-xs font-semibold">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "quarter", label: "Quarter" },
              { id: "all", label: "All Time" },
            ] as { id: TimeHorizon; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeHorizon(t.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeHorizon === t.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier Quota Progression Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <Target size={14} className="text-purple-400" />
            <span>Tier Quota Progress: <strong className="text-white">{tierInfo.currentTier}</strong></span>
          </div>
          <span className="font-mono text-purple-400 font-bold">{tierInfo.progressPct}% Complete</span>
        </div>
        <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden border border-white/[0.04] relative">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, tierInfo.progressPct)}%` }}
          />
        </div>
      </div>

      {/* 4 Rich Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Discovery Calls */}
        <div className="group relative rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-5 space-y-2 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Discovery Calls</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {filteredData.totalBookingsCount}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> {filteredData.qualifiedMeetings} Qualified &amp; Held
            </span>
            <span className="text-slate-500">
              {filteredData.totalBookingsCount > 0
                ? `${Math.round((filteredData.qualifiedMeetings / filteredData.totalBookingsCount) * 100)}% Qual`
                : "0% Qual"}
            </span>
          </div>
        </div>

        {/* Metric 2: Meeting Bonus Accrual */}
        <div className="group relative rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-5 space-y-2 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Meeting Bonuses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
            {currencySymbol}{filteredData.meetingBonusRange[0].toLocaleString()} – {currencySymbol}{filteredData.meetingBonusRange[1].toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
            <span className="text-slate-400">
              {commissionSummary?.meetingBonusPaidCount || 0} Bonuses Paid Out
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">
              {currencySymbol}{bonusMin}–{bonusMax}/call
            </span>
          </div>
        </div>

        {/* Metric 3: Deals Closed */}
        <div className="group relative rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-5 space-y-2 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Deals Closed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Award size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {filteredData.wonDealsCount}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
            <span className="text-cyan-300 font-mono font-bold">
              {currencySymbol}{filteredData.wonDealValue.toLocaleString()} volume
            </span>
            <span className="text-slate-500">
              {filteredData.qualifiedMeetings > 0
                ? `${Math.round((filteredData.wonDealsCount / filteredData.qualifiedMeetings) * 100)}% Close`
                : "0%"}
            </span>
          </div>
        </div>

        {/* Metric 4: Deal Commissions */}
        <div className="group relative rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-5 space-y-2 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Deal Commissions</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono tracking-tight">
            {currencySymbol}{Math.round(filteredData.dealCommRange[0]).toLocaleString()} – {currencySymbol}{Math.round(filteredData.dealCommRange[1]).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
            <span className="text-purple-400">
              {commissionSummary?.dealCommissionPaidCount || 0} Paid / Settled
            </span>
            <span className="text-indigo-300 font-mono text-[10px]">
              {commPctMin}%–{commPctMax}% Comm
            </span>
          </div>
        </div>
      </div>

      {/* Visual SVG Trend Chart & Conversion Funnel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Performance Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white">Call Volume &amp; Deal Revenue Trends</h3>
              </div>
              <p className="text-xs text-slate-400">Chronological timeline over selected timeframe</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Calls Booked
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Revenue Closed
              </span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="relative w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = paddingY + ratio * (chartHeight - paddingY * 2);
                return (
                  <line
                    key={idx}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Bars for Calls */}
              {points.map((p, idx) => (
                <rect
                  key={`bar-${idx}`}
                  x={p.x - 12}
                  y={chartHeight - paddingY - p.barHeight}
                  width={24}
                  height={Math.max(2, p.barHeight)}
                  rx={4}
                  fill="url(#barGradient)"
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}

              {/* Revenue Area Fill & Line */}
              <path d={areaPath} fill="url(#revenueGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points on Line */}
              {points.map((p, idx) => (
                <g key={`pt-${idx}`}>
                  <circle
                    cx={p.x}
                    cy={p.yVol}
                    r={5}
                    fill="#0B0F19"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        label: p.label,
                        calls: p.calls,
                        volume: p.volume,
                        x: p.x,
                        y: p.yVol,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X Axis Labels */}
                  <text
                    x={p.x}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900/95 border border-white/20 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-[11px] space-y-1 z-20"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(20, (hoveredPoint.y / chartHeight) * 100 - 15)}%`,
                }}
              >
                <p className="font-bold text-white border-b border-white/10 pb-0.5">
                  {hoveredPoint.label}
                </p>
                <div className="flex items-center justify-between gap-3 text-purple-300">
                  <span>Calls:</span>
                  <span className="font-bold font-mono">{hoveredPoint.calls}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-emerald-400">
                  <span>Revenue:</span>
                  <span className="font-bold font-mono">
                    {currencySymbol}{hoveredPoint.volume.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Funnel Card (1 col) */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Pipeline Conversion</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {funnelStages.overallConv}% Overall
            </span>
          </div>

          <div className="space-y-3">
            {funnelStages.stages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className={stage.textColor} />
                      <span className="font-medium text-slate-300">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{stage.count}</span>
                      {stage.convRate && (
                        <span className="text-[10px] text-slate-400">({stage.convRate})</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${
                          funnelStages.stages[0].count > 0
                            ? Math.max(8, (stage.count / funnelStages.stages[0].count) * 100)
                            : 10
                        }%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Info size={12} className="text-purple-400" />
              <span>Pro Rep Tip</span>
            </div>
            <p>
              Maintaining an outreach-to-call conversion rate above <strong>5%</strong> significantly accelerates quota progression.
            </p>
          </div>
        </div>
      </div>

      {/* Sourced Discovery Calls & Deals Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Discovery Calls &amp; Deals Sourced</h3>
            <p className="text-xs text-slate-400">Prospects who booked discovery calls through your link</p>
          </div>
          <span className="text-xs font-bold text-purple-400">{filteredData.filteredBookings.length} Tracked</span>
        </div>

        {filteredData.filteredBookings.length === 0 ? (
          <div className="text-center py-10 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <Calendar size={28} className="mx-auto text-slate-500" />
            <p className="text-xs text-slate-400">No discovery calls found for this timeframe.</p>
            <p className="text-[11px] text-slate-500">
              Use the{" "}
              <button onClick={() => setActiveTab("leads")} className="text-purple-400 hover:underline">
                Leads CRM
              </button>{" "}
              or{" "}
              <button onClick={() => setActiveTab("campaigns")} className="text-purple-400 hover:underline">
                Automated Campaigns
              </button>{" "}
              to start generating inbound interest!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Meeting Bonus</th>
                  <th className="py-3 px-3">Deal Comm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredData.filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{b.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{b.work_email}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{b.company_name || "—"}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(b.slot_start).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.meeting_bonus_payout_status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {b.meeting_bonus_payout_status === "paid" ? "Paid" : "Pending Review"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.deal_commission_payout_status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {b.deal_commission_payout_status === "paid" ? "Paid" : "Pending Close"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
