"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Users,
  Activity,
  Send,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  User,
  Mail,
  ShieldCheck,
  ChevronRight,
  Flame,
  AlertCircle,
  X,
  Building,
} from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";

interface RepScorecard {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  assigned_outreach_email: string | null;
  outreach_display_name?: string | null;
  totalEmailsSent: number;
  emailsSentToday: number;
  totalLeads: number;
  meetingsBooked: number;
  dealsWon: number;
  pipelineValue: number;
  streakDays: number;
  lastActivity: string | null;
  velocityBadge: string;
  badgeColor: string;
  recentActions: {
    id: string;
    action_type: string;
    created_at: string;
    description: string;
  }[];
}

interface AuditLogItem {
  id: string;
  employee_id: string;
  action_type: string;
  description: string;
  target_identifier: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
  employees?: {
    id: string;
    full_name: string;
    email: string;
    role_title: string;
    assigned_outreach_email: string | null;
  };
}

interface GlobalMetrics {
  totalReps: number;
  activeRepsToday: number;
  activeRepsThisWeek: number;
  emailsToday: number;
  emailsThisWeek: number;
  leadsThisWeek: number;
  totalPipelineValue: number;
}

export default function AdminRepsProductivityPage() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [scorecards, setScorecards] = useState<RepScorecard[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogCount, setTotalLogCount] = useState(0);

  const [activeTab, setActiveTab] = useState<"scorecards" | "live_feed" | "audit_table">("scorecards");
  const [loading, setLoading] = useState(true);

  // Audit Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepFilter, setSelectedRepFilter] = useState("all");
  const [selectedActionFilter, setSelectedActionFilter] = useState("all");

  // Selected Rep Deep Dive Drawer
  const [selectedRep, setSelectedRep] = useState<RepScorecard | null>(null);

  // Scorecards are computed in-memory across every employee (an aggregate
  // report, not a simple table query), so there is no DB-level range to
  // paginate — row count is bounded by headcount, not an ever-growing table.
  // We still paginate the rendered list client-side for consistency with the
  // rest of the admin panel.
  const [scorecardPage, setScorecardPage] = useState(1);
  const [scorecardPageSize, setScorecardPageSize] = useState(25);

  // Audit trail table — the backend already supports real offset/limit
  // pagination (app/api/admin/reps/activity/route.ts); wire it up here.
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(25);

  useEffect(() => {
    fetchProductivityData();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditPage, auditPageSize]);

  useEffect(() => {
    setAuditPage(1);
  }, [selectedRepFilter, selectedActionFilter]);

  async function fetchProductivityData() {
    try {
      const res = await fetch("/api/admin/reps/productivity");
      const data = await res.json();
      if (data.ok) {
        setMetrics(data.metrics);
        setScorecards(data.scorecards || []);
      }
    } catch {}
  }

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const offset = (auditPage - 1) * auditPageSize;
      let url = `/api/admin/reps/activity?limit=${auditPageSize}&offset=${offset}`;
      if (selectedRepFilter !== "all") url += `&rep_id=${selectedRepFilter}`;
      if (selectedActionFilter !== "all") url += `&action_type=${selectedActionFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs || []);
        setTotalLogCount(data.totalCount || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (auditPage === 1) fetchAuditLogs();
    else setAuditPage(1);
  }

  function handleDownloadCsv() {
    let url = `/api/admin/reps/activity?format=csv`;
    if (selectedRepFilter !== "all") url += `&rep_id=${selectedRepFilter}`;
    if (selectedActionFilter !== "all") url += `&action_type=${selectedActionFilter}`;
    if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

    window.open(url, "_blank");
  }

  const actionTypeBadges: Record<string, { label: string; color: string }> = {
    outreach_sent: { label: "Cold Email", color: "bg-purple text-white" },
    drip_dispatched: { label: "Automated Drip", color: "bg-indigo-100 text-indigo-800" },
    campaign_enrolled: { label: "Campaign Enrolled", color: "bg-blue-100 text-blue-800" },
    lead_created: { label: "Lead Created", color: "bg-emerald-100 text-emerald-800" },
    stage_updated: { label: "Stage Changed", color: "bg-amber-100 text-amber-800" },
    payout_updated: { label: "Payout Updated", color: "bg-slate-100 text-slate-800" },
    onboarding_completed: { label: "Onboarded", color: "bg-teal-100 text-teal-800" },
    login: { label: "Portal Login", color: "bg-slate-100 text-slate-600" },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Sales Rep Productivity &amp; Audit Logs</h1>
            <p className="text-sm text-slate-500">
              Real-time monitoring of outreach volume, pipeline velocity, active day streaks, and timestamped audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy shadow-sm transition hover:bg-slate-50"
            >
              <Download size={14} /> Export CSV Audit Trail
            </button>
          </div>
        </div>

        {/* Global KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Active Reps</span>
              <Users size={16} className="text-purple" />
            </div>
            <div className="text-2xl font-black text-navy">
              {metrics?.activeRepsToday || 0} <span className="text-xs font-normal text-slate-400">/ {metrics?.totalReps || 0} total</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium">
              {metrics?.activeRepsThisWeek || 0} active in last 7 days
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Emails Sent Today</span>
              <Send size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-navy">{metrics?.emailsToday || 0}</div>
            <p className="text-xs text-slate-500 font-medium">
              {metrics?.emailsThisWeek || 0} dispatched this week
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Leads Added (7D)</span>
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-navy">{metrics?.leadsThisWeek || 0}</div>
            <p className="text-xs text-purple font-medium">Added to sales pipeline</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Pipeline Generated</span>
              <DollarSign size={16} className="text-purple" />
            </div>
            <div className="text-2xl font-black text-navy">
              ${(metrics?.totalPipelineValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">Estimated deal volume</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { id: "scorecards", label: `Rep Scorecards & Leaderboard (${scorecards.length})`, icon: Users },
            { id: "live_feed", label: "Live Activity Timeline", icon: Activity },
            { id: "audit_table", label: `Audit Trail Table (${totalLogCount})`, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "border-purple text-purple bg-lavender/30 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-navy"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: REP SCORECARDS & LEADERBOARD */}
        {activeTab === "scorecards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scorecards.slice((scorecardPage - 1) * scorecardPageSize, scorecardPage * scorecardPageSize).map((rep) => (
              <div
                key={rep.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender font-bold text-purple">
                        {rep.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy">{rep.full_name}</h3>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{rep.email}</p>
                      </div>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${rep.badgeColor}`}>
                      {rep.velocityBadge}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Emails Sent</p>
                      <p className="mt-0.5 text-base font-black text-navy">{rep.totalEmailsSent}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Leads CRM</p>
                      <p className="mt-0.5 text-base font-black text-navy">{rep.totalLeads}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Streak</p>
                      <p className="mt-0.5 text-base font-black text-amber-600 flex items-center justify-center gap-0.5">
                        <Flame size={14} className="fill-amber-500 text-amber-500" />
                        {rep.streakDays}d
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Assigned Alias:</span>
                      <span className="font-mono text-purple font-semibold truncate max-w-[150px]">
                        {rep.assigned_outreach_email || "Standard Alias"}
                      </span>
                    </p>
                    <p className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Meetings / Deals Won:</span>
                      <span className="font-bold text-emerald-700">
                        {rep.meetingsBooked} Booked &bull; {rep.dealsWon} Won
                      </span>
                    </p>
                    <p className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Last Activity:</span>
                      <span className="text-slate-500 font-medium">
                        {rep.lastActivity ? new Date(rep.lastActivity).toLocaleDateString("en-GB") : "Never"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setSelectedRep(rep)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-lavender py-2 text-xs font-bold text-purple transition hover:bg-purple hover:text-white"
                  >
                    <Eye size={14} /> Inspect Rep Funnel &amp; Timeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "scorecards" && (
          <Pagination
            page={scorecardPage}
            pageSize={scorecardPageSize}
            totalCount={scorecards.length}
            onPageChange={setScorecardPage}
            onPageSizeChange={(size) => {
              setScorecardPageSize(size);
              setScorecardPage(1);
            }}
          />
        )}

        {/* TAB 2: LIVE ACTIVITY TIMELINE */}
        {activeTab === "live_feed" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Activity size={18} className="text-purple" /> Real-time Chronological Activity Stream
            </h3>
            <p className="text-xs text-slate-500">Live feed of all sales rep actions across cold outreach, lead creation, and CRM status changes.</p>

            <div className="relative space-y-4 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 mt-6">
              {logs.slice(0, 30).map((log) => {
                const badge = actionTypeBadges[log.action_type] || { label: log.action_type, color: "bg-slate-100 text-slate-700" };
                return (
                  <div key={log.id} className="relative flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm font-bold text-xs text-purple">
                      {log.employees?.full_name?.charAt(0) || "R"}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-navy">{log.employees?.full_name || "Sales Rep"}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-700">{log.description}</p>

                      {log.target_identifier && (
                        <div className="mt-2 text-[11px] text-slate-500 font-mono">
                          Target: <span className="text-navy font-semibold">{log.target_identifier}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL TABLE */}
        {activeTab === "audit_table" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="sm:col-span-2 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search description, prospect email..."
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-navy focus:border-purple focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={selectedRepFilter}
                  onChange={(e) => setSelectedRepFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-navy focus:border-purple focus:outline-none"
                >
                  <option value="all">All Sales Reps</option>
                  {scorecards.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedActionFilter}
                  onChange={(e) => setSelectedActionFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-navy focus:border-purple focus:outline-none"
                >
                  <option value="all">All Action Types</option>
                  <option value="outreach_sent">Cold Emails</option>
                  <option value="drip_dispatched">Automated Drips</option>
                  <option value="campaign_enrolled">Campaign Enrolled</option>
                  <option value="lead_created">Leads Created</option>
                  <option value="stage_updated">Stage Changed</option>
                  <option value="payout_updated">Payout Updated</option>
                  <option value="login">Portal Logins</option>
                </select>
              </div>
            </form>

            {/* Audit Logs Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading audit trail...</div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No audit logs matching criteria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Sales Rep</th>
                        <th className="py-3 px-4">Action Type</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Target Prospect</th>
                        <th className="py-3 px-4">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => {
                        const badge = actionTypeBadges[log.action_type] || { label: log.action_type, color: "bg-slate-100 text-slate-700" };
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString("en-GB")}
                            </td>
                            <td className="py-3 px-4 font-bold text-navy whitespace-nowrap">
                              {log.employees?.full_name || "Sales Rep"}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 max-w-sm">{log.description}</td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                              {log.target_identifier || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                              {log.ip_address || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                page={auditPage}
                pageSize={auditPageSize}
                totalCount={totalLogCount}
                onPageChange={setAuditPage}
                onPageSizeChange={(size) => {
                  setAuditPageSize(size);
                  setAuditPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* REP DEEP-DIVE INSPECTOR DRAWER */}
      {selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple text-white font-bold text-lg shadow-md">
                    {selectedRep.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy">{selectedRep.full_name}</h2>
                    <p className="text-xs text-slate-500">{selectedRep.email}</p>
                    <span className={`inline-block mt-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${selectedRep.badgeColor}`}>
                      {selectedRep.velocityBadge}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRep(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-navy"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6">
                {/* Rep Conversion Funnel */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Personal Conversion Funnel
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Leads</span>
                      <p className="mt-1 text-lg font-black text-navy">{selectedRep.totalLeads}</p>
                    </div>
                    <div className="rounded-xl border border-purple/20 bg-lavender/30 p-3">
                      <span className="text-[10px] font-bold uppercase text-purple">Meetings Sourced</span>
                      <p className="mt-1 text-lg font-black text-purple">{selectedRep.meetingsBooked}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <span className="text-[10px] font-bold uppercase text-emerald-800">Closed Deals</span>
                      <p className="mt-1 text-lg font-black text-emerald-700">{selectedRep.dealsWon}</p>
                    </div>
                  </div>
                </div>

                {/* Configuration Stats */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Corporate Outreach Alias:</span>
                    <span className="font-mono text-purple font-semibold">
                      {selectedRep.assigned_outreach_email || "outreach@digitaldude.co.uk (Default)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Outreach Display Name:</span>
                    <span className="font-semibold text-navy">
                      {selectedRep.outreach_display_name || "The Digital Dude Partnerships"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Active Day Streak:</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Flame size={14} className="fill-amber-500 text-amber-500" />
                      {selectedRep.streakDays} Days Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estimated Pipeline Volume:</span>
                    <span className="font-bold text-navy font-mono">
                      ${selectedRep.pipelineValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Recent Actions Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Recent Timestamped Actions
                  </h4>
                  <div className="space-y-2">
                    {selectedRep.recentActions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No recent logged actions.</p>
                    ) : (
                      selectedRep.recentActions.map((a) => (
                        <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold text-purple uppercase">{a.action_type.replace(/_/g, " ")}</span>
                            <span>{new Date(a.created_at).toLocaleString("en-GB")}</span>
                          </div>
                          <p className="mt-1 text-slate-700">{a.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
              <a
                href={`/admin/employees/${selectedRep.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple/90 shadow-2xs transition"
              >
                Configure Sender Alias &amp; Rates →
              </a>
              <button
                onClick={() => setSelectedRep(null)}
                className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-navy hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
