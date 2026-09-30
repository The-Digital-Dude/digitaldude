"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  Loader2,
  Columns,
  Maximize2,
  Smartphone,
  Monitor,
  Tag,
  Check,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { StatRow } from "@/components/StatRow";

export interface CaseStudyFormData {
  title: string;
  slug: string;
  industry: string;
  tag: string;
  summary: string;
  status: "Live" | "Delivered" | "Draft";
  image: string;
  image_alt: string;
  headline: string;
  page_summary: string;
  stats: string[];
  challenge: string;
  what_we_built: string[];
  what_changed: string;
  what_changed_label: string;
  built_with: string;
  related: string[];
}

const DEFAULT_INDUSTRIES = [
  "Property",
  "Travel",
  "Community",
  "Home services",
  "Logistics",
  "Recruitment",
  "Education",
  "Custom Software",
  "E-Commerce",
  "Fintech",
  "Healthcare",
];

const INITIAL_FORM_STATE: CaseStudyFormData = {
  title: "",
  slug: "",
  industry: "Property",
  tag: "Property · System",
  summary: "",
  status: "Live",
  image: "/images/case-studies/property-compliance.svg",
  image_alt: "",
  headline: "",
  page_summary: "",
  stats: [
    "4,000+ units under management",
    "30+ agencies active",
    "4x faster turnaround",
  ],
  challenge: "",
  what_we_built: [
    "Client Portal: Property managers log in, submit new jobs, and download certificates on demand.",
    "Mobile App: Field routes, digital checklists, and mandatory photo proof on-site.",
    "Operations Control Room: Central dispatcher assigns jobs with location-based grouping.",
  ],
  what_changed: "",
  what_changed_label: "What changed",
  built_with: "Next.js 16, TypeScript, Supabase PostgreSQL, Tailwind CSS",
  related: [],
};

interface CaseStudyEditorProps {
  mode: "create" | "edit";
  caseStudyId?: string;
}

export function CaseStudyEditor({ mode, caseStudyId }: CaseStudyEditorProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState<CaseStudyFormData>(INITIAL_FORM_STATE);
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [industries] = useState<string[]>(DEFAULT_INDUSTRIES);

  // Load existing case study data in edit mode
  useEffect(() => {
    if (mode === "edit" && caseStudyId) {
      async function loadCaseStudy() {
        try {
          const res = await fetch(`/api/admin/case-studies/${caseStudyId}`);
          const data = await res.json();
          if (data.ok && data.caseStudy) {
            const cs = data.caseStudy;
            setFormData({
              title: cs.title || "",
              slug: cs.slug || "",
              industry: cs.industry || "Property",
              tag: cs.tag || "",
              summary: cs.summary || "",
              status: cs.status || "Live",
              image: cs.image || "/images/case-studies/property-compliance.svg",
              image_alt: cs.image_alt || cs.imageAlt || "",
              headline: cs.headline || "",
              page_summary: cs.page_summary || cs.pageSummary || "",
              stats: Array.isArray(cs.stats) ? cs.stats : [],
              challenge: cs.challenge || "",
              what_we_built: Array.isArray(cs.what_we_built)
                ? cs.what_we_built
                : Array.isArray(cs.whatWeBuilt)
                ? cs.whatWeBuilt
                : [],
              what_changed: cs.what_changed || cs.whatChanged || "",
              what_changed_label: cs.what_changed_label || cs.whatChangedLabel || "What changed",
              built_with: cs.built_with || cs.builtWith || "",
              related: Array.isArray(cs.related) ? cs.related : [],
            });

            if (cs.industry && !DEFAULT_INDUSTRIES.includes(cs.industry)) {
              setIsCustomIndustry(true);
            }
          } else {
            setError(data.error || "Failed to load case study.");
          }
        } catch (err) {
          setError((err as Error).message || "An error occurred fetching data.");
        } finally {
          setLoading(false);
        }
      }
      loadCaseStudy();
    }
  }, [mode, caseStudyId]);

  // Title -> Slug Auto Generation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      title,
      slug: mode === "create" ? generatedSlug : prev.slug || generatedSlug,
      headline: prev.headline || title,
    }));
  };

  // Stat handlers
  const handleAddStat = () => {
    setFormData((prev) => ({ ...prev, stats: [...prev.stats, ""] }));
  };
  const handleStatChange = (index: number, val: string) => {
    const newStats = [...formData.stats];
    newStats[index] = val;
    setFormData((prev) => ({ ...prev, stats: newStats }));
  };
  const handleRemoveStat = (index: number) => {
    setFormData((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
  };

  // What We Built handlers
  const handleAddBuiltFeature = () => {
    setFormData((prev) => ({ ...prev, what_we_built: [...prev.what_we_built, ""] }));
  };
  const handleBuiltFeatureChange = (index: number, val: string) => {
    const newFeatures = [...formData.what_we_built];
    newFeatures[index] = val;
    setFormData((prev) => ({ ...prev, what_we_built: newFeatures }));
  };
  const handleRemoveBuiltFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      what_we_built: prev.what_we_built.filter((_, i) => i !== index),
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setSaving(true);

    if (!formData.title || !formData.slug) {
      setError("Title and Slug are required.");
      setSaving(false);
      return;
    }

    try {
      const url = mode === "create" ? "/api/admin/case-studies" : `/api/admin/case-studies/${caseStudyId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        stats: formData.stats.filter((s) => s.trim().length > 0),
        what_we_built: formData.what_we_built.filter((w) => w.trim().length > 0),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to save case study.");
      } else {
        setSuccessNotice(
          mode === "create"
            ? "Case study created successfully! Redirecting…"
            : "Case study saved successfully!"
        );
        if (mode === "create") {
          setTimeout(() => {
            router.push("/admin/case-studies");
          }, 1200);
        }
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler (edit mode only)
  const handleDelete = async () => {
    if (!caseStudyId || !confirm(`Are you sure you want to permanently delete "${formData.title}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/case-studies/${caseStudyId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        router.push("/admin/case-studies");
      } else {
        setError(data.error || "Failed to delete case study.");
      }
    } catch (err) {
      setError((err as Error).message || "Error deleting case study.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="animate-spin text-purple" size={32} />
        <p className="text-sm text-navy/60">Loading case study editor…</p>
      </div>
    );
  }

  // Parse tech stack tags for preview
  const techStackList = formData.built_with
    ? formData.built_with.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Action & Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/case-studies"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-navy/70 hover:bg-purple/10 hover:text-purple transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-navy">
                {mode === "create" ? "Create New Case Study" : `Editing: ${formData.title || "Untitled"}`}
              </h1>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  formData.status === "Live"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : formData.status === "Delivered"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {formData.status}
              </span>
            </div>
            <p className="text-xs text-navy/50 font-mono">
              /work/{formData.slug || "slug-preview"}
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-navy/70">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "edit" ? "bg-white text-navy shadow-2xs font-bold" : "hover:text-navy"
              }`}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition hidden md:inline-flex ${
                viewMode === "split" ? "bg-white text-navy shadow-2xs font-bold" : "hover:text-navy"
              }`}
            >
              <Columns size={13} /> Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "preview" ? "bg-white text-navy shadow-2xs font-bold" : "hover:text-navy"
              }`}
            >
              <Eye size={13} /> Preview
            </button>
          </div>

          {mode === "edit" && formData.slug && (
            <Link
              href={`/work/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-100 transition"
            >
              <ExternalLink size={13} /> View Live
            </Link>
          )}

          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
            >
              <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple/90 transition shadow-xs disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Case Study"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div
        className={`grid gap-6 ${
          viewMode === "split"
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* ================================================================= */}
        {/* LEFT COLUMN: EDITOR FORM (Visible in 'edit' and 'split' modes) */}
        {/* ================================================================= */}
        {(viewMode === "edit" || viewMode === "split") && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Core Identification Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/50 flex items-center gap-2">
                <Briefcase size={14} className="text-purple" /> General Metadata
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Property Compliance Platform"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g. property-compliance-crm"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono text-navy outline-none focus:border-purple focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, status: e.target.value as "Live" | "Delivered" | "Draft" }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                    >
                      <option value="Live">🟢 Live Production</option>
                      <option value="Delivered">🔵 Delivered / Shipped</option>
                      <option value="Draft">🟡 Internal Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70">
                        Industry
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomIndustry((v) => !v)}
                        className="text-[10px] text-purple hover:underline font-semibold"
                      >
                        {isCustomIndustry ? "Choose standard" : "+ Custom Industry"}
                      </button>
                    </div>
                    {isCustomIndustry ? (
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                        placeholder="Enter custom industry"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                      />
                    ) : (
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                      >
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                      Tag Badge (Subtext)
                    </label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                      placeholder="e.g. Property · Australia"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Headline, Summary & Built With */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/50 flex items-center gap-2">
                <Sparkles size={14} className="text-purple" /> Headline &amp; Narrative
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                    placeholder="e.g. End-to-end smoke alarm and compliance tracking for 3,500 rental properties"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Page Summary (Lead Paragraph &amp; SEO Meta)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.page_summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, page_summary: e.target.value }))}
                    placeholder="High-level narrative explaining what the system does for the client…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Built With (Tech Stack)
                  </label>
                  <input
                    type="text"
                    value={formData.built_with}
                    onChange={(e) => setFormData((prev) => ({ ...prev, built_with: e.target.value }))}
                    placeholder="e.g. Next.js 16, TypeScript, Supabase PostgreSQL, Tailwind CSS"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
                  />
                </div>
              </div>
            </div>

            {/* KPI Metric Highlights Builder */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy/50 flex items-center gap-2">
                  <Layers size={14} className="text-purple" /> Key Metric Highlights (Stat Row)
                </h3>
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="inline-flex items-center gap-1 text-xs text-purple font-bold hover:underline"
                >
                  <Plus size={13} /> Add Metric
                </button>
              </div>

              <div className="space-y-2">
                {formData.stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stat}
                      onChange={(e) => handleStatChange(idx, e.target.value)}
                      placeholder="e.g. 4,000+ rental properties under management"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-navy outline-none focus:border-purple"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStat(idx)}
                      className="rounded-lg p-2 text-navy/40 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Content: Challenge, What We Built, Outcome */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Detailed Case Study Sections
              </h3>

              <div className="space-y-4">
                {/* The Challenge */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    The Challenge
                  </label>
                  <textarea
                    rows={3}
                    value={formData.challenge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, challenge: e.target.value }))}
                    placeholder="Describe the operational friction and challenges the client faced before this project…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple"
                  />
                </div>

                {/* What We Built Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70">
                      What We Built (Deliverables &amp; Features)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBuiltFeature}
                      className="inline-flex items-center gap-1 text-xs text-purple font-bold hover:underline"
                    >
                      <Plus size={13} /> Add Feature
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.what_we_built.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={feature}
                          onChange={(e) => handleBuiltFeatureChange(idx, e.target.value)}
                          placeholder="Agency Portal: Property managers log in, submit new jobs, and download certificates."
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy outline-none focus:border-purple"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBuiltFeature(idx)}
                          className="rounded-lg p-2 text-navy/40 hover:bg-red-50 hover:text-red-600 transition mt-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What Changed / Outcomes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    What Changed (Business Impact &amp; Results)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.what_changed}
                    onChange={(e) => setFormData((prev) => ({ ...prev, what_changed: e.target.value }))}
                    placeholder="Describe the quantifiable results, turnaround speed, and operational scaling achieved…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple"
                  />
                </div>
              </div>
            </div>

            {/* Featured Image & Mockup Asset */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/50">
                Featured Mockup Asset
              </h3>
              <ImageUploader
                value={formData.image}
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                label="Mockup SVG / WebP Image"
              />
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* RIGHT COLUMN: REAL-TIME LIVE MOCKUP PREVIEW */}
        {/* ================================================================= */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1.5">
                <Eye size={14} className="text-purple" /> Live Client Preview
              </span>
              <span className="text-[11px] text-navy/50 font-mono">/work/{formData.slug || "example-slug"}</span>
            </div>

            {/* Simulated Live Viewport Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
              {/* Fake Browser Toolbar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1 text-[11px] text-navy/60 font-mono truncate">
                  https://digitaldude.co.uk/work/{formData.slug || "slug-preview"}
                </div>
              </div>

              {/* Rendered Case Study Template Mockup */}
              <div className="p-6 sm:p-8 space-y-8 max-h-[85vh] overflow-y-auto">
                {/* Hero Section */}
                <div className="space-y-3 border-b border-slate-100 pb-6">
                  <span className="text-xs font-bold uppercase tracking-wide text-purple">
                    {formData.tag || `${formData.industry} · System`} · {formData.status}
                  </span>
                  <h1 className="text-2xl font-extrabold text-navy sm:text-3xl leading-tight">
                    {formData.headline || formData.title || "Project Headline Goes Here"}
                  </h1>
                  <p className="text-sm text-navy/70 leading-relaxed">
                    {formData.page_summary || "High-level summary of the architectural scope and results…"}
                  </p>

                  {/* Tech Stack Pills in Preview */}
                  {techStackList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {techStackList.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-purple/10 text-purple border border-purple/20 px-2 py-0.5 text-[10px] font-bold"
                        >
                          <Tag size={10} /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Featured Mockup Asset Viewport */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-lavender flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image || "/images/case-studies/property-compliance.svg"}
                    alt={formData.image_alt || formData.title}
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* KPI Stat Row */}
                {formData.stats.filter(Boolean).length > 0 && (
                  <div className="pt-2">
                    <StatRow stats={formData.stats.filter(Boolean)} />
                  </div>
                )}

                {/* The Challenge */}
                {formData.challenge && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h2 className="text-lg font-bold text-navy">The challenge</h2>
                    <p className="text-xs sm:text-sm text-navy/70 leading-relaxed whitespace-pre-line">
                      {formData.challenge}
                    </p>
                  </div>
                )}

                {/* What We Built */}
                {formData.what_we_built.filter(Boolean).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h2 className="text-lg font-bold text-navy">What we built</h2>
                    <ul className="space-y-2">
                      {formData.what_we_built.filter(Boolean).map((item, idx) => {
                        const parts = item.split(":");
                        return (
                          <li key={idx} className="flex gap-2.5 text-xs sm:text-sm text-navy/70">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
                            <span>
                              {parts.length > 1 ? (
                                <>
                                  <strong className="font-bold text-navy">{parts[0]}:</strong>
                                  {parts.slice(1).join(":")}
                                </>
                              ) : (
                                item
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* What Changed */}
                {formData.what_changed && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h2 className="text-lg font-bold text-navy">What changed</h2>
                    <p className="text-xs sm:text-sm text-navy/70 leading-relaxed whitespace-pre-line">
                      {formData.what_changed}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
