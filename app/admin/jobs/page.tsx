"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, Search } from "lucide-react";

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  status: string;
  created_at: string;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs");
      const data = await res.json();
      if (data.ok) setJobs(data.jobs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete job posting "${title}"? Any applications against it will also be removed.`)) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
      else alert(data.error || "Failed to delete job posting.");
    } catch {
      alert("An error occurred while deleting.");
    }
  }

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.slug.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Job Postings</h1>
            <p className="text-sm text-navy/60">Manage open roles on the public /careers page.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchJobs}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs"
            >
              <Plus size={15} /> New Job Posting
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-navy/60">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-navy outline-none focus:border-purple"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading job postings…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">
              No job postings found. Click &ldquo;New Job Posting&rdquo; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Department / Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy">{job.title}</div>
                        <div className="font-mono text-[11px] text-navy/50">/careers/{job.slug}</div>
                      </td>
                      <td className="py-3.5 px-4 text-navy/70">
                        {job.department} &middot; {job.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            job.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : job.status === "closed"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === "open" && (
                            <Link
                              href={`/careers/${job.slug}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100 hover:text-navy"
                              title="View public posting"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                          <Link
                            href={`/admin/jobs/${job.id}/edit`}
                            className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100 hover:text-navy"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(job.id, job.title)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
