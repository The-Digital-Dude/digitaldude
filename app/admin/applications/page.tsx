"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RefreshCw, Search, FileText, Image as ImageIcon, X, UserPlus, Trash2 } from "lucide-react";

interface Application {
  id: string;
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  cv_path: string;
  proof_of_results_path: string | null;
  written_test_response: string;
  status: string;
  internal_notes: string;
  created_at: string;
  job_postings?: { title: string; slug: string };
}

const STATUS_OPTIONS = ["new", "reviewing", "interview", "offered", "hired", "rejected"];

function statusBadgeClass(status: string) {
  switch (status) {
    case "hired":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offered":
      return "bg-purple/10 text-purple border-purple/20";
    case "interview":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "reviewing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [converting, setConverting] = useState(false);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (data.ok) setApplications(data.applications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.ok) {
      setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
      if (selected?.id === id) setSelected(data.application);
    } else {
      alert(data.error || "Failed to update status.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete application from "${name}"? This also removes their uploaded files.`)) return;
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      alert(data.error || "Failed to delete application.");
    }
  }

  async function viewDocument(id: string, type: "cv" | "proof") {
    const res = await fetch(`/api/admin/applications/${id}/documents/${type}`);
    const data = await res.json();
    if (data.ok) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else {
      alert(data.error || "Could not open this file.");
    }
  }

  async function convertToEmployee(app: Application) {
    if (!confirm(`Create an employee record for ${app.applicant_name}?`)) return;
    setConverting(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: app.applicant_name,
          email: app.applicant_email,
          role_title: app.job_postings?.title || "",
          source_application_id: app.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Employee created. Set their commission rates from the Employees page.");
        fetchApplications();
        setSelected(null);
      } else {
        alert(data.error || "Failed to create employee.");
      }
    } finally {
      setConverting(false);
    }
  }

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      a.applicant_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Applications</h1>
            <p className="text-sm text-navy/60">Review, move through stages, and convert candidates into employees.</p>
          </div>
          <button
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-navy/60">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-navy outline-none focus:border-purple"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading applications…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Applied</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setSelected(app)}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy">{app.applicant_name}</div>
                        <div className="text-[11px] text-navy/60">{app.applicant_email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-navy/70">{app.job_postings?.title || "—"}</td>
                      <td className="py-3.5 px-4 text-navy/60">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDelete(app.id, app.applicant_name)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">{selected.applicant_name}</h2>
                <p className="text-sm text-navy/60">{selected.applicant_email}{selected.applicant_phone ? ` · ${selected.applicant_phone}` : ""}</p>
                <p className="text-xs text-navy/50 mt-1">Applied for {selected.job_postings?.title || "—"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                    selected.status === s ? statusBadgeClass(s) : "border-slate-200 text-navy/50 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => viewDocument(selected.id, "cv")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
              >
                <FileText size={14} /> View CV
              </button>
              {selected.proof_of_results_path && (
                <button
                  onClick={() => viewDocument(selected.id, "proof")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
                >
                  <ImageIcon size={14} /> View Proof of Results
                </button>
              )}
              {selected.status === "hired" && (
                <button
                  onClick={() => convertToEmployee(selected)}
                  disabled={converting}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-3.5 py-2 text-xs font-bold text-white hover:bg-purple/90 disabled:opacity-50"
                >
                  <UserPlus size={14} /> {converting ? "Converting…" : "Convert to Employee"}
                </button>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-1.5">Written Test Response</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-navy/80">
                {selected.written_test_response}
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
