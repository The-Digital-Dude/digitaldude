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
}: SeoInspectorProps) {
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [socialPreview, setSocialPreview] = useState<"google" | "social">("google");

  const displayTitle = (metaTitle || title || "Untitled Article").trim();
  const displayDesc = (
    metaDescription ||
    excerpt ||
    "Discover actionable insights, architecture breakdowns, and tech strategies on The Digital Dude blog."
  ).trim();
  const displaySlug = slug || "article-slug";
  const fullUrl = `${SITE_URL}/blog/${displaySlug}`;

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
  const kwInTitle = kw ? displayTitle.toLowerCase().includes(kw) : false;
  const kwInDesc = kw ? displayDesc.toLowerCase().includes(kw) : false;
  const kwInSlug = kw ? displaySlug.toLowerCase().includes(kw.replace(/\s+/g, "-")) : false;
  const kwInContentCount = kw
    ? (content.toLowerCase().match(new RegExp(kw, "g")) || []).length
    : 0;

  // SEO Score calculation (0 - 100)
  let score = 0;
  if (titleLen >= 30) score += 15;
  if (titleStatus === "good") score += 10;
  if (descLen >= 80) score += 15;
  if (descStatus === "good") score += 10;
  if (slug && /^[a-z0-9-]+$/.test(slug)) score += 10;
  if (coverImage) score += 15;
  if (h2Count >= 2) score += 10;
  if (words >= 300) score += 15;

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header with SEO Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Search size={18} className="text-purple" />
            SEO & Social Preview Engine
          </h3>
          <p className="text-xs text-navy/60 mt-0.5">
            Optimize meta tags, search snippet appearance, and keyword ranking potential.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-medium text-navy/60">SEO Health Score</div>
            <div
              className={`text-lg font-extrabold ${
                score >= 80
                  ? "text-emerald-600"
                  : score >= 50
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
            >
              {score}/100
            </div>
          </div>
          <div className="h-10 w-10 rounded-full border-4 flex items-center justify-center font-bold text-xs border-purple/20 bg-lavender text-purple">
            {score}%
          </div>
        </div>
      </div>

      {/* Focus Keyword Input */}
      {onFocusKeywordChange && (
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple" />
            Target Focus Keyword (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={focusKeyword}
              onChange={(e) => onFocusKeywordChange(e.target.value)}
              placeholder="e.g. custom CRM development"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy placeholder-slate-400 outline-none focus:border-purple focus:ring-1 focus:ring-purple"
            />
          </div>
          {kw && (
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div
                className={`rounded-md p-1.5 text-center font-medium ${
                  kwInTitle ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {kwInTitle ? "✓ In Title" : "✗ Missing in Title"}
              </div>
              <div
                className={`rounded-md p-1.5 text-center font-medium ${
                  kwInDesc ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {kwInDesc ? "✓ In Excerpt" : "✗ Missing in Excerpt"}
              </div>
              <div
                className={`rounded-md p-1.5 text-center font-medium ${
                  kwInSlug ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {kwInSlug ? "✓ In URL Slug" : "✗ Missing in Slug"}
              </div>
              <div className="rounded-md bg-purple/10 text-purple p-1.5 text-center font-medium">
                {kwInContentCount}x in body
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Selector Tabs */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSocialPreview("google")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                socialPreview === "google"
                  ? "bg-purple text-white shadow-xs"
                  : "text-navy/70 hover:bg-slate-100"
              }`}
            >
              <Globe size={14} /> Google SERP Snippet
            </button>
            <button
              type="button"
              onClick={() => setSocialPreview("social")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                socialPreview === "social"
                  ? "bg-purple text-white shadow-xs"
                  : "text-navy/70 hover:bg-slate-100"
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
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 leading-tight">The Digital Dude</span>
                <span className="text-[11px] text-slate-500 truncate max-w-[320px]">
                  https://www.digitaldude.co.uk › blog › {displaySlug}
                </span>
              </div>
            </div>

            <h4 className="mt-2 text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2">
              {displayTitle} | The Digital Dude
            </h4>

            <p className="mt-1 text-sm text-[#4d5156] leading-relaxed line-clamp-2">
              {displayDesc}
            </p>
          </div>
        )}

        {/* Social Card Preview */}
        {socialPreview === "social" && (
          <div className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
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

      {/* SEO Character and Content Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        {/* Title Length Indicator */}
        <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy">Title Length</span>
            <span
              className={`font-bold ${
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
          <p className="text-[11px] text-navy/50">
            {titleStatus === "good"
              ? "Ideal length for Google desktop & mobile SERP."
              : titleLen > 60
              ? "Title may be truncated with ellipsis in Google results."
              : "Too short. Aim for 45-60 characters for higher click-through."}
          </p>
        </div>

        {/* Description Length Indicator */}
        <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy">Meta Description Length</span>
            <span
              className={`font-bold ${
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
          <p className="text-[11px] text-navy/50">
            {descStatus === "good"
              ? "Optimal length for rich search engine snippets."
              : descLen > 160
              ? "Over 160 characters. Mobile devices may cut this off."
              : "Add more details to increase organic search click-through."}
          </p>
        </div>
      </div>

      {/* SEO Checklist */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy/70 mb-2">
          SEO Technical Audit
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-navy/80">
            {coverImage ? (
              <CheckCircle2 size={15} className="text-emerald-500" />
            ) : (
              <XCircle size={15} className="text-red-400" />
            )}
            <span>Cover image configured for OG Card & Rich Snippets</span>
          </div>

          <div className="flex items-center gap-2 text-navy/80">
            {h2Count >= 2 ? (
              <CheckCircle2 size={15} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={15} className="text-amber-500" />
            )}
            <span>Content Headings: {h2Count} H2s, {h3Count} H3s structured</span>
          </div>

          <div className="flex items-center gap-2 text-navy/80">
            {words >= 300 ? (
              <CheckCircle2 size={15} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={15} className="text-amber-500" />
            )}
            <span>Article length: {words} words (~{Math.max(1, Math.ceil(words / 200))} min read)</span>
          </div>

          <div className="flex items-center gap-2 text-navy/80">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Schema.org <code>Article</code> JSON-LD automated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
