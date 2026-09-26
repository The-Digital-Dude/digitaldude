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
} from "lucide-react";

interface RecentBooking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  team_size: string | null;
  slot_start: string;
  status: string;
  meet_url: string | null;
  created_at: string;
}

interface AdminStats {
  totalBookings: number;
  upcomingBookings: number;
  totalPosts: number;
  countryCounts: Record<string, number>;
  recentBookings: RecentBooking[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

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
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy">Overview Dashboard</h1>
            <p className="mt-1 text-sm text-navy/60">
              Welcome back. Here is what is happening across bookings and content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy/70 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/admin/blogs/new"
              className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <FileText size={16} />
              Write New Post
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy/60">Total Discovery Calls</span>
              <div className="rounded-xl bg-lavender p-2.5 text-purple">
                <CalendarCheck size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-navy">
              {stats?.totalBookings ?? "—"}
            </p>
            <p className="mt-1 text-xs text-navy/50">All-time website bookings</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy/60">Upcoming Calls</span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Clock size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-navy">
              {stats?.upcomingBookings ?? "—"}
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-medium">Next 7 days</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy/60">Published Articles</span>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <FileText size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-navy">
              {stats?.totalPosts ?? "—"}
            </p>
            <p className="mt-1 text-xs text-navy/50">Live SEO blog posts</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy/60">Top Markets</span>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Globe2 size={20} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(stats?.countryCounts || {}).slice(0, 3).map(([country, count]) => (
                <span
                  key={country}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy"
                >
                  {country}: {count}
                </span>
              ))}
              {Object.keys(stats?.countryCounts || {}).length === 0 && (
                <p className="text-sm text-navy/50">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Discovery Calls Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-navy">Recent Discovery Calls</h2>
              <p className="text-xs text-navy/50">Latest client bookings received</p>
            </div>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-1 text-sm font-semibold text-purple hover:underline"
            >
              View all bookings <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-navy/50">
                  <th className="pb-3">Client &amp; Company</th>
                  <th className="pb-3">Scheduled Time</th>
                  <th className="pb-3">Country</th>
                  <th className="pb-3">Team</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Meeting Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-4">
                      <p className="font-semibold text-navy">{b.name}</p>
                      <p className="text-xs text-navy/50">{b.company_name} · {b.work_email}</p>
                    </td>
                    <td className="py-4 font-medium text-navy">
                      {formatDateTime(b.slot_start)}
                    </td>
                    <td className="py-4 text-navy/70">{b.country}</td>
                    <td className="py-4 text-navy/70">{b.team_size || "—"}</td>
                    <td className="py-4">
                      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 capitalize">
                        {b.status || "confirmed"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {b.meet_url ? (
                        <a
                          href={b.meet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-lavender px-3 py-1.5 text-xs font-semibold text-purple hover:bg-tint"
                        >
                          <Video size={14} /> Join Meet
                        </a>
                      ) : (
                        <span className="text-xs text-navy/40">Calendar invite</span>
                      )}
                    </td>
                  </tr>
                ))}

                {(!stats || stats.recentBookings.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-navy/50">
                      No bookings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
