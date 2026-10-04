"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Sparkles, Globe, Eye } from "lucide-react";
import { PseoPageData } from "@/lib/pseo/types";
import { SITE_URL } from "@/lib/utils";

interface PseoEditModalProps {
  page: PseoPageData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PseoEditModal({
  page,
  isOpen,
  onClose,
  onSaved,
}: PseoEditModalProps) {
  const [category, setCategory] = useState<"location" | "solution" | "comparison" | "custom">("location");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [heroBadge, setHeroBadge] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [city, setCity] = useState("");
  const [serviceSlug, setServiceSlug] = useState("crm-development");
  const [status, setStatus] = useState<"published" | "draft" | "archived">("published");
  const [customContent, setCustomContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCreatingNew = !page?.id && (!page?.slug || page.slug === "new-page");

  useEffect(() => {
    if (page) {
      setCategory((page.category as any) || "location");
      setSlug(page.slug === "new-page" ? "" : (page.slug || ""));
      setTitle(page.title === "New Programmatic Page" ? "" : (page.title || ""));
      setMetaDescription(page.metaDescription || "");
      setHeroBadge(page.heroBadge || "");
      setHeroHeadline(page.heroHeadline || "");
      setHeroSubheadline(page.heroSubheadline || "");
      setTargetKeyword(page.targetKeyword || "");
      setCity(page.city || "");
      setServiceSlug(page.serviceSlug || "crm-development");
      setStatus(page.status || "published");
      setCustomContent(page.customContent || "");
      setErrorMessage(null);
    }
  }, [page]);

  if (!isOpen || !page) return null;

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      let finalSlug = slug.trim().replace(/^\/+|\/+$/g, "");
      if (!finalSlug) {
        if (city && serviceSlug) {
          finalSlug = `locations/${city.toLowerCase().replace(/\s+/g, "-")}/${serviceSlug}`;
        } else {
          finalSlug = `custom/${(title || "new-page").toLowerCase().replace(/[^\w-]/g, "-")}`;
        }
      }

      const payload = {
        slug: finalSlug,
        category,
        title: title || (city ? `${city} Software Development | The Digital Dude` : "Custom Page"),
        metaDescription,
        heroBadge,
        heroHeadline: heroHeadline || title,
        heroSubheadline,
        targetKeyword: targetKeyword || title,
        status,
        customContent,
        city: city || page?.city || null,
        country: page?.country || (city ? "United Kingdom" : null),
        region: page?.region || null,
        currency: page?.currency || "GBP",
        industrySlug: page?.industrySlug || null,
        serviceSlug: serviceSlug || page?.serviceSlug || null,
        competitorName: page?.competitorName || null,
        featuredCaseStudySlug: page?.featuredCaseStudySlug || null,
        faqs: page?.faqs || [],
        stats: page?.stats || [],
        comparisonMatrix: page?.comparisonMatrix || []
      };

      const res = await fetch("/api/admin/pseo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save page override");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  const liveUrl = `${SITE_URL}/${slug || page.slug || "new-page"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-accent-primary uppercase tracking-wider">
                {isCreatingNew ? "New Page Creation" : category}
              </span>
              <h3 className="text-lg font-bold text-navy">
                {isCreatingNew ? "Create Programmatic Page" : "Edit Programmatic Page"}
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-500 mt-1">/{slug || page.slug || "new-page"}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* New Page Setup Fields */}
          {isCreatingNew && (
            <div className="rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4 space-y-4">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">Page Routing & Setup</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
                  >
                    <option value="location">Location (City + Service)</option>
                    <option value="solution">Solution (Industry + Service)</option>
                    <option value="comparison">Comparison (Build vs SaaS)</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>

                {category === "location" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy">City / Metro:</label>
                    <input
                      type="text"
                      placeholder="e.g. Newcastle, Gold Coast"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (!slug) {
                          setSlug(`locations/${e.target.value.toLowerCase().replace(/\s+/g, "-")}/${serviceSlug}`);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                )}

                {(category === "location" || category === "solution") && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-navy">Service:</label>
                    <select
                      value={serviceSlug}
                      onChange={(e) => {
                        setServiceSlug(e.target.value);
                        if (city && category === "location") {
                          setSlug(`locations/${city.toLowerCase().replace(/\s+/g, "-")}/${e.target.value}`);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
                    >
                      <option value="crm-development">CRM Development</option>
                      <option value="saas-development">SaaS Development</option>
                      <option value="marketplace-development">Marketplace Development</option>
                      <option value="erp-hrm-systems">ERP / HRM Systems</option>
                      <option value="website-development">Website Development</option>
                      <option value="seo-growth">SEO & Growth</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-bold text-navy">URL Slug (Live path):</label>
                  <input
                    type="text"
                    placeholder="e.g. locations/newcastle/crm-development"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Google Search Snippet Preview Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Eye className="h-3.5 w-3.5" />
              Google Search Result Preview
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">{liveUrl}</div>
            <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer truncate">
              {title || "Page Title Here"}
            </div>
            <div className="text-xs text-slate-600 line-clamp-2">
              {metaDescription || "Meta description snippet will appear here in Google search engine listings."}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy">SEO Title Tag:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Custom CRM Development in Newcastle | The Digital Dude"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy">Target Keyword:</label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. CRM Development Newcastle"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-navy">Meta Description:</label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-navy">Hero Headline:</label>
              <input
                type="text"
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
              >
                <option value="published">Published (Indexable)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived (404)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-navy">Hero Subheadline / Intro:</label>
            <textarea
              rows={3}
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: "#5B4FE8", color: "#ffffff" }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Saving Changes...
              </>
            ) : (
              "Save & Update Override"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
