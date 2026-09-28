"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { JobPostingEditor } from "@/components/admin/JobPostingEditor";

export default function EditJobPostingPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setJob(data.job);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Edit Job Posting</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          {loading ? (
            <p className="text-sm text-navy/60">Loading…</p>
          ) : job ? (
            <JobPostingEditor initialData={job} isEdit />
          ) : (
            <p className="text-sm text-red-600">Job posting not found.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
