"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, Eye, Search } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: "draft" | "published";
  reading_time_minutes: number;
  published_at: string;
}

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts || []);
        setTotalCount(data.totalCount ?? (data.posts || []).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Failed to delete post.");
      }
    } catch {
      alert("An error occurred while deleting.");
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy">Blog &amp; Content Management</h1>
            <p className="mt-1 text-sm text-navy/60">
              Create, edit, and publish SEO blog posts and case study articles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPosts}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy/70 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/admin/blogs/new"
              className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus size={16} />
              Write New Article
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-purple focus:outline-none"
          />
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
        </div>

        {/* Posts Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-navy/50">
                  <th className="pb-3">Title &amp; Slug</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Reading Time</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50">
                    <td className="py-4">
                      <p className="font-semibold text-navy">{post.title}</p>
                      <p className="text-xs text-navy/40">/blog/{post.slug}</p>
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-navy/80">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-navy/60">
                      {post.reading_time_minutes} min read
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-navy/60">
                      {new Date(post.published_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-navy/60 hover:bg-slate-100 hover:text-purple"
                            title="View Public Post"
                          >
                            <Eye size={16} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blogs/${post.id}/edit`}
                          className="rounded-lg p-1.5 text-navy/60 hover:bg-slate-100 hover:text-purple"
                          title="Edit Post"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {posts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-navy/50">
                      No blog posts yet. Click &quot;Write New Article&quot; to publish your first post.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
