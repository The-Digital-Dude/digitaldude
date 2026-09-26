'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Sparkles, 
  AlertCircle,
  Clock,
  Tag,
  Image as ImageIcon,
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) throw new Error('Failed to load post');
        const data = await res.json();
        if (data.post) {
          setFormData({
            title: data.post.title || '',
            slug: data.post.slug || '',
            excerpt: data.post.excerpt || '',
            content: data.post.content || '',
            category: data.post.category || 'SEO & Performance',
            cover_image: data.post.cover_image || '',
            status: data.post.status || 'draft',
            author: data.post.author || 'The Digital Dude Team'
          });
        }
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const handleUpdate = async (publishStatus?: string) => {
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
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update blog post');
      }

      router.push('/admin/blogs');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this blog post?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete post');
      router.push('/admin/blogs');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blogs"
              className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Edit Article</h1>
              <p className="text-sm text-slate-400">Update content, SEO tags, or publication status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              {showPreview ? 'Edit Mode' : 'Live Preview'}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="p-2 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg transition-colors"
              title="Delete Article"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {formData.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {calculateReadTime(formData.content)} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {formData.title || 'Untitled Article'}
            </h1>

            {formData.excerpt && (
              <p className="text-lg text-slate-300 leading-relaxed border-l-2 border-cyan-500/40 pl-4 italic">
                {formData.excerpt}
              </p>
            )}

            {formData.cover_image && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.cover_image} 
                  alt={formData.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            <div className="prose prose-invert prose-cyan max-w-none text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans text-base">
              {formData.content || 'No content written yet...'}
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 7 Proven E-Commerce SEO Strategies That Doubled Revenue"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-medium text-lg outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                    <span className="px-3 text-slate-500 text-sm font-mono border-r border-slate-800">
                      /blog/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e-commerce-seo-strategies"
                      className="w-full bg-transparent px-3 py-2.5 text-white font-mono text-sm outline-none placeholder-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    SEO Excerpt / Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief 1-2 sentence overview for search engine snippets and social sharing cards..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {formData.excerpt.length}/160 recommended characters
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Article Content (Markdown supported) *
                    </label>
                    <span className="text-xs text-cyan-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{calculateReadTime(formData.content)} min read
                    </span>
                  </div>
                  <textarea
                    rows={16}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-slate-200 placeholder-slate-600 font-mono text-sm outline-none transition-colors leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Meta Info */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Post Settings
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Public)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cover Image URL
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-500">
                    <span className="p-2.5 text-slate-500">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={formData.cover_image}
                      onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-transparent pr-3 py-2 text-white text-sm outline-none placeholder-slate-600"
                    />
                  </div>
                  {formData.cover_image && (
                    <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
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

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Saving as published will update the public blog index and search engine crawlers immediately.
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
