"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface JobPosting {
  id?: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employment_type: string;
  compensation_summary: string;
  description: string;
  status: string;
}

export function JobPostingEditor({
  initialData,
  isEdit = false,
}: {
  initialData?: JobPosting;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [department, setDepartment] = useState(initialData?.department || "General");
  const [location, setLocation] = useState(initialData?.location || "Remote");
  const [employmentType, setEmploymentType] = useState(initialData?.employment_type || "Full-time");
  const [compensationSummary, setCompensationSummary] = useState(initialData?.compensation_summary || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      slug: slug || undefined,
      department,
      location,
      employment_type: employmentType,
      compensation_summary: compensationSummary,
      description,
      status,
    };

    try {
      const url = isEdit ? `/api/admin/jobs/${initialData?.id}` : "/api/admin/jobs";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Failed to save job posting.");
        setSaving(false);
        return;
      }
      router.push("/admin/jobs");
      router.refresh();
    } catch {
      setError("Network error while saving.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple"
            placeholder="Business Development Executive"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
            URL Slug {isEdit ? "(leave blank to keep current)" : "(optional, auto-generated from title)"}
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple font-mono"
            placeholder="business-development-executive"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">Department</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">Employment Type</label>
          <input
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
          Compensation Summary
        </label>
        <textarea
          value={compensationSummary}
          onChange={(e) => setCompensationSummary(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy outline-none focus:border-purple"
          placeholder="Meeting bonus, commission structure, base salary pathway..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
          Full Description (Markdown)
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={16}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-navy font-mono outline-none focus:border-purple"
          placeholder="## About Us&#10;&#10;...&#10;&#10;## The Role&#10;&#10;..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-navy outline-none focus:border-purple sm:w-64"
        >
          <option value="draft">Draft (not public)</option>
          <option value="open">Open (accepting applications)</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-purple px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Job Posting"}
        </button>
      </div>
    </form>
  );
}
