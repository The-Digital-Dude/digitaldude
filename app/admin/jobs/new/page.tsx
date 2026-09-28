"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { JobPostingEditor } from "@/components/admin/JobPostingEditor";

export default function NewJobPostingPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">New Job Posting</h1>
          <p className="text-sm text-navy/60">Create a new role for the public careers page.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <JobPostingEditor />
        </div>
      </div>
    </AdminLayout>
  );
}
