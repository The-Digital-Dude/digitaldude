"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, Eye, Briefcase, Search } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  industry: string;
  tag: string;
  status: "Live" | "Delivered" | "Draft";
  image: string;
  created_at: string;
}

export default function AdminCaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [industryFilter, setIndustryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  async function fetchCaseStudies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (industryFilter !== "all") params.set("industry", industryFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/case-studies?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setCaseStudies(data.caseStudies || []);
        setTotalCount(data.totalCount ?? (data.caseStudies || []).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCaseStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, industryFilter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [industryFilter, debouncedSearch]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete the case study "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/case-studies/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setCaseStudies((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(data.error || "Failed to delete case study.");
      }
    } catch {
      alert("An error occurred while deleting.");
    }
  }

  const industries = Array.from(new Set(caseStudies.map((c) => c.industry))).filter(Boolean);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2.5">
              <Briefcase className="text-purple" size={24} />
              Case Studies &amp; Portfolio Management
            </h1>
            <p className="mt-1 text-sm text-navy/60">
              Create, edit, and publish client system case studies to show proof of delivery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCaseStudies}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy/70 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/admin/case-studies/new"
              className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-xs"
            >
              <Plus size={16} />
              Add New Case Study
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search case studies by title, slug, industry..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-navy/60 font-semibold">Industry:</label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy outline-none focus:border-purple"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Case Studies Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-navy/50">
                  <th className="pb-3">Project Title &amp; Slug</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Tag</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-navy/50">
                      Loading case studies…
                    </td>
                  </tr>
                )}

                {!loading && caseStudies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-navy/50">
                      No case studies found. Click &quot;Add New Case Study&quot; to publish your first one.
                    </td>
                  </tr>
                )}

                {!loading &&
                  caseStudies.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/60">
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-navy">{item.title}</div>
                        <div className="font-mono text-xs text-navy/40">/work/{item.slug}</div>
                      </td>
                      <td className="py-4">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-navy/80">
                          {item.industry}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-navy/60 font-medium">
                        {item.tag}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.status === "Live"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "Delivered"
                              ? "bg-purple/10 text-purple"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-navy/60">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Seed"}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/work/${item.slug}`}
                            target="_blank"
                            className="rounded-lg p-1.5 text-navy/50 transition hover:bg-lavender hover:text-purple"
                            title="View Live Case Study"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/case-studies/${item.id}/edit`}
                            className="rounded-lg p-1.5 text-navy/50 transition hover:bg-slate-100 hover:text-navy"
                            title="Edit Case Study"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="rounded-lg p-1.5 text-navy/50 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete Case Study"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
