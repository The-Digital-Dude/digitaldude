'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MarkdownToolbar } from '@/components/admin/MarkdownToolbar';
import { SeoInspector } from '@/components/admin/SeoInspector';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  Search, 
  Clock, 
  Tag, 
  AlertCircle,
  FileText,
  User,
  Sparkles,
  CheckCircle,
  Link as LinkIcon,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'seo'>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [focusKeyword, setFocusKeyword] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'SEO & Performance',
    cover_image: '',
    status: 'draft',
    author: 'The Digital Dude Team',
    meta_title: '',
    meta_description: ''
  });

  const categories = [
    'SEO & Performance',
    'E-Commerce Growth',
    'Google Ads & PPC',
    'Full-Stack Web Dev',
    'Conversion Optimization',
    'AI & Automation',
    'Custom Software',
    'Marketplace Development',
    'CRM Systems'
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

  const handleFormat = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = formData.content;

    const selectedText = currentText.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  const handleInsertMarkdown = (markdown: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${markdown}` : markdown
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = formData.content;

    const newContent =
      currentText.substring(0, start) + `\n\n${markdown}\n\n` + currentText.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));
    setShowMediaModal(false);
  };

  const handleSubmit = async (publishStatus?: string) => {
    if (!formData.title.trim()) {
      setError('Please provide an article title.');
      setActiveTab('edit');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Please provide a URL slug.');
      setActiveTab('edit');
      return;
    }
    if (!formData.content.trim()) {
      setError('Please write content for the article.');
      setActiveTab('edit');
      return;
    }

    setSaving(true);
    setError(null);

    const postPayload = {
      ...formData,
      status: publishStatus || formData.status,
      meta_title: formData.meta_title || formData.title,
      meta_description: formData.meta_description || formData.excerpt,
      read_time: `${calculateReadTime(formData.content)} min read`
    };

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create blog post');
      }

      setSuccessNotice('Article created successfully!');
      setTimeout(() => {
        router.push('/admin/blogs');
      }, 1000);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blogs"
              className="p-2 bg-white border border-slate-200 text-navy/60 hover:text-navy rounded-xl shadow-xs transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">
                  Create New Article
                </h1>
                <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-purple">
                  {formData.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-navy/60 mt-0.5">
                Draft, upload media, optimize SEO, and publish to the blog.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
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
                Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'seo'
                    ? 'bg-white text-purple shadow-xs font-bold'
                    : 'text-navy/60 hover:text-navy'
                }`}
              >
                <Search size={13} />
                SEO Engine
              </button>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('draft')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-navy/80 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit('published')}
              className="px-4 py-2 bg-purple hover:bg-purple/90 text-white font-semibold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Publishing...' : 'Publish Article'}
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

        {/* Tab 1: Editor & Content */}
        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. 7 Proven E-Commerce SEO Strategies That Doubled Revenue"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl px-4 py-3 text-navy placeholder-slate-400 font-semibold text-base outline-none transition"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple focus-within:bg-white transition">
                    <span className="px-3 text-navy/40 text-xs font-mono border-r border-slate-200 bg-slate-100 py-2.5">
                      https://digitaldude.co.uk/blog/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e-commerce-seo-strategies"
                      className="w-full bg-transparent px-3 py-2 text-navy font-mono text-xs outline-none placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* SEO Excerpt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider">
                      SEO Excerpt / Summary
                    </label>
                    <span
                      className={`text-[11px] font-semibold ${
                        formData.excerpt.length >= 120 && formData.excerpt.length <= 160
                          ? 'text-emerald-600'
                          : 'text-navy/40'
                      }`}
                    >
                      {formData.excerpt.length}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Concise overview for search engine snippets, social cards, and post preview cards..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple focus:bg-white rounded-xl p-3 text-navy placeholder-slate-400 text-sm outline-none transition"
                  />
                </div>

                {/* Content Editor with Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider">
                      Article Content (Markdown) *
                    </label>
                    <span className="text-xs text-purple font-semibold flex items-center gap-1">
                      <Clock size={13} />
                      ~{calculateReadTime(formData.content)} min read ({formData.content.trim().split(/\s+/).filter(Boolean).length} words)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-purple transition">
                    <MarkdownToolbar
                      onFormat={handleFormat}
                      onOpenImageModal={() => setShowMediaModal(true)}
                    />
                    <textarea
                      ref={textareaRef}
                      rows={18}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={`## Section Heading\n\nWrite your insights, marketing tips, case studies, or strategies here.\n\n### Key Takeaways\n\n- Point 1\n- Point 2\n\n![Illustration](https://images.unsplash.com/...)`}
                      className="w-full bg-white p-4 text-navy placeholder-slate-400 font-mono text-xs sm:text-sm outline-none leading-relaxed resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Settings (1 Col) */}
            <div className="space-y-6">
              {/* Cover Image Uploader */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <ImageUploader
                  label="Article Cover Image"
                  description="Upload banner directly to Supabase Storage"
                  value={formData.cover_image}
                  onChange={(url) => setFormData({ ...formData, cover_image: url })}
                  onInsertMarkdown={handleInsertMarkdown}
                />
              </div>

              {/* Post Settings */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Tag size={15} className="text-purple" />
                  Post Publishing Settings
                </h2>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple rounded-xl px-3 py-2 text-navy text-xs outline-none"
                  >
                    <option value="draft">Draft (Hidden from Public)</option>
                    <option value="published">Published (Live & Indexed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1.5">
                    Author Name
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <User size={14} className="text-navy/40 mr-2" />
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full bg-transparent text-navy text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('seo')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-lavender py-2.5 text-xs font-bold text-purple hover:bg-purple hover:text-white transition"
                  >
                    <Sparkles size={14} />
                    Inspect SEO Score & SERP
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Article Preview */}
        {activeTab === 'preview' && (
          <div className="bg-sand rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple/10 text-purple">
                {formData.category}
              </span>
              <span className="text-xs text-navy/60 flex items-center gap-1">
                <Clock size={13} />
                {calculateReadTime(formData.content)} min read
              </span>
              <span className="text-xs text-navy/40">·</span>
              <span className="text-xs text-navy/60">{formData.author}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              {formData.title || 'Untitled Article'}
            </h1>

            {formData.excerpt && (
              <p className="text-lg text-navy/75 leading-relaxed border-l-4 border-purple pl-4 italic bg-white/40 py-2 rounded-r-xl">
                {formData.excerpt}
              </p>
            )}

            {formData.cover_image && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.cover_image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose prose-lg prose-indigo max-w-none text-navy/90 leading-relaxed whitespace-pre-wrap font-sans">
              {formData.content || 'Start writing your article in the Editor tab to see live preview...'}
            </div>
          </div>
        )}

        {/* Tab 3: SEO Engine & Snippet Preview */}
        {activeTab === 'seo' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <SeoInspector
              title={formData.title}
              metaTitle={formData.meta_title}
              excerpt={formData.excerpt}
              metaDescription={formData.meta_description}
              slug={formData.slug}
              content={formData.content}
              coverImage={formData.cover_image}
              category={formData.category}
              author={formData.author}
              focusKeyword={focusKeyword}
              onFocusKeywordChange={setFocusKeyword}
            />

            {/* Custom Meta Tag Overrides */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-navy">
                Custom Meta Tag Overrides (Optional)
              </h3>
              <p className="text-xs text-navy/60">
                By default, the title and excerpt will be used. You can provide customized meta tags below.
              </p>

              <div>
                <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1">
                  Custom Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder={formData.title || "Custom Google SERP Title"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy/70 uppercase tracking-wider mb-1">
                  Custom Meta Description
                </label>
                <textarea
                  rows={2}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder={formData.excerpt || "Custom Google SERP Description"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Media Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Sparkles size={16} className="text-purple" />
                  Upload Image to Supabase
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="rounded-lg p-1 text-navy/40 hover:bg-slate-100 hover:text-navy"
                >
                  <X size={18} />
                </button>
              </div>

              <ImageUploader
                label="Article Body Image"
                description="Upload image to insert directly into markdown"
                onInsertMarkdown={handleInsertMarkdown}
                onChange={() => {}}
                enableMarkdownCopy={true}
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-navy hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
