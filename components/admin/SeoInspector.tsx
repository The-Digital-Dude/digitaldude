"use client";

import React, { useState } from "react";
import {
  Globe,
  Smartphone,
  Monitor,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  Info,
  Link as LinkIcon,
  Image as ImageIcon,
  BookOpen,
  Zap,
  RefreshCw,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface SeoInspectorProps {
  title: string;
  metaTitle?: string;
  excerpt: string;
  metaDescription?: string;
  slug: string;
  content: string;
  coverImage?: string;
  category: string;
  author?: string;
  focusKeyword?: string;
  onFocusKeywordChange?: (keyword: string) => void;
  onApplyMeta?: (metaTitle: string, metaDescription: string) => void;
}

export function SeoInspector({
  title,
  metaTitle,
  excerpt,
  metaDescription,
  slug,
  content,
  coverImage,
  category,
  author = "The Digital Dude",
  focusKeyword = "",
  onFocusKeywordChange,
  onApplyMeta,
}: SeoInspectorProps) {
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [socialPreview, setSocialPreview] = useState<"google" | "social">("google");
  const [optimizing, setOptimizing] = useState(false);

  const displayTitle = (metaTitle || title || "Untitled Article").trim();
  const displayDesc = (
    metaDescription ||
    excerpt ||
    "Discover actionable insights, architecture breakdowns, and tech strategies on The Digital Dude blog."
  ).trim();
  const displaySlug = slug || "article-slug";

  // Word count & calculations
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const h2Count = (content.match(/^##\s+.+/gm) || []).length;
  const h3Count = (content.match(/^###\s+.+/gm) || []).length;

  // Title checks (Ideal 45 - 60 chars)
  const titleLen = displayTitle.length;
  const titleStatus: "good" | "warn" | "bad" =
    titleLen >= 40 && titleLen <= 60
      ? "good"
      : titleLen >= 25 && titleLen <= 70
      ? "warn"
      : "bad";

  // Description checks (Ideal 120 - 160 chars)
  const descLen = displayDesc.length;
  const descStatus: "good" | "warn" | "bad" =
    descLen >= 120 && descLen <= 160
      ? "good"
      : descLen >= 70 && descLen <= 180
      ? "warn"
      : "bad";

  // Focus keyword metrics
  const kw = focusKeyword.trim().toLowerCase();
  const kwTokens = kw.split(/\s+/).filter(Boolean);
  const kwInTitle = kw ? displayTitle.toLowerCase().includes(kw) : false;
  const kwInDesc = kw ? displayDesc.toLowerCase().includes(kw) : false;
  const kwInSlug = kw ? displaySlug.toLowerCase().includes(kw.replace(/\s+/g, "-")) : false;

  const kwOccurrences = kw
    ? (content.toLowerCase().match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length
    : 0;

  // Keyword density
  const kwWordCount = kwTokens.length || 1;
  const kwDensityPercent = words > 0 ? ((kwOccurrences * kwWordCount) / words) * 100 : 0;
  const densityStatus: "good" | "low" | "high" =
    kwDensityPercent >= 0.7 && kwDensityPercent <= 2.2
      ? "good"
      : kwDensityPercent < 0.7
      ? "low"
      : "high";

  // Internal & External links analysis
  const internalLinkMatches = content.match(/\[.*?\]\((\/.*?|https:\/\/.*?digitaldude\.co\.uk.*?)\)/g) || [];
  const internalLinkCount = internalLinkMatches.length;

  const externalLinkMatches = content.match(/\[.*?\]\((https?:\/\/(?!.*?digitaldude\.co\.uk).*?)\)/g) || [];
  const externalLinkCount = externalLinkMatches.length;

  // Image audit
  const inlineImages = content.match(/!\[(.*?)\]\((.*?)\)/g) || [];
  const missingAltCount = inlineImages.filter((img) => img.startsWith("![](")).length;

  // Surfer-Style SEO Score Calculation (0 - 100)
  let score = 0;
  if (titleLen >= 35 && titleLen <= 65) score += 15;
  else if (titleLen >= 20) score += 8;

  if (descLen >= 115 && descLen <= 165) score += 15;
  else if (descLen >= 70) score += 8;

  if (slug && /^[a-z0-9-]+$/.test(slug)) score += 10;
  if (coverImage) score += 10;
  if (h2Count >= 3) score += 10;
  else if (h2Count >= 1) score += 5;

  if (words >= 1200) score += 15;
  else if (words >= 600) score += 10;
  else if (words >= 300) score += 5;

  if (kwInTitle) score += 8;
  if (kwInDesc) score += 7;
  if (densityStatus === "good") score += 5;
  if (internalLinkCount >= 3) score += 5;

  score = Math.min(100, Math.max(0, score));

  async function handleAutoTuneMeta() {
    if (!onApplyMeta) return;
    setOptimizing(true);
    try {
      const res = await fetch("/api/admin/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize_meta",
          title,
          content,
          focusKeyword,
        }),
      });
      const data = await res.json();
      if (data.ok && data.metaTitle && data.metaDescription) {
        onApplyMeta(data.metaTitle, data.metaDescription);
      }
    } catch {
      // ignore
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header with Surfer-Style Health Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Search size={18} className="text-purple" />
            Live On-Page SEO Auditor &amp; SERP Engine
          </h3>
          <p className="text-xs text-navy/60 mt-0.5">
            Real-time keyword density, search snippet preview, and content optimization score.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500">SEO Health Score</div>
            <div
              className={`text-xl font-extrabold ${
                score >= 80
                  ? "text-emerald-600"
                  : score >= 55
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
            >
              {score}/100
            </div>
          </div>
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-xs shadow-xs border ${
              score >= 80
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : score >= 55
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {score}%
          </div>
        </div>
      </div>

      {/* Focus Keyword & Density Bar */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple" />
            Target Focus Keyword
          </label>
          {onApplyMeta && (
            <button
              type="button"
              onClick={handleAutoTuneMeta}
              disabled={optimizing}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple hover:underline disabled:opacity-50"
            >
              <Zap size={12} className={optimizing ? "animate-spin" : ""} />
              {optimizing ? "Tuning with AI..." : "1-Click Auto-Tune Meta Tags"}
            </button>
          )}
        </div>

        {onFocusKeywordChange ? (
          <input
            type="text"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder="e.g. crm switch, custom software development cost"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-navy placeholder-slate-400 outline-none focus:border-purple focus:ring-1 focus:ring-purple"
          />
        ) : (
          <div className="text-xs font-bold text-navy">{focusKeyword || "None set"}</div>
        )}

        {kw ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div
              className={`rounded-xl p-2 text-center font-bold border ${
                kwInTitle
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {kwInTitle ? "✓ In Title" : "✗ Missing in Title"}
            </div>
            <div
              className={`rounded-xl p-2 text-center font-bold border ${
                kwInDesc
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {kwInDesc ? "✓ In Description" : "✗ Missing in Meta"}
            </div>
            <div
              className={`rounded-xl p-2 text-center font-bold border ${
                kwInSlug
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {kwInSlug ? "✓ In URL Slug" : "✗ Missing in Slug"}
            </div>
            <div
              className={`rounded-xl p-2 text-center font-bold border ${
                densityStatus === "good"
                  ? "bg-purple/10 text-purple border-purple/20"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
              title="Target density: 0.8% - 2.0%"
            >
              {kwOccurrences}x ({kwDensityPercent.toFixed(1)}% density)
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            Enter a target keyword above to verify placement in Title, Slug, Description, and body frequency.
          </div>
        )}
      </div>

      {/* Preview Selector Tabs */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSocialPreview("google")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                socialPreview === "google"
                  ? "bg-purple text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Globe size={14} /> Google SERP Snippet
            </button>
            <button
              type="button"
              onClick={() => setSocialPreview("social")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                socialPreview === "social"
                  ? "bg-purple text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Share2 size={14} /> Social Share Card (OG)
            </button>
          </div>

          {socialPreview === "google" && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setDevicePreview("desktop")}
                className={`p-1 rounded-md text-xs transition ${
                  devicePreview === "desktop"
                    ? "bg-white text-navy shadow-xs font-semibold"
                    : "text-navy/60 hover:text-navy"
                }`}
                title="Desktop Google Preview"
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDevicePreview("mobile")}
                className={`p-1 rounded-md text-xs transition ${
                  devicePreview === "mobile"
                    ? "bg-white text-navy shadow-xs font-semibold"
                    : "text-navy/60 hover:text-navy"
                }`}
                title="Mobile Google Preview"
              >
                <Smartphone size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Google SERP Preview */}
        {socialPreview === "google" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 leading-tight">The Digital Dude</span>
                <span className="text-[11px] text-slate-500 truncate max-w-[340px]">
                  https://www.digitaldude.co.uk › blog › {displaySlug}
                </span>
              </div>
            </div>

            <h4 className="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
              {displayTitle}
            </h4>

            <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              {displayDesc}
            </p>
          </div>
        )}

        {/* Social Card Preview */}
        {socialPreview === "social" && (
          <div className="mt-4 max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="aspect-video w-full bg-slate-100 overflow-hidden relative">
              {coverImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={coverImage}
                  alt={displayTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-navy text-white text-center p-6">
                  <div>
                    <div className="text-xs uppercase font-bold tracking-widest text-purple">
                      The Digital Dude
                    </div>
                    <div className="mt-2 font-bold text-base line-clamp-2">{displayTitle}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-navy/50">
                digitaldude.co.uk · {category}
              </div>
              <h5 className="mt-1 text-sm font-bold text-navy line-clamp-1">{displayTitle}</h5>
              <p className="mt-1 text-xs text-navy/60 line-clamp-2">{displayDesc}</p>
            </div>
          </div>
        )}
      </div>

      {/* Length Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        {/* Title Length */}
        <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy">Title Length</span>
            <span
              className={`font-mono font-bold ${
                titleStatus === "good"
                  ? "text-emerald-600"
                  : titleStatus === "warn"
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
            >
              {titleLen} / 60 chars
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                titleStatus === "good"
                  ? "bg-emerald-500"
                  : titleStatus === "warn"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {titleStatus === "good"
              ? "Optimal length for desktop & mobile search snippets."
              : titleLen > 60
              ? "Over 60 characters: likely truncated with ellipsis (...)."
              : "Too short. Aim for 45–60 chars with target keyword."}
          </p>
        </div>

        {/* Description Length */}
        <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-navy">Meta Description Length</span>
            <span
              className={`font-mono font-bold ${
                descStatus === "good"
                  ? "text-emerald-600"
                  : descStatus === "warn"
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
            >
              {descLen} / 160 chars
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                descStatus === "good"
                  ? "bg-emerald-500"
                  : descStatus === "warn"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {descStatus === "good"
              ? "Optimal length for rich search engine click-through."
              : descLen > 160
              ? "Over 160 characters: mobile results will truncate."
              : "Add compelling details to drive search click-through."}
          </p>
        </div>
      </div>

      {/* Surfer-Style Technical Content Audit Checklist */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy/70">
          Content &amp; Linking Health Checklist
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            {words >= 1200 ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : words >= 600 ? (
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            ) : (
              <XCircle size={15} className="text-red-400 shrink-0" />
            )}
            <span>
              Article Depth: <strong>{words} words</strong> (Target: 1,200+ words)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            {h2Count >= 3 ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            )}
            <span>
              Headings Hierarchy: <strong>{h2Count} H2s, {h3Count} H3s</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            {internalLinkCount >= 3 ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            )}
            <span>
              Internal Links: <strong>{internalLinkCount} links</strong> (Target: 3+ internal links)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            {missingAltCount === 0 ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            )}
            <span>
              Image Alt Tags:{" "}
              {missingAltCount === 0
                ? "All images verified"
                : `${missingAltCount} image(s) missing alt text`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            {coverImage ? (
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            ) : (
              <XCircle size={15} className="text-red-400 shrink-0" />
            )}
            <span>Cover image configured for OpenGraph and SERP</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>Automated <code>BlogPosting</code> &amp; <code>FAQPage</code> schema enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeoInspector;
