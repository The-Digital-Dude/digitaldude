"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  ScrollText,
  Copy,
  Check,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Mail,
} from "lucide-react";
import { Proposal } from "@/lib/content/proposals";
import { EmailComposerModal, EmailComposerRecipient } from "@/components/admin/EmailComposerModal";

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<EmailComposerRecipient | null>(null);

  async function fetchProposals() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/proposals");
      const data = await res.json();
      if (data.ok) {
        setProposals(data.proposals || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProposals();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete proposal "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/proposals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setProposals((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
      } else {
        alert(data.error || "Failed to delete proposal.");
      }
    } catch {
      alert("An error occurred while deleting.");
    }
  }

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/proposals/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Proposals & Architecture Specs
            </h1>
            <p className="text-sm text-navy/60">
              Create, customize, and track bespoke technical proposals and project scopes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProposals}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>

            <Link
              href="/admin/proposals/new"
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs"
            >
              <Plus size={15} /> Create Proposal
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by client, company, project title, or ref code..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading proposals…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">
              No proposals found. Click &ldquo;Create Proposal&rdquo; to draft one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3 px-4">Ref / Title</th>
                    <th className="py-3 px-4">Client & Company</th>
                    <th className="py-3 px-4">System Type</th>
                    <th className="py-3 px-4">Budget / Timeline</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-purple">
                          {item.slug}
                        </div>
                        <div className="font-bold text-navy mt-0.5 max-w-xs truncate">
                          {item.project_title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-navy">{item.company_name}</div>
                        <div className="text-[11px] text-navy/60">{item.client_name} ({item.client_email})</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-navy/80">
                          <Layers size={11} className="text-purple" /> {item.system_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-navy">{item.budget_range}</div>
                        <div className="text-[11px] text-navy/60">{item.target_timeline}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "sent"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.status === "completed"
                              ? "bg-purple/10 text-purple border border-purple/20"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setEmailRecipient({
                                name: item.client_name,
                                email: item.client_email,
                                companyName: item.company_name,
                                proposalSlug: item.slug,
                                proposalId: item.id,
                                bookingId: item.booking_id || undefined,
                                projectTitle: item.project_title,
                                scopeSummary: item.scope_summary,
                                budgetRange: item.budget_range,
                                targetTimeline: item.target_timeline,
                                defaultTemplateId: "proposal_delivery",
                              })
                            }
                            title="Email Proposal to Client via Brevo"
                            className="rounded-lg p-1.5 text-purple hover:bg-purple/10 transition"
                          >
                            <Mail size={14} />
                          </button>

                          <button
                            onClick={() => handleCopyLink(item.slug)}
                            title="Copy Public Proposal Link"
                            className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100 hover:text-navy transition"
                          >
                            {copiedId === item.slug ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>

                          <a
                            href={`/proposals/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Public Spec View"
                            className="rounded-lg p-1.5 text-navy/50 hover:bg-slate-100 hover:text-navy transition"
                          >
                            <ExternalLink size={14} />
                          </a>

                          <Link
                            href={`/admin/proposals/${item.id}/edit`}
                            title="Edit Proposal"
                            className="rounded-lg p-1.5 text-navy/50 hover:bg-purple/10 hover:text-purple transition"
                          >
                            <Edit size={14} />
                          </Link>

                          <button
                            onClick={() => handleDelete(item.id, item.project_title)}
                            title="Delete Proposal"
                            className="rounded-lg p-1.5 text-navy/50 hover:bg-red-50 hover:text-red-600 transition"
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

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={!!emailRecipient}
        recipient={emailRecipient}
        onClose={() => setEmailRecipient(null)}
        onSent={() => {
          fetchProposals();
        }}
      />
    </AdminLayout>
  );
}
