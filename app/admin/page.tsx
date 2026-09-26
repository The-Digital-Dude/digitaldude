"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  CalendarCheck,
  Clock,
  FileText,
  Globe2,
  Video,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  Kanban,
  Table as TableIcon,
  Download,
  Sparkles,
  ScrollText,
  Plus,
  Mail,
} from "lucide-react";
import { BookingLead, formatGbp } from "@/lib/crm";
import { CrmKanbanBoard } from "@/components/admin/CrmKanbanBoard";
import { EmailComposerModal, EmailComposerRecipient } from "@/components/admin/EmailComposerModal";

interface AdminStats {
  totalBookings: number;
  upcomingBookings: number;
  totalPipelineValue: number;
  wonRevenue: number;
  activeDealsCount: number;
  winRate: number;
  totalPosts: number;
  totalProposals: number;
  totalCaseStudies: number;
  stageCounts: Record<string, number>;
  scoreCounts: Record<string, number>;
  countryCounts: Record<string, number>;
  recentBookings: BookingLead[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leads, setLeads] = useState<BookingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [emailRecipient, setEmailRecipient] = useState<EmailComposerRecipient | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/bookings"),
      ]);

      const [statsData, bookingsData] = await Promise.all([
        statsRes.json(),
        bookingsRes.json(),
      ]);

      if (statsData.ok) {
        setStats(statsData.stats);
      }
      if (bookingsData.ok) {
        setLeads(bookingsData.bookings || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateLead = async (id: string, updates: Partial<BookingLead>) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead))
    );

    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      // Refresh stats in background
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsData.ok) setStats(statsData.stats);
    } catch {
      // Revert if error
      fetchData();
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"?`)) return;

    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsData.ok) setStats(statsData.stats);
    } catch {
      fetchData();
    }
  };

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Executive Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Executive CRM & Revenue Pipeline
            </h1>
            <p className="text-sm text-navy/60">
              Real-time inbound deal stages, pipeline valuation, and client conversion metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "kanban"
                    ? "bg-white text-purple shadow-2xs"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                <Kanban size={13} /> Kanban
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "table"
                    ? "bg-white text-purple shadow-2xs"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                <TableIcon size={13} /> Table
              </button>
            </div>

            <a
              href="/api/admin/export-csv"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition shadow-2xs"
            >
              <Download size={14} /> Export CSV
            </a>

            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Executive KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Active Deal Pipeline
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple/10 text-purple">
                <TrendingUp size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-navy">
              {stats ? formatGbp(stats.totalPipelineValue) : "£0"}
            </p>
            <p className="mt-1 text-[11px] text-navy/60">
              Across <strong className="text-navy">{stats?.activeDealsCount || 0} active deals</strong> in progress
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Closed Won Revenue
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Sparkles size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
              {stats ? formatGbp(stats.wonRevenue) : "£0"}
            </p>
            <p className="mt-1 text-[11px] text-navy/60">
              Win Rate: <strong className="text-emerald-700">{stats?.winRate || 0}%</strong> of total inbound
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Discovery Calls
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarCheck size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-navy">
              {stats?.totalBookings || 0}
            </p>
            <p className="mt-1 text-[11px] text-navy/60">
              <strong className="text-blue-600">{stats?.upcomingBookings || 0} calls</strong> booked in next 7 days
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Specs & Content
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ScrollText size={16} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-navy">
              {stats?.totalProposals || 0} Specs
            </p>
            <p className="mt-1 text-[11px] text-navy/60">
              {stats?.totalCaseStudies || 7} Case Studies · {stats?.totalPosts || 0} Articles
            </p>
          </div>
        </div>

        {/* Main Content Area: Kanban View vs Table View */}
        {viewMode === "kanban" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                <Kanban size={15} className="text-purple" /> Active Lead Pipeline Board
              </h2>
              <span className="text-xs text-navy/50">
                Click arrows to advance stages or edit deal metrics
              </span>
            </div>

            <CrmKanbanBoard
              leads={leads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              loading={loading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                <TableIcon size={15} className="text-purple" /> Full Lead & Meeting Registry
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                    <tr>
                      <th className="py-3 px-4">Company & Lead</th>
                      <th className="py-3 px-4">Country</th>
                      <th className="py-3 px-4">Meeting Time</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Deal Value</th>
                      <th className="py-3 px-4">Lead Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{lead.company_name}</div>
                          <div className="text-[11px] text-navy/60">
                            {lead.name} ({lead.work_email})
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-navy/80">
                            <Globe2 size={11} className="text-purple" /> {lead.country}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-navy">
                            {formatDateTime(lead.slot_start)}
                          </div>
                          {lead.meet_url && (
                            <a
                              href={lead.meet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple hover:underline"
                            >
                              <Video size={11} /> Google Meet
                            </a>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="capitalize font-bold text-purple text-xs">
                            {lead.stage.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-navy">
                          {formatGbp(lead.deal_value || 8500)}
                        </td>

                        <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-navy/70">
                          {lead.lead_score}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEmailRecipient({
                                  name: lead.name,
                                  email: lead.work_email,
                                  companyName: lead.company_name,
                                  bookingId: lead.id,
                                  defaultTemplateId: "discovery_followup",
                                })
                              }
                              title="Email Lead via Brevo"
                              className="rounded-lg border border-purple/20 bg-purple/5 p-1.5 text-purple hover:bg-purple/10 transition"
                            >
                              <Mail size={13} />
                            </button>

                            <Link
                              href="/admin/proposals/new"
                              className="rounded-lg bg-purple/10 px-2.5 py-1 text-[11px] font-bold text-purple hover:bg-purple/20 transition"
                            >
                              Draft Spec
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Global Country Distribution */}
        {stats?.countryCounts && Object.keys(stats.countryCounts).length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-4 flex items-center gap-2">
              <Globe2 size={14} className="text-purple" /> Regional Deal Distribution
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(stats.countryCounts).map(([c, count]) => (
                <div
                  key={c}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs"
                >
                  <span className="font-semibold text-navy">{c}</span>
                  <span className="rounded-full bg-purple/10 px-2.5 py-0.5 text-xs font-bold text-purple">
                    {count} deals
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={!!emailRecipient}
        recipient={emailRecipient}
        onClose={() => setEmailRecipient(null)}
        onSent={() => {
          if (emailRecipient?.bookingId) {
            handleUpdateLead(emailRecipient.bookingId, { stage: "proposal_sent" });
          }
        }}
      />
    </AdminLayout>
  );
}
