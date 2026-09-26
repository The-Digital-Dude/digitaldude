'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Sparkles, 
  AlertCircle,
  Clock,
  Tag,
  ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'SEO & Performance',
    cover_image: '',
    status: 'draft',
    author: 'The Digital Dude Team'
  });

  const categories = [
    'SEO & Performance',
    'E-Commerce Growth',
    'Google Ads & PPC',
    'Full-Stack Web Dev',
    'Conversion Optimization',
    'AI & Automation'
  ];

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug === '' || prev.slug === prev.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
        ? generatedSlug
        : prev.slug
    }));
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleSubmit = async (publishStatus?: string) => {
    if (!formData.title.trim()) {
      setError('Please provide a post title.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Please provide a URL slug.');
      return;
    }
    if (!formData.content.trim()) {
      setError('Please write some content for the article.');
      return;
    }

    setSaving(true);
    setError(null);

    const postPayload = {
      ...formData,
      status: publishStatus || formData.status,
      read_time: `${calculateReadTime(formData.content)} min read`
    };

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create blog post');
      }

      router.push('/admin/blogs');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blogs"
              className="p-2 bg-white border border-slate-200 text-navy/60 hover:text-navy rounded-xl shadow-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-navy tracking-tight">Create New Article</h1>
              <p className="text-sm text-navy/60">Draft or publish a high-ranking SEO blog post</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3.5 py-2 bg-white border border-slate-200 text-navy/80 hover:text-navy hover:border-slate-300 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4 text-purple" />
              {showPreview ? 'Edit Mode' : 'Live Preview'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy/80 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('published')}
              className="px-4 py-2 bg-purple hover:bg-purple/90 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-lavender text-purple">
                {formData.category}
              </span>
              <span className="text-xs text-navy/50 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {calculateReadTime(formData.content)} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              {formData.title || 'Untitled Article'}
            </h1>

            {formData.excerpt && (
              <p className="text-lg text-navy/70 leading-relaxed border-l-2 border-purple pl-4 italic">
                {formData.excerpt}
              </p>
            )}

            {formData.cover_image && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.cover_image} 
                  alt={formData.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            <div className="prose prose-indigo max-w-none text-navy/85 leading-relaxed space-y-4 whitespace-pre-wrap font-sans text-base">
              {formData.content || 'No content written yet...'}
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g., 7 Proven E-Commerce SEO Strategies That Doubled Revenue"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl px-4 py-3 text-navy placeholder-slate-400 font-medium text-lg outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple focus-within:bg-white transition-colors">
                    <span className="px-3 text-navy/40 text-sm font-mono border-r border-slate-200">
                      /blog/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e-commerce-seo-strategies"
                      className="w-full bg-transparent px-3 py-2.5 text-navy font-mono text-sm outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    SEO Excerpt / Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief 1-2 sentence overview for search engine snippets and social sharing cards..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy placeholder-slate-400 text-sm outline-none transition-colors"
                  />
                  <p className="text-xs text-navy/40 mt-1 text-right">
                    {formData.excerpt.length}/160 recommended characters
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider">
                      Article Content (Markdown supported) *
                    </label>
                    <span className="text-xs text-purple font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{calculateReadTime(formData.content)} min read
                    </span>
                  </div>
                  <textarea
                    rows={16}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={`## Your Section Heading\n\nWrite your insights, marketing tips, case studies, or strategies here.\n\n### Key Takeaways\n\n- Point 1\n- Point 2`}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-4 text-navy placeholder-slate-400 font-mono text-sm outline-none transition-colors leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Meta Info */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-base font-bold text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple" />
                  Post Settings
                </h2>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2.5 text-navy text-sm outline-none transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2.5 text-navy text-sm outline-none transition-colors"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Public)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2.5 text-navy text-sm outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/60 uppercase tracking-wider mb-2">
                    Cover Image URL
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple focus-within:bg-white">
                    <span className="p-2.5 text-navy/40">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={formData.cover_image}
                      onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-transparent pr-3 py-2 text-navy text-sm outline-none placeholder-slate-400"
                    />
                  </div>
                  {formData.cover_image && (
                    <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.cover_image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="bg-lavender rounded-xl p-3.5 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-navy/80 leading-relaxed">
                      Publishing automatically updates the Google XML sitemap and embeds the <code>Article</code> Schema.org markup.
                    </p>
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
