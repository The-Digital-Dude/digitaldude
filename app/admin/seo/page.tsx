"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SeoAuditManager } from "@/components/admin/seo/SeoAuditManager";
import { UniversalPageEditor } from "@/components/admin/seo/UniversalPageEditor";
import { IndexingHub } from "@/components/admin/seo/IndexingHub";
import { PseoBulkImportModal } from "@/components/admin/pseo/PseoBulkImportModal";
import { PseoEditModal } from "@/components/admin/pseo/PseoEditModal";
import { PseoPageData } from "@/lib/pseo/types";
import {
  Globe,
  FileSpreadsheet,
  SlidersHorizontal,
  Zap,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Plus,
  Upload,
  Gauge,
  SearchCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { SITE_URL } from "@/lib/utils";

function AdminSeoDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") || "audit";
  const [activeTab, setActiveTab] = useState<"audit" | "pages" | "pseo" | "indexing">(
    (tabParam as any) || "audit"
  );

  const [inspectModalUrl, setInspectModalUrl] = useState<string | null>(null);
  const [editorInitialPath, setEditorInitialPath] = useState<string>("/");

  // --- pSEO Tab State ---
  const [pseoPages, setPseoPages] = useState<PseoPageData[]>([]);
  const [pseoMetrics, setPseoMetrics] = useState({
    total: 0,
    locations: 0,
    solutions: 0,
    comparisons: 0,
    custom: 0,
    dbOverrides: 0,
  });
  const [pseoLoading, setPseoLoading] = useState(true);
  const [pseoSearch, setPseoSearch] = useState("");
  const [pseoCategoryFilter, setPseoCategoryFilter] = useState("all");
  const [pseoStatusFilter, setPseoStatusFilter] = useState("all");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingPseoPage, setEditingPseoPage] = useState<PseoPageData | null>(null);

  useEffect(() => {
    if (tabParam && ["audit", "pages", "pseo", "indexing"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === "pseo") {
      fetchPseoPages();
    }
  }, [activeTab, pseoCategoryFilter, pseoStatusFilter]);

  async function fetchPseoPages() {
    setPseoLoading(true);
    try {
      const params = new URLSearchParams();
      if (pseoSearch) params.set("search", pseoSearch);
      if (pseoCategoryFilter !== "all") params.set("category", pseoCategoryFilter);
      if (pseoStatusFilter !== "all") params.set("status", pseoStatusFilter);

      const res = await fetch(`/api/admin/pseo?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setPseoPages(data.pages || []);
        if (data.metrics) setPseoMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPseoLoading(false);
    }
  }

  function handleTabChange(tab: "audit" | "pages" | "pseo" | "indexing") {
    setActiveTab(tab);
    router.replace(`/admin/seo?tab=${tab}`);
  }

  function handleOpenInspector(url: string) {
    setInspectModalUrl(url);
    handleTabChange("indexing");
  }

  function handleEditPageOverride(pathname: string) {
    setEditorInitialPath(pathname);
    handleTabChange("pages");
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 md:p-10 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple text-white shadow-sm">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">
                  SEO Engine Command Center
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Universal metadata overrides, SEMrush audit ingestion, pSEO landing pages & Google Search Console indexing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${SITE_URL}/sitemap.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-purple transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Live Sitemap
            </a>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px overflow-x-auto">
          <button
            onClick={() => handleTabChange("audit")}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === "audit"
                ? "border-purple text-purple bg-lavender/30"
                : "border-transparent text-slate-500 hover:text-navy hover:bg-slate-50"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Audits & Recommendations</span>
          </button>

          <button
            onClick={() => handleTabChange("pages")}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === "pages"
                ? "border-purple text-purple bg-lavender/30"
                : "border-transparent text-slate-500 hover:text-navy hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Universal Page Optimizer</span>
          </button>

          <button
            onClick={() => handleTabChange("pseo")}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === "pseo"
                ? "border-purple text-purple bg-lavender/30"
                : "border-transparent text-slate-500 hover:text-navy hover:bg-slate-50"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Programmatic SEO (pSEO)</span>
          </button>

          <button
            onClick={() => handleTabChange("indexing")}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-bold transition border-b-2 ${
              activeTab === "indexing"
                ? "border-purple text-purple bg-lavender/30"
                : "border-transparent text-slate-500 hover:text-navy hover:bg-slate-50"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Indexing & Search Console</span>
          </button>
        </div>

        {/* TAB 1: Audits & Fixes */}
        {activeTab === "audit" && (
          <SeoAuditManager
            onOpenInspector={handleOpenInspector}
            onEditPageOverride={handleEditPageOverride}
          />
        )}

        {/* TAB 2: Universal Page Editor */}
        {activeTab === "pages" && (
          <UniversalPageEditor
            initialPathname={editorInitialPath}
            onSaved={() => {}}
          />
        )}

        {/* TAB 3: Programmatic SEO Matrix */}
        {activeTab === "pseo" && (
          <div className="space-y-6">
            {/* pSEO Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple" />
                  Programmatic Landing Page Clusters
                </h3>
                <p className="text-xs text-slate-500">
                  Manage Tier-1 indexable hubs, custom database overrides, and bulk generation across Locations, Solutions & Comparisons.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload CSV / JSON
                </button>

                <button
                  onClick={() => {
                    setEditingPseoPage({
                      slug: "new-page",
                      title: "New Programmatic Page",
                      category: "location",
                      status: "published",
                      city: "",
                      serviceSlug: "crm-development",
                    } as any);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Plus className="h-4 w-4" />
                  Create Single Page
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pages</div>
                <div className="text-2xl font-extrabold text-navy mt-2">{pseoMetrics.total}</div>
                <div className="text-[11px] text-slate-500 mt-1">Generated routes</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Locations</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-2">{pseoMetrics.locations}</div>
                <div className="text-[11px] text-slate-500 mt-1">City x Service hubs</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Solutions</div>
                <div className="text-2xl font-extrabold text-sky-600 mt-2">{pseoMetrics.solutions}</div>
                <div className="text-[11px] text-slate-500 mt-1">Industry x Service</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Comparisons</div>
                <div className="text-2xl font-extrabold text-purple mt-2">{pseoMetrics.comparisons}</div>
                <div className="text-[11px] text-slate-500 mt-1">Competitor vs Custom</div>
              </div>
              <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm col-span-2 md:col-span-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">DB Overrides</div>
                <div className="text-2xl font-extrabold text-indigo-600 mt-2">{pseoMetrics.dbOverrides}</div>
                <div className="text-[11px] text-slate-500 mt-1">Supabase customizations</div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search pSEO pages..."
                  value={pseoSearch}
                  onChange={(e) => setPseoSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPseoPages()}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={pseoCategoryFilter}
                  onChange={(e) => setPseoCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy focus:border-purple focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="location">Locations (/locations/...)</option>
                  <option value="solution">Solutions (/solutions/...)</option>
                  <option value="comparison">Comparisons (/compare/...)</option>
                </select>

                <select
                  value={pseoStatusFilter}
                  onChange={(e) => setPseoStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy focus:border-purple focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={fetchPseoPages}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-purple transition"
                >
                  <RefreshCw className={`h-4 w-4 ${pseoLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {pseoLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading pSEO pages...</div>
              ) : pseoPages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No pSEO pages found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Page / Path</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Target Keyword</th>
                        <th className="py-3 px-4">Indexation Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pseoPages.map((page) => (
                        <tr key={page.slug} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-bold text-navy truncate">{page.title}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>/{page.slug}</span>
                              <a
                                href={`${SITE_URL}/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple hover:underline"
                              >
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              {page.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                            {page.targetKeyword}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                page.isTier1
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {page.isTier1 ? "Tier-1 (Indexed)" : "Standard (Noindex)"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenInspector(`${SITE_URL}/${page.slug}`)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-purple transition"
                            >
                              <SearchCheck className="h-3 w-3" />
                              Inspect
                            </button>

                            <button
                              onClick={() => setEditingPseoPage(page)}
                              className="inline-flex items-center gap-1 rounded-lg bg-lavender px-2.5 py-1 text-[11px] font-bold text-purple hover:bg-purple/20 transition"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modals */}
            {isBulkModalOpen && (
              <PseoBulkImportModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSuccess={() => {
                  setIsBulkModalOpen(false);
                  fetchPseoPages();
                }}
              />
            )}

            {editingPseoPage && (
              <PseoEditModal
                page={editingPseoPage}
                isOpen={Boolean(editingPseoPage)}
                onClose={() => setEditingPseoPage(null)}
                onSuccess={() => {
                  setEditingPseoPage(null);
                  fetchPseoPages();
                }}
              />
            )}
          </div>
        )}

        {/* TAB 4: Indexing & Search Console */}
        {activeTab === "indexing" && (
          <IndexingHub
            initialInspectUrl={inspectModalUrl}
            onCloseInspect={() => setInspectModalUrl(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminSeoDashboard() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading SEO Engine...</div>}>
      <AdminSeoDashboardContent />
    </Suspense>
  );
}
