"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  SearchCheck,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
} from "lucide-react";
import { SeoAuditIssue, SeoIssueCategory, SeoIssueStatus } from "@/lib/seo/auditEngine";
import { SITE_URL } from "@/lib/utils";

interface Props {
  onOpenInspector: (url: string) => void;
  onEditPageOverride?: (pathname: string) => void;
}

export function SeoAuditManager({ onOpenInspector, onEditPageOverride }: Props) {
  const [issues, setIssues] = useState<SeoAuditIssue[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    dismissed: 0,
    highPriority: 0,
    uniqueUrls: 0,
    categories: {
      metadata: 0,
      content: 0,
      schema: 0,
      crawlability: 0,
      backlinks: 0,
      general: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [isSeedingDefault, setIsSeedingDefault] = useState(false);
  const [selectedIssueForFix, setSelectedIssueForFix] = useState<SeoAuditIssue | null>(null);
  const [applyingFixId, setApplyingFixId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, selectedStatus]);

  async function fetchIssues() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/seo/audit?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setIssues(data.issues || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Failed to load audit issues", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedbackMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/seo/audit/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({
          type: "success",
          text: `Successfully ingested ${data.totalParsed} recommendations from "${file.name}"!`,
        });
        fetchIssues();
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Failed to upload audit file",
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSeedDefault() {
    setIsSeedingDefault(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/admin/seo/audit/seed-default", {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({
          type: "success",
          text: data.message || "Loaded default SEMrush audit ideas!",
        });
        fetchIssues();
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || "Could not access default audit file",
        });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Seed failed" });
    } finally {
      setIsSeedingDefault(false);
    }
  }

  async function handleApplyFix(issue: SeoAuditIssue) {
    setApplyingFixId(issue.id);
    try {
      const res = await fetch(`/api/admin/seo/audit/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_fix", status: "resolved" }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({
          type: "success",
          text: `Applied fix for ${issue.pathname}: Updated metadata & marked resolved!`,
        });
        setSelectedIssueForFix(null);
        fetchIssues();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to apply fix" });
      }
    } catch (e: any) {
      setFeedbackMsg({ type: "error", text: e.message || "Error applying fix" });
    } finally {
      setApplyingFixId(null);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: SeoIssueStatus) {
    try {
      const res = await fetch(`/api/admin/seo/audit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchIssues();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleClearAll() {
    if (!confirm("Are you sure you want to clear all imported audit issues?")) return;
    try {
      await fetch("/api/admin/seo/audit", { method: "DELETE" });
      fetchIssues();
    } catch (e) {
      console.error(e);
    }
  }

  const categoryPills = [
    { id: "all", label: "All Categories", count: metrics.total },
    { id: "metadata", label: "Meta & Tags", count: metrics.categories.metadata },
    { id: "content", label: "Content & Dwell", count: metrics.categories.content },
    { id: "schema", label: "Structured Data", count: metrics.categories.schema },
    { id: "crawlability", label: "Crawlability", count: metrics.categories.crawlability },
    { id: "backlinks", label: "Backlinks", count: metrics.categories.backlinks },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ideas</span>
            <Layers className="h-4 w-4 text-purple" />
          </div>
          <div className="text-2xl font-extrabold text-navy mt-2">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">{metrics.uniqueUrls} unique URLs audited</div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Open Issues</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{metrics.open}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending optimization</div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{metrics.resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">Fixes applied or verified</div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">High Priority</span>
            <Sparkles className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{metrics.highPriority}</div>
          <div className="text-[11px] text-slate-500 mt-1">Score ≥ 2.0 (Urgent impact)</div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dismissed</span>
            <X className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-600 mt-2">{metrics.dismissed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ignored suggestions</div>
        </div>
      </div>

      {/* Action Bar & Importers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple" />
            Audit Recommendation Importer
          </h3>
          <p className="text-xs text-slate-500">
            Import SEMrush On-Page SEO Checker or Ahrefs exports (.xlsx / .csv) to auto-generate title, H1, meta, and schema fixes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Audit File"}
          </button>

          <button
            onClick={handleSeedDefault}
            disabled={isSeedingDefault}
            className="inline-flex items-center gap-2 rounded-xl bg-lavender px-4 py-2.5 text-xs font-bold text-purple hover:bg-purple/15 transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-purple" />
            {isSeedingDefault ? "Loading..." : "Load Oct 2026 Audit Ideas"}
          </button>

          {issues.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition"
              title="Clear all audit issues"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-semibold ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category Pills & Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categoryPills.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedCategory === c.id
                  ? "bg-purple text-white shadow-sm"
                  : "bg-white text-navy/70 border border-slate-200 hover:border-purple/30"
              }`}
            >
              <span>{c.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedCategory === c.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Status Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, URL, or idea..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1">
              {(["all", "open", "resolved", "dismissed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                    selectedStatus === st
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-navy"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchIssues}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-purple transition"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit recommendations...</div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-navy">No Issues Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No audit recommendations match your filters. Upload an audit file or click "Load Oct 2026 Audit Ideas" to view recommendations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Target Keyword & URL</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Recommendation / Issue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {issues.map((issue) => {
                  const pri = Number(issue.priority);
                  const isHigh = pri >= 2.0;
                  const isResolved = issue.status === "resolved";

                  return (
                    <tr
                      key={issue.id}
                      className={`hover:bg-slate-50/60 transition ${
                        isResolved ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            pri >= 5.0
                              ? "bg-rose-100 text-rose-700"
                              : pri >= 1.0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pri.toFixed(2)}
                        </span>
                      </td>

                      {/* Keyword & URL */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-navy truncate">
                          {issue.target_keyword || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate mt-0.5">
                          <span className="font-mono">{issue.pathname}</span>
                          <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple hover:underline"
                            title="Visit live page"
                          >
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            issue.category === "metadata"
                              ? "bg-indigo-50 text-indigo-700"
                              : issue.category === "content"
                              ? "bg-sky-50 text-sky-700"
                              : issue.category === "schema"
                              ? "bg-emerald-50 text-emerald-700"
                              : issue.category === "crawlability"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {issue.category}
                        </span>
                      </td>

                      {/* Issue Description & Fix Preview */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-slate-700 leading-relaxed">{issue.issue_text}</p>
                        {issue.suggested_fix?.actionDescription && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-purple">
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span>Fix: {issue.suggested_fix.actionDescription}</span>
                          </div>
                        )}
                        {issue.suggested_fix?.extractedKeywords && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {issue.suggested_fix.extractedKeywords.slice(0, 5).map((kw, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-lavender/60 px-1.5 py-0.2 text-[10px] text-purple font-medium"
                              >
                                {kw}
                              </span>
                            ))}
                            {issue.suggested_fix.extractedKeywords.length > 5 && (
                              <span className="text-[10px] text-slate-400">
                                +{issue.suggested_fix.extractedKeywords.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                        {/* Inspect on Google */}
                        <button
                          onClick={() => onOpenInspector(issue.url)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-purple hover:border-purple/30 transition"
                          title="Inspect live URL on Google Search Console"
                        >
                          <SearchCheck className="h-3 w-3" />
                          Inspect
                        </button>

                        {/* Apply Fix */}
                        {issue.suggested_fix?.field && issue.suggested_fix.field !== "general" && issue.suggested_fix.field !== "backlinks" && (
                          <button
                            onClick={() => setSelectedIssueForFix(issue)}
                            disabled={isResolved || applyingFixId === issue.id}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              isResolved
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-purple text-white shadow-sm hover:bg-purple/90"
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            {applyingFixId === issue.id ? "Applying..." : "Apply Fix"}
                          </button>
                        )}

                        {/* Status Toggle */}
                        {issue.status === "open" ? (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "resolved")}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                            title="Mark as Resolved"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "open")}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-navy transition"
                            title="Reopen issue"
                          >
                            Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Diff Modal for 1-Click Fix */}
      {selectedIssueForFix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple/10 text-purple font-bold">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-navy">1-Click Auto-Fix Preview</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedIssueForFix.pathname}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssueForFix(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  SEMrush Audit Finding
                </label>
                <div className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-700 leading-relaxed border border-slate-200">
                  {selectedIssueForFix.issue_text}
                </div>
              </div>

              <div>
                <label className="font-bold text-purple uppercase tracking-wider text-[10px]">
                  Synthesized Page Fix & Target Value
                </label>
                <div className="mt-1 rounded-xl bg-lavender/40 p-3.5 text-navy border border-purple/20 space-y-2">
                  <div className="font-semibold text-purple">
                    Target Field: <span className="font-mono uppercase">{selectedIssueForFix.suggested_fix?.field}</span>
                  </div>
                  {selectedIssueForFix.suggested_fix?.recommendedValue && (
                    <div className="bg-white p-2.5 rounded-lg border border-purple/15 font-medium">
                      {selectedIssueForFix.suggested_fix.recommendedValue}
                    </div>
                  )}
                  {selectedIssueForFix.suggested_fix?.extractedKeywords && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">
                        Semantic Keywords to inject:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedIssueForFix.suggested_fix.extractedKeywords.map((k, i) => (
                          <span
                            key={i}
                            className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold text-purple border border-purple/20"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedIssueForFix.suggested_fix?.suggestedSchemaType && (
                    <div className="text-[11px] text-slate-600">
                      Injects <span className="font-bold">{selectedIssueForFix.suggested_fix.suggestedSchemaType}</span> Schema with AggregateRating (4.9 / 5.0 stars)
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-800 text-[11px] leading-relaxed border border-amber-200">
                Applying this fix creates or updates the live database override in <code>seo_page_overrides</code> and automatically marks the issue as resolved.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedIssueForFix(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyFix(selectedIssueForFix)}
                disabled={applyingFixId === selectedIssueForFix.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {applyingFixId === selectedIssueForFix.id ? "Applying..." : "Confirm & Apply Fix"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
