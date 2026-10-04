"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PseoBulkImportModal } from "@/components/admin/pseo/PseoBulkImportModal";
import { PseoEditModal } from "@/components/admin/pseo/PseoEditModal";
import { PseoPageData } from "@/lib/pseo/types";
import {
  Globe,
  Upload,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Sparkles,
  Layers,
  Scale,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Database,
  Eye,
  RefreshCw,
  Send,
  X,
  FileText,
  SearchCheck,
  Gauge,
  Zap,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { SITE_URL } from "@/lib/utils";

export default function AdminPseoDashboard() {
  const [pages, setPages] = useState<PseoPageData[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    locations: 0,
    solutions: 0,
    comparisons: 0,
    custom: 0,
    dbOverrides: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PseoPageData | null>(null);

  // Indexing State (IndexNow & Google)
  const [isIndexNowModalOpen, setIsIndexNowModalOpen] = useState(false);
  const [customIndexUrls, setCustomIndexUrls] = useState("");
  const [isSubmittingIndexNow, setIsSubmittingIndexNow] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [indexNowResult, setIndexNowResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Google Quota & Inspection
  const [googleQuota, setGoogleQuota] = useState<{
    limit: number;
    used: number;
    remaining: number;
    hasAuth: boolean;
  }>({ limit: 200, used: 0, remaining: 200, hasAuth: false });
  const [inspectingSlug, setInspectingSlug] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  async function fetchGoogleQuota() {
    try {
      const res = await fetch("/api/admin/seo/google");
      const data = await res.json();
      if (data.ok && data.quota) {
        setGoogleQuota(data.quota);
      }
    } catch (e) {
      console.error("Failed to load Google quota", e);
    }
  }

  async function handleSubmitIndexNow(urls?: string[]) {
    setIsSubmittingIndexNow(true);
    setIndexNowResult(null);

    try {
      const payload: { urls?: string[] } = {};
      if (urls && urls.length > 0) {
        payload.urls = urls;
      }

      const res = await fetch("/api/admin/pseo/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "IndexNow submission failed");
      }

      setIndexNowResult({
        ok: true,
        message:
          data.message ||
          (urls && urls.length > 0
            ? `Successfully submitted ${urls.length} custom URL(s) to IndexNow (Bing/Yahoo).`
            : `Successfully submitted the entire website (Services, Work, Blog, Industries, Careers & pSEO) to IndexNow.`),
      });
      setIsIndexNowModalOpen(false);
      setCustomIndexUrls("");
    } catch (err: any) {
      setIndexNowResult({
        ok: false,
        error: err.message || "Failed to submit URLs to IndexNow.",
      });
    } finally {
      setIsSubmittingIndexNow(false);
    }
  }

  async function handleSubmitGoogle(urls?: string[]) {
    setIsSubmittingGoogle(true);
    setIndexNowResult(null);

    try {
      const payload: { urls?: string[] } = {};
      if (urls && urls.length > 0) {
        payload.urls = urls;
      }

      const res = await fetch("/api/admin/seo/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Google Indexing submission failed");
      }

      setIndexNowResult({
        ok: true,
        message: `Successfully submitted ${data.submitted || (urls ? urls.length : 0)} URL(s) to Google Web Search Indexing API! Remaining daily quota: ${data.quotaRemaining ?? (googleQuota.remaining - (data.submitted || 0))}/200`,
      });
      fetchGoogleQuota();
      setIsIndexNowModalOpen(false);
      setCustomIndexUrls("");
    } catch (err: any) {
      setIndexNowResult({
        ok: false,
        error: err.message || "Failed to submit URLs to Google Indexing API.",
      });
    } finally {
      setIsSubmittingGoogle(false);
    }
  }

  async function handleSubmitUniversal(urls?: string[]) {
    await handleSubmitIndexNow(urls);
    await handleSubmitGoogle(urls);
  }

  async function handleInspectUrl(slugOrUrl: string) {
    const fullUrl = slugOrUrl.startsWith("http")
      ? slugOrUrl
      : `${SITE_URL}${slugOrUrl.startsWith("/") ? "" : "/"}${slugOrUrl}`;

    setInspectingSlug(slugOrUrl);
    setInspectionResult(null);
    setIsInspectModalOpen(true);

    try {
      const res = await fetch("/api/admin/seo/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });

      const data = await res.json();
      setInspectionResult(data);
    } catch (e: any) {
      setInspectionResult({ ok: false, error: e.message || "Inspection failed" });
    } finally {
      setInspectingSlug(null);
    }
  }

  async function fetchPseoPages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/pseo?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setPages(data.pages || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load pSEO pages", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPseoPages();
    fetchGoogleQuota();
  }, [categoryFilter, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchPseoPages();
  }

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                <Globe className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-navy">
                Programmatic SEO (pSEO) Engine
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Manage, customize, and bulk upload programmatic landing pages across Locations, Solutions, and Comparisons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Google Quota Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              title="Google Indexing API daily quota resets every 24h"
            >
              <Gauge className="h-3.5 w-3.5 text-accent-primary" />
              <span>Google Quota:</span>
              <span className="font-bold text-navy">{googleQuota.remaining}/200 left</span>
            </div>

            <button
              onClick={() => setIsIndexNowModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              title="Submit URLs to Google Indexing API and IndexNow"
            >
              <Sparkles className="h-4 w-4 text-accent-primary" />
              Instant Indexing
            </button>

            <button
              onClick={() => {
                setEditingPage({
                  slug: "new-page",
                  title: "New Programmatic Page",
                  category: "location",
                  status: "published",
                  city: "",
                  serviceSlug: "crm-development",
                } as any);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
              style={{ backgroundColor: "#5B4FE8", color: "#ffffff" }}
              title="Create a new single programmatic landing page"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Create Single Page</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
              title="Upload CSV or JSON spreadsheet in bulk"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload CSV / JSON
            </button>

            <button
              onClick={() => {
                fetchPseoPages();
                fetchGoogleQuota();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Refresh list"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-accent-primary" : ""}`} />
            </button>
          </div>
        </div>

        {/* IndexNow Notification Banner */}
        {indexNowResult && (
          <div
            className={`flex items-center justify-between rounded-2xl p-4 text-xs border ${
              indexNowResult.ok
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {indexNowResult.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{indexNowResult.ok ? indexNowResult.message : indexNowResult.error}</span>
            </div>
            <button
              onClick={() => setIndexNowResult(null)}
              className="font-bold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Pages</span>
              <Globe className="h-4 w-4 text-accent-primary" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">{metrics.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Live indexable URLs</div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Locations</span>
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">{metrics.locations}</div>
            <div className="text-[11px] text-slate-500 mt-1">UK & Australia Metros</div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Solutions</span>
              <Layers className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">{metrics.solutions}</div>
            <div className="text-[11px] text-slate-500 mt-1">Vertical Niches</div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Comparisons</span>
              <Scale className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">{metrics.comparisons}</div>
            <div className="text-[11px] text-slate-500 mt-1">Build vs Buy Guides</div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">DB Overrides</span>
              <Database className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-navy mt-2">{metrics.dbOverrides}</div>
            <div className="text-[11px] text-slate-500 mt-1">Customized in Supabase</div>
          </div>
        </div>

        {/* Directory Hub Quick Links */}
        <div className="rounded-2xl bg-slate-100 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700">Explore Public Programmatic Hubs:</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/locations"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-navy border border-slate-200 hover:bg-slate-50 transition"
            >
              <MapPin className="h-3.5 w-3.5 text-accent-primary" />
              /locations Hub
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
            <Link
              href="/solutions"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-navy border border-slate-200 hover:bg-slate-50 transition"
            >
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              /solutions Hub
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
            <Link
              href="/compare"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-navy border border-slate-200 hover:bg-slate-50 transition"
            >
              <Scale className="h-3.5 w-3.5 text-amber-600" />
              /compare Hub
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Creation Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
          <div>
            <div className="text-xs font-bold text-navy">Content Generation & Publishing</div>
            <div className="text-[11px] text-slate-500">Create new programmatic landing pages individually or upload spreadsheets in bulk.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingPage({
                  slug: "new-page",
                  title: "New Programmatic Page",
                  category: "location",
                  status: "published",
                  city: "",
                  serviceSlug: "crm-development",
                } as any);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              style={{ backgroundColor: "#5B4FE8", color: "#ffffff" }}
            >
              <Plus className="h-4 w-4 text-white" />
              <span>Create Single Page</span>
            </button>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              style={{ backgroundColor: "#059669", color: "#ffffff" }}
            >
              <Upload className="h-4 w-4 text-white" />
              <span>Bulk Upload CSV / JSON</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, URL slug, city, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-accent-primary focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="location">Locations</option>
              <option value="solution">Solutions</option>
              <option value="comparison">Comparisons</option>
              <option value="custom">Custom Overrides</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-accent-primary focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Pages Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Target Keyword / Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">URL Slug</th>
                  <th className="p-4">Storage Source</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading programmatic pages...
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No programmatic pages match your filter.
                    </td>
                  </tr>
                ) : (
                  pages.map((p, idx) => (
                    <tr key={p.slug || idx} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="font-bold text-navy max-w-sm truncate">{p.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 max-w-sm truncate">
                          Keyword: {p.targetKeyword}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            p.category === "location"
                              ? "bg-emerald-50 text-emerald-700"
                              : p.category === "solution"
                              ? "bg-sky-50 text-sky-700"
                              : p.category === "comparison"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {p.category}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-600 max-w-[220px] truncate">
                        /{p.slug}
                      </td>

                      <td className="p-4">
                        {p.id ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-100">
                            <Database className="h-3 w-3" />
                            Supabase DB
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            Code Matrix
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            p.status === "draft"
                              ? "bg-amber-100 text-amber-800"
                              : p.status === "archived"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.status || "published"}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleInspectUrl(p.slug)}
                          className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition border border-sky-100"
                          title="Inspect index status on Google Search Console"
                        >
                          <SearchCheck className="h-3.5 w-3.5" />
                          Inspect (GSC)
                        </button>
                        <button
                          onClick={() => setEditingPage(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                          title="Edit Override / Copy"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <Link
                          href={`/${p.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg bg-accent-primary/10 px-2 py-1.5 text-xs font-semibold text-accent-primary hover:bg-accent-primary/20 transition"
                          title="View Live Page"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Live
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Import Modal */}
        <PseoBulkImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onImported={() => {
            fetchPseoPages();
          }}
        />

        {/* Single Page Edit Modal */}
        <PseoEditModal
          page={editingPage}
          isOpen={Boolean(editingPage)}
          onClose={() => setEditingPage(null)}
          onSaved={() => {
            fetchPseoPages();
          }}
        />

        {/* URL Inspection Modal */}
        {isInspectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <SearchCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-navy">Google Search Console URL Inspection</h3>
                </div>
                <button
                  onClick={() => setIsInspectModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 break-all">
                  {inspectionResult?.url || `${SITE_URL}/${inspectingSlug || ""}`}
                </div>

                {inspectingSlug ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-sky-600" />
                    <span>Querying Google Search Console Inspection API...</span>
                  </div>
                ) : inspectionResult ? (
                  inspectionResult.ok ? (
                    <div className="space-y-3">
                      {inspectionResult.inspectionResult?.indexStatusResult?.verdict === "PASS" ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Index Status: Indexed in Google
                          </div>
                          <div className="text-[11px] mt-1 text-emerald-700">
                            Coverage: {inspectionResult.inspectionResult?.indexStatusResult?.coverageState || "Submitted and indexed"}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 space-y-2">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Index Status: {inspectionResult.inspectionResult?.indexStatusResult?.coverageState || "URL is unknown to Google (Pending Crawl)"}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Google Search Console verified this URL, but Googlebot has not crawled it yet. Click below to push it to Google&apos;s high-priority crawl queue.
                          </p>
                          <button
                            onClick={() => {
                              if (inspectionResult?.url) {
                                handleSubmitGoogle([inspectionResult.url]);
                              }
                            }}
                            disabled={isSubmittingGoogle}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Zap className="h-3.5 w-3.5 text-accent-primary" />
                            {isSubmittingGoogle ? "Submitting..." : "Push to Google Indexing Queue"}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div className="rounded-lg border border-slate-200 p-2.5">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Robots.txt</div>
                          <div className="font-semibold text-navy mt-0.5">
                            {inspectionResult.inspectionResult?.indexStatusResult?.robotsTxtState === "ROBOTS_TXT_STATE_UNSPECIFIED"
                              ? "Allowed (Default)"
                              : (inspectionResult.inspectionResult?.indexStatusResult?.robotsTxtState || "Allowed")}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-2.5">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Page Fetch</div>
                          <div className="font-semibold text-navy mt-0.5">
                            {inspectionResult.inspectionResult?.indexStatusResult?.pageFetchState === "PAGE_FETCH_STATE_UNSPECIFIED"
                              ? "Pending First Crawl"
                              : (inspectionResult.inspectionResult?.indexStatusResult?.pageFetchState || "Pending")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        Google Inspection Notice
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {inspectionResult.error || "Property not verified or pending first crawl in Google Search Console."}
                      </p>
                    </div>
                  )
                ) : null}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsInspectModalOpen(false)}
                    className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indexing Modal (Universal: Google + Bing IndexNow) */}
        {isIndexNowModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-accent-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy">Instant Search Indexing Engine</h3>
                    <div className="text-[11px] text-slate-500">Push live pages directly to Google, Bing, Yahoo & AI search</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsIndexNowModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Daily Quota Bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-accent-primary" />
                      Google Daily Indexing Quota
                    </span>
                    <span className="text-navy">{googleQuota.remaining} / 200 URLs left today</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-primary h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (googleQuota.used / 200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Option 1: 1-Click Universal Dispatch */}
                <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-4 space-y-3">
                  <div className="font-bold text-navy flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent-primary" />
                    Option 1: 1-Click Universal Dispatch (Google + Bing)
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Submits all <strong>Services</strong>, <strong>Case Studies (/work)</strong>, <strong>Blog Posts</strong>, <strong>Industry Solutions</strong>, <strong>Metro Hubs</strong>, and <strong>Comparisons</strong> (200+ URLs) to both Google and Bing simultaneously.
                  </p>
                  <button
                    onClick={() => handleSubmitUniversal()}
                    disabled={isSubmittingIndexNow || isSubmittingGoogle}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 font-bold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <Send className={`h-3.5 w-3.5 ${(isSubmittingIndexNow || isSubmittingGoogle) ? "animate-spin text-accent-primary" : ""}`} />
                    {isSubmittingIndexNow || isSubmittingGoogle ? "Dispatching to Search Engines..." : "Submit All to Google & Bing"}
                  </button>
                </div>

                {/* Option 2: Search Engine Specific Batches */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSubmitGoogle()}
                    disabled={isSubmittingGoogle}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <Globe className="h-3.5 w-3.5 text-sky-600" />
                    {isSubmittingGoogle ? "Submitting..." : "Google Only"}
                  </button>
                  <button
                    onClick={() => handleSubmitIndexNow()}
                    disabled={isSubmittingIndexNow}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                    {isSubmittingIndexNow ? "Submitting..." : "Bing / IndexNow Only"}
                  </button>
                </div>

                {/* Option 3: Specific URLs */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="font-bold text-navy flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    Option 3: Submit Specific URL(s)
                  </div>
                  <p className="text-slate-500">
                    Paste one or more URLs to index immediately (e.g. a newly published blog post or case study). Separate with newlines.
                  </p>
                  <textarea
                    rows={3}
                    value={customIndexUrls}
                    onChange={(e) => setCustomIndexUrls(e.target.value)}
                    placeholder={`https://www.digitaldude.co.uk/blog/my-new-post\nhttps://www.digitaldude.co.uk/work/fintech-app\n/services/mvp-development`}
                    className="w-full rounded-lg border border-slate-200 p-2.5 font-mono text-[11px] text-slate-800 focus:border-accent-primary focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const lines = customIndexUrls
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .map((l) => (l.startsWith("http") ? l : `${SITE_URL}${l.startsWith("/") ? "" : "/"}${l}`));
                        if (lines.length === 0) return;
                        handleSubmitUniversal(lines);
                      }}
                      disabled={isSubmittingIndexNow || isSubmittingGoogle || !customIndexUrls.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent-primary py-2.5 px-4 font-bold text-white shadow-sm hover:bg-accent-primary/90 transition disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Custom URLs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
