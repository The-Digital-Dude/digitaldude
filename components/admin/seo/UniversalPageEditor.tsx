"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Sparkles,
  Save,
  Trash2,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Search,
  Code,
  Tag,
  Eye,
  Check,
  X,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface Props {
  initialPathname?: string;
  onSaved?: () => void;
}

const COMMON_ROUTES = [
  { label: "Homepage", path: "/" },
  { label: "Services: CRM Development", path: "/services/crm-development" },
  { label: "Services: SaaS Development", path: "/services/saas-development" },
  { label: "Services: Web Applications", path: "/services/website-development" },
  { label: "Services: Marketplace Apps", path: "/services/marketplace-development" },
  { label: "Industries: Property & Deeds", path: "/industries/property" },
  { label: "Industries: Fleet Logistics", path: "/industries/logistics" },
  { label: "Locations: Birmingham CRM", path: "/locations/birmingham/crm-development" },
  { label: "Locations: Bristol Web Dev", path: "/locations/bristol/website-development" },
  { label: "Locations: London CRM", path: "/locations/london/crm-development" },
  { label: "Solutions: Community SaaS", path: "/solutions/community/saas-development" },
  { label: "Solutions: Logistics CRM", path: "/solutions/logistics/crm-development" },
  { label: "Blog: CRM Switch Guide", path: "/blog/off-the-shelf-crm-vs-custom-crm" },
  { label: "Blog: 3 Sided Marketplace", path: "/blog/how-to-build-a-three-sided-marketplace-app" },
  { label: "Blog: AI Features Real ROI", path: "/blog/ai-features-real-vs-pitch-line" },
];

export function UniversalPageEditor({ initialPathname = "/", onSaved }: Props) {
  const [pathname, setPathname] = useState(initialPathname);
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [h1, setH1] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [semanticKeywords, setSemanticKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [schemaJson, setSchemaJson] = useState("");
  const [status, setStatus] = useState<"published" | "draft" | "disabled">("published");

  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [existingOverrideId, setExistingOverrideId] = useState<string | null>(null);

  useEffect(() => {
    loadRouteMetadata(pathname);
  }, [pathname]);

  async function loadRouteMetadata(path: string) {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/seo/overrides?pathname=${encodeURIComponent(path)}`);
      const data = await res.json();

      if (data.ok && data.overrides && data.overrides.length > 0) {
        const item = data.overrides[0];
        setExistingOverrideId(item.id);
        setTitle(item.title || "");
        setMetaDescription(item.meta_description || "");
        setH1(item.h1 || "");
        setTargetKeyword(item.target_keyword || "");
        setSemanticKeywords(item.semantic_keywords || []);
        setCanonicalUrl(item.canonical_url || "");
        setNoindex(Boolean(item.noindex));
        setSchemaJson(item.custom_schema ? JSON.stringify(item.custom_schema, null, 2) : "");
        setStatus(item.status || "published");
      } else {
        // Reset or use defaults
        setExistingOverrideId(null);
        setTitle("");
        setMetaDescription("");
        setH1("");
        setTargetKeyword("");
        setSemanticKeywords([]);
        setCanonicalUrl("");
        setNoindex(false);
        setSchemaJson("");
        setStatus("published");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);

    try {
      let parsedSchema = undefined;
      if (schemaJson.trim()) {
        try {
          parsedSchema = JSON.parse(schemaJson);
        } catch {
          alert("Invalid JSON format in Structured Data Schema");
          setSaving(false);
          return;
        }
      }

      const res = await fetch("/api/admin/seo/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingOverrideId || undefined,
          pathname,
          title,
          meta_description: metaDescription,
          h1,
          target_keyword: targetKeyword,
          semantic_keywords: semanticKeywords,
          canonical_url: canonicalUrl,
          noindex,
          custom_schema: parsedSchema,
          status,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSaveSuccess(true);
        if (data.override?.id) setExistingOverrideId(data.override.id);
        if (onSaved) onSaved();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save override");
      }
    } catch (e: any) {
      alert(e.message || "Error saving override");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingOverrideId) return;
    if (!confirm(`Delete custom override for ${pathname}? Page will revert to code default.`)) return;

    try {
      const res = await fetch(`/api/admin/seo/overrides/${existingOverrideId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadRouteMetadata(pathname);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleAddSemanticKeyword(e: React.KeyboardEvent) {
    if (e.key === "Enter" && newKeywordInput.trim()) {
      e.preventDefault();
      const word = newKeywordInput.trim();
      if (!semanticKeywords.includes(word)) {
        setSemanticKeywords([...semanticKeywords, word]);
      }
      setNewKeywordInput("");
    }
  }

  function handleRemoveSemanticKeyword(word: string) {
    setSemanticKeywords(semanticKeywords.filter((w) => w !== word));
  }

  // --- Real-Time On-Page SEO Health Scoring ---
  const kw = targetKeyword.toLowerCase().trim();
  const checks = [
    {
      label: "Title Length (50–65 characters)",
      pass: title.length >= 45 && title.length <= 68,
      detail: `${title.length} characters`,
    },
    {
      label: "Target Keyword in <title>",
      pass: kw.length > 0 && title.toLowerCase().includes(kw),
      detail: kw ? (title.toLowerCase().includes(kw) ? "Found" : "Missing") : "No keyword set",
    },
    {
      label: "Meta Description Length (120–160 characters)",
      pass: metaDescription.length >= 115 && metaDescription.length <= 165,
      detail: `${metaDescription.length} characters`,
    },
    {
      label: "Target Keyword in Meta Description",
      pass: kw.length > 0 && metaDescription.toLowerCase().includes(kw),
      detail: kw ? (metaDescription.toLowerCase().includes(kw) ? "Found" : "Missing") : "No keyword set",
    },
    {
      label: "Single <h1> Tag Configured",
      pass: h1.length >= 10,
      detail: h1 ? "Configured" : "Empty",
    },
    {
      label: "Target Keyword in <h1> Header",
      pass: kw.length > 0 && h1.toLowerCase().includes(kw),
      detail: kw ? (h1.toLowerCase().includes(kw) ? "Found" : "Missing") : "No keyword set",
    },
    {
      label: "Semantic Related Keywords (≥ 3 added)",
      pass: semanticKeywords.length >= 3,
      detail: `${semanticKeywords.length} terms`,
    },
  ];

  const passedCount = checks.filter((c) => c.pass).length;
  const healthScore = Math.round((passedCount / checks.length) * 100);

  const displayTitle = title || "The Digital Dude | Software Engineering Studio";
  const displayDesc =
    metaDescription ||
    "We design, architect, and build bespoke CRMs, multi-tenant SaaS platforms, and operational systems for high-growth service businesses.";

  return (
    <div className="space-y-6">
      {/* Route Selector & Breadcrumb */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/10 text-purple font-bold">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">Universal Page Optimizer</h3>
            <p className="text-xs text-slate-500">
              Customize title, description, H1, keywords & schema for any route on digitaldude.co.uk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-72">
            <select
              value={pathname}
              onChange={(e) => setPathname(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy focus:border-purple focus:outline-none"
            >
              <optgroup label="Core & Flagship Routes">
                {COMMON_ROUTES.map((r) => (
                  <option key={r.path} value={r.path}>
                    {r.label} ({r.path})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Or enter /any/custom/path"
              value={pathname}
              onChange={(e) => setPathname(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-navy focus:border-purple focus:outline-none w-48 hidden lg:block"
            />
            <a
              href={`${SITE_URL}${pathname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-purple transition"
              title="View live page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Metadata Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple" />
                Metadata & Search Attributes
              </h4>
              <div className="flex items-center gap-2">
                {existingOverrideId && (
                  <span className="rounded-md bg-purple/10 px-2 py-0.5 text-[10px] font-bold text-purple">
                    Custom DB Override Active
                  </span>
                )}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="rounded-lg border border-slate-200 text-xs font-semibold px-2 py-1 bg-slate-50"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Target Keyword */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy">Primary Target Keyword</label>
                <span className="text-[10px] text-slate-400">Used for SEO validation</span>
              </div>
              <input
                type="text"
                placeholder="e.g. crm development company, deeds management software"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
              />
            </div>

            {/* Page Title */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy">HTML &lt;title&gt; Tag</label>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    title.length >= 50 && title.length <= 65
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {title.length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                placeholder="Page Title | Digital Dude"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
              />
            </div>

            {/* <h1> Tag */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy">Primary &lt;h1&gt; Tag</label>
                <span className="text-[10px] text-slate-400">Single main heading</span>
              </div>
              <input
                type="text"
                placeholder="Bespoke CRM Development for High-Growth Businesses"
                value={h1}
                onChange={(e) => setH1(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy">Meta Description</label>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    metaDescription.length >= 120 && metaDescription.length <= 160
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  {metaDescription.length} / 155 chars
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Concise, high-converting summary of page content for search engine snippets..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
              />
            </div>

            {/* Semantic Keywords Tag Input */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy">Semantically Related Keywords</label>
                <span className="text-[10px] text-slate-400">Press Enter to add term</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 p-2 min-h-12 bg-white">
                {semanticKeywords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 rounded-lg bg-lavender px-2 py-1 text-[11px] font-medium text-purple"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => handleRemoveSemanticKeyword(word)}
                      className="text-purple/60 hover:text-purple"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={semanticKeywords.length === 0 ? "Type related term & press Enter..." : "Add more..."}
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={handleAddSemanticKeyword}
                  className="flex-1 min-w-32 bg-transparent text-xs text-navy placeholder:text-slate-400 focus:outline-none px-1"
                />
              </div>
            </div>

            {/* Structured Data (Schema.org JSON-LD) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-purple" />
                  Custom JSON-LD Schema (Optional)
                </label>
                <span className="text-[10px] text-slate-400">Overrides default schema</span>
              </div>
              <textarea
                rows={3}
                placeholder='{ "@context": "https://schema.org", "@type": "Service", ... }'
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none bg-slate-50"
              />
            </div>

            {/* Save Buttons & Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {existingOverrideId && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Reset to Code Default
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved!
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Page Override"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Health Score & SERP Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 0-100 SEO Health Score Gauge */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple" />
                Live On-Page SEO Health
              </h4>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  healthScore >= 80
                    ? "bg-emerald-100 text-emerald-700"
                    : healthScore >= 50
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {healthScore} / 100
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  healthScore >= 80 ? "bg-emerald-500" : healthScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-1">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    {c.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className={c.pass ? "text-slate-800 font-medium" : "text-slate-500"}>
                      {c.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{c.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Google SERP Snippet Preview */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple" />
                Google SERP Preview
              </h4>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-slate-500">
                <button
                  onClick={() => setDevicePreview("desktop")}
                  className={`rounded-md p-1 transition ${
                    devicePreview === "desktop" ? "bg-white text-navy shadow-xs font-bold" : ""
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDevicePreview("mobile")}
                  className={`rounded-md p-1 transition ${
                    devicePreview === "mobile" ? "bg-white text-navy shadow-xs font-bold" : ""
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Google Result Card Simulation */}
            <div
              className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm font-sans ${
                devicePreview === "mobile" ? "max-w-xs mx-auto" : ""
              }`}
            >
              {/* Site URL & Favicon */}
              <div className="flex items-center gap-2 text-[12px] text-slate-700">
                <div className="h-4 w-4 rounded-full bg-purple flex items-center justify-center text-[10px] text-white font-bold">
                  D
                </div>
                <div className="truncate">
                  <div className="text-[12px] font-medium leading-none text-slate-800">The Digital Dude</div>
                  <div className="text-[11px] text-slate-500 leading-none mt-0.5 truncate font-mono">
                    https://www.digitaldude.co.uk{pathname}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="mt-2 text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                {displayTitle}
              </div>

              {/* Star Rating Rich Snippet */}
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                <span className="text-amber-500 font-bold">★★★★★</span>
                <span className="font-semibold">Rating: 4.9</span>
                <span className="text-slate-400">· 29 reviews</span>
              </div>

              {/* Meta Description */}
              <div className="mt-1.5 text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {displayDesc}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
