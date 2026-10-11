"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  Layers,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  BlogOutlineResult,
  BlogOutlineSection,
  GeneratedArticleResult,
  InternalLinkCandidate,
} from "@/lib/seo/blogGenerator";

interface AiBlogGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (article: GeneratedArticleResult) => void;
}

export function AiBlogGeneratorModal({
  isOpen,
  onClose,
  onApply,
}: AiBlogGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form
  const [focusKeyword, setFocusKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState(
    "Growing Service Businesses & Technical Leaders"
  );
  const [contentGoal, setContentGoal] = useState(
    "Demonstrate architectural superiority and ROI of custom software"
  );

  // Step 2 State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [outline, setOutline] = useState<BlogOutlineResult | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<InternalLinkCandidate[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");

  if (!isOpen) return null;

  async function handleGenerateOutline(e: React.FormEvent) {
    e.preventDefault();
    if (!focusKeyword.trim()) {
      setErrorMessage("Please enter a focus keyword.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "outline",
          focusKeyword: focusKeyword.trim(),
          secondaryKeywords: secondaryKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          targetAudience,
          contentGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to generate outline.");
      }

      setOutline(data.outline);
      setSelectedLinks(data.outline.recommendedLinks || []);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function toggleLink(link: InternalLinkCandidate) {
    if (selectedLinks.some((l) => l.url === link.url)) {
      setSelectedLinks(selectedLinks.filter((l) => l.url !== link.url));
    } else {
      setSelectedLinks([...selectedLinks, link]);
    }
  }

  function handleSectionChange(
    index: number,
    field: keyof BlogOutlineSection,
    value: string | number
  ) {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    };
    setOutline({ ...outline, sections: newSections });
  }

  function handleDeleteSection(index: number) {
    if (!outline) return;
    setOutline({
      ...outline,
      sections: outline.sections.filter((_, i) => i !== index),
    });
  }

  function handleAddSection() {
    if (!outline) return;
    setOutline({
      ...outline,
      sections: [
        ...outline.sections,
        {
          heading: "New Section Title",
          level: "h2",
          description: "Detail the technical and business takeaways.",
          targetWords: 250,
        },
      ],
    });
  }

  async function handleGenerateFullArticle() {
    if (!outline) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "article",
          outline,
          selectedLinks,
          customInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to generate full article.");
      }

      onApply(data.article);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">
                AI Article Architect &amp; SEO Drafter
              </h3>
              <p className="text-xs text-slate-500">
                {step === 1
                  ? "Step 1 of 2: Define Focus Keyword & Audience"
                  : "Step 2 of 2: Review Outline & Internal Link Anchors"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Inputs */}
          {step === 1 && (
            <form onSubmit={handleGenerateOutline} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Target Focus Keyword <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. crm switch, custom software development cost uk, bespoke erp vs netsuite"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-medium text-navy focus:border-purple focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  The primary search phrase this post should target and rank for on Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Secondary / Semantic Keywords (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. per-seat licensing, database migration, tco formula, postgis dispatch"
                  value={secondaryKeywords}
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-navy focus:border-purple focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Separate related terms with commas. The AI will weave these into subheadings and copy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-navy focus:border-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                    Strategic Content Goal
                  </label>
                  <input
                    type="text"
                    value={contentGoal}
                    onChange={(e) => setContentGoal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-navy focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-3 text-xs font-bold text-white shadow-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Outline &amp; Internal Links...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Review Outline &amp; Links</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Review Outline & Links */}
          {step === 2 && outline && (
            <div className="space-y-6">
              {/* Proposed Metadata Card */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Proposed SEO Metadata</span>
                  <span className="text-purple">{outline.category}</span>
                </div>
                <div className="text-sm font-extrabold text-navy">{outline.title}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {outline.metaDescription}
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Slug: /{outline.slug}
                </div>
              </div>

              {/* Smart Internal Link Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-purple" />
                    Recommended Internal Links to Weave In:
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {selectedLinks.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(outline.recommendedLinks || []).map((link) => {
                    const isSelected = selectedLinks.some((l) => l.url === link.url);
                    return (
                      <div
                        key={link.url}
                        onClick={() => toggleLink(link)}
                        className={`cursor-pointer rounded-xl p-3 border transition flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-purple/5 border-purple"
                            : "bg-white border-slate-200 hover:border-slate-300 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="mt-0.5 h-3.5 w-3.5 rounded text-purple focus:ring-purple cursor-pointer"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-navy truncate">{link.title}</div>
                          <div className="text-[11px] text-purple font-mono truncate">
                            {link.url}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Anchor: &ldquo;{link.anchorSuggestion}&rdquo;
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editable Outline Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple" />
                    Article Headings &amp; Hierarchy ({outline.sections.length} Sections)
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Section
                  </button>
                </div>

                <div className="space-y-2.5">
                  {outline.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={sec.level}
                            onChange={(e) =>
                              handleSectionChange(idx, "level", e.target.value as "h2" | "h3")
                            }
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-navy focus:outline-none"
                          >
                            <option value="h2">H2</option>
                            <option value="h3">H3</option>
                          </select>
                          <input
                            type="text"
                            value={sec.heading}
                            onChange={(e) =>
                              handleSectionChange(idx, "heading", e.target.value)
                            }
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-navy focus:border-purple focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSection(idx)}
                          className="text-slate-400 hover:text-red-600 transition p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={sec.description}
                        onChange={(e) =>
                          handleSectionChange(idx, "description", e.target.value)
                        }
                        placeholder="Section focus and deliverables..."
                        className="w-full text-[11px] text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1 border border-slate-100 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-1.5">
                  Additional Style or Technical Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include a formula comparing per-seat software with fixed builds. Emphasize multi-portal role-based security."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-navy focus:border-purple focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGenerateFullArticle}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Drafting 1,500+ Word Article...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Full Article Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiBlogGeneratorModal;
