'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function EditCaseStudyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    industry: 'Property',
    tag: 'Property · Australia',
    summary: '',
    status: 'Live',
    image: '/images/case-studies/property-compliance.svg',
    image_alt: '',
    headline: '',
    page_summary: '',
    stats: ['4,000+ rental properties under management', '30+ agencies active', '4x faster turnaround'],
    challenge: '',
    what_we_built: [
      'Agency Portal: Property managers log in, submit new jobs, and download certificates on demand.',
      'Field Inspector Mobile App: Routes, digital checklists, and mandatory photo proof on-site.',
      'Operations Dashboard: Central dispatcher assigns jobs with location-based grouping.'
    ],
    what_changed: '',
    what_changed_label: 'What changed',
    built_with: 'Next.js 16, TypeScript, Supabase PostgreSQL, Tailwind CSS',
    related: ['property-compliance-crm', 'airline-ticketing-crm']
  });

  const [isCustomIndustry, setIsCustomIndustry] = useState(false);
  const [industries, setIndustries] = useState<string[]>([
    'Property',
    'Travel',
    'Community',
    'Home services',
    'Logistics',
    'Recruitment',
    'Education',
    'Custom Software',
    'E-Commerce',
    'Fintech',
    'Healthcare'
  ]);

  useEffect(() => {
    async function fetchCaseStudy() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/case-studies/${id}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to load case study');
        }
        const item = data.caseStudy || data.item;
        setFormData({
          title: item.title || '',
          slug: item.slug || '',
          industry: item.industry || 'Property',
          tag: item.tag || '',
          summary: item.summary || '',
          status: item.status || 'Live',
          image: item.image || '',
          image_alt: item.image_alt || '',
          headline: item.headline || '',
          page_summary: item.page_summary || '',
          stats: Array.isArray(item.stats) && item.stats.length > 0 ? item.stats : [''],
          challenge: item.challenge || '',
          what_we_built: Array.isArray(item.what_we_built) && item.what_we_built.length > 0 ? item.what_we_built : [''],
          what_changed: item.what_changed || '',
          what_changed_label: item.what_changed_label || 'What changed',
          built_with: item.built_with || '',
          related: Array.isArray(item.related) ? item.related : []
        });
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCaseStudy();
    }
  }, [id]);

  // Stat item handlers
  const handleAddStat = () => {
    setFormData(prev => ({ ...prev, stats: [...prev.stats, ''] }));
  };
  const handleStatChange = (index: number, val: string) => {
    const newStats = [...formData.stats];
    newStats[index] = val;
    setFormData(prev => ({ ...prev, stats: newStats }));
  };
  const handleRemoveStat = (index: number) => {
    setFormData(prev => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
  };

  // What we built handlers
  const handleAddBuiltFeature = () => {
    setFormData(prev => ({ ...prev, what_we_built: [...prev.what_we_built, ''] }));
  };
  const handleBuiltFeatureChange = (index: number, val: string) => {
    const newFeatures = [...formData.what_we_built];
    newFeatures[index] = val;
    setFormData(prev => ({ ...prev, what_we_built: newFeatures }));
  };
  const handleRemoveBuiltFeature = (index: number) => {
    setFormData(prev => ({ ...prev, what_we_built: prev.what_we_built.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Please provide a project title.');
      setActiveTab('edit');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Please provide a URL slug.');
      setActiveTab('edit');
      return;
    }
    if (!formData.headline.trim()) {
      setError('Please provide a page headline.');
      setActiveTab('edit');
      return;
    }
    if (!formData.challenge.trim()) {
      setError('Please describe the problem / challenge.');
      setActiveTab('edit');
      return;
    }
    if (!formData.what_changed.trim()) {
      setError('Please describe the impact / what changed.');
      setActiveTab('edit');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      stats: formData.stats.filter(Boolean),
      what_we_built: formData.what_we_built.filter(Boolean),
    };

    try {
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update case study');
      }

      setSuccessNotice('Case study updated successfully!');
      setTimeout(() => {
        setSuccessNotice(null);
      }, 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${formData.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/case-studies/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete case study');
      }

      router.push('/admin/case-studies');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-navy/60 space-y-3">
          <Loader2 className="animate-spin text-purple" size={32} />
          <p className="text-sm font-medium">Loading case study details...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/case-studies"
              className="p-2 bg-white border border-slate-200 text-navy/60 hover:text-navy rounded-xl shadow-xs transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">
                  Edit Case Study
                </h1>
                <span className="rounded-full bg-purple/10 px-2.5 py-0.5 text-xs font-semibold text-purple">
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-navy/60 mt-0.5">
                Update metrics, architecture breakdowns, and impact data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/work/${formData.slug}`}
              target="_blank"
              className="px-3 py-1.5 bg-white border border-slate-200 text-navy/70 hover:text-navy font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              View Live
            </Link>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'edit'
                    ? 'bg-white text-navy shadow-xs'
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Edit3 size={13} />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-navy shadow-xs'
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Eye size={13} />
                Live Preview
              </button>
            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl text-xs transition disabled:opacity-50"
              title="Delete Case Study"
            >
              <Trash2 size={16} />
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-4 py-2 bg-purple hover:bg-purple/90 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Case Study Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-purple" />
                  Project Overview
                </h3>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Property compliance CRM"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl px-4 py-2.5 text-navy font-semibold text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple focus-within:bg-white transition">
                    <span className="px-3 text-navy/40 text-xs font-mono border-r border-slate-200 bg-slate-100 py-2.5">
                      /work/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-navy font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Case Study Page Headline *
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. From spreadsheet chaos to four times faster turnarounds"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl px-4 py-2.5 text-navy text-sm font-medium outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Overview Card Summary
                  </label>
                  <textarea
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief 1-sentence outcome shown on project card grid..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Page Introduction Paragraph
                  </label>
                  <textarea
                    rows={3}
                    value={formData.page_summary}
                    onChange={(e) => setFormData({ ...formData, page_summary: e.target.value })}
                    placeholder="Detailed introduction paragraph displayed at the top of the case study page..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Stats & Key Metrics */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    <Sparkles size={16} className="text-purple" />
                    Key Metric Stats (Hero Stat Bar)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStat}
                    className="flex items-center gap-1 text-xs font-bold text-purple hover:underline"
                  >
                    <Plus size={14} /> Add Metric Stat
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stat}
                        onChange={(e) => handleStatChange(idx, e.target.value)}
                        placeholder={`Metric ${idx + 1}, e.g. 4,000+ rental properties`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStat(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep Dive Problem & Solution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3">
                  The Challenge, System Architecture &amp; Impact
                </h3>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    The Challenge / Problem *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.challenge}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    placeholder="Describe the operational bottlenecks, spreadsheet limits, or manual delays the client was facing..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy text-xs leading-relaxed outline-none transition"
                  />
                </div>

                {/* What We Built List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider">
                      What We Built (Key Modules &amp; Deliverables)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBuiltFeature}
                      className="flex items-center gap-1 text-xs font-bold text-purple hover:underline"
                    >
                      <Plus size={14} /> Add Module
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {formData.what_we_built.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={feature}
                          onChange={(e) => handleBuiltFeatureChange(idx, e.target.value)}
                          placeholder={`Module/Feature ${idx + 1}: Description of portal, automation, or app...`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy outline-none focus:border-purple focus:bg-white leading-relaxed"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBuiltFeature(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition mt-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    The Outcome &amp; Measurable Impact *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.what_changed}
                    onChange={(e) => setFormData({ ...formData, what_changed: e.target.value })}
                    placeholder="What did this make possible? State time saved, revenue increased, or headcount efficiency gained..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy text-xs leading-relaxed outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Right 1 Col: Metadata & Media */}
            <div className="space-y-6">
              {/* Illustration / Screenshot */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <ImageUploader
                  label="Case Study Graphic / Screenshot"
                  description="Upload illustration directly to Supabase"
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                />
              </div>

              {/* Taxonomy Settings */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Layers size={16} className="text-purple" />
                  Taxonomy &amp; Tech Stack
                </h3>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider">
                      Industry / Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomIndustry(!isCustomIndustry);
                      }}
                      className="text-[11px] font-bold text-purple hover:underline"
                    >
                      {isCustomIndustry ? "← Select standard" : "+ Add custom"}
                    </button>
                  </div>

                  {!isCustomIndustry ? (
                    <select
                      value={industries.includes(formData.industry) ? formData.industry : "__custom__"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setIsCustomIndustry(true);
                        } else {
                          setFormData({ ...formData, industry: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                      <option value="__custom__">+ Add custom industry/category...</option>
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g. Fintech, Healthcare, Manufacturing"
                        className="w-full bg-slate-50 border border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none font-medium"
                      />
                      <p className="text-[10px] text-navy/50">
                        Type any custom industry. It will create a new category filter on the portfolio page.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Location &amp; Scope Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="e.g. Property · Australia"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                  >
                    <option value="Live">Live (In active production)</option>
                    <option value="Delivered">Delivered (Handed off)</option>
                    <option value="Draft">Draft (Private)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Tech Stack
                  </label>
                  <input
                    type="text"
                    value={formData.built_with}
                    onChange={(e) => setFormData({ ...formData, built_with: e.target.value })}
                    placeholder="Next.js, TypeScript, Supabase, Tailwind CSS"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Tab */}
        {activeTab === 'preview' && (
          <div className="bg-sand rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-purple">
                {formData.tag} · {formData.status}
              </span>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-navy">
                {formData.headline || formData.title || 'Untitled Case Study'}
              </h1>
              {formData.page_summary && (
                <p className="mt-4 text-lg text-navy/70 leading-relaxed">
                  {formData.page_summary}
                </p>
              )}
            </div>

            {/* Stats Bar */}
            {formData.stats.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {formData.stats.map((stat, i) => (
                    <div key={i} className="border-l-2 border-purple pl-4">
                      <p className="text-sm font-semibold text-navy">{stat}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graphic */}
            {formData.image && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.image} alt={formData.title} className="max-h-full object-contain" />
              </div>
            )}

            {/* The Challenge */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold text-navy">The Challenge</h3>
              <p className="text-navy/80 leading-relaxed text-base">{formData.challenge}</p>
            </div>

            {/* What We Built */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold text-navy">What We Built</h3>
              <ul className="space-y-3">
                {formData.what_we_built.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-navy/80 text-sm sm:text-base leading-relaxed">
                    <span className="h-2 w-2 rounded-full bg-purple mt-2 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
