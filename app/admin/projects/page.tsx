"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Video,
  MessageSquare,
  Send,
  Sparkles,
  ChevronRight,
  Eye,
  Check,
  Calendar,
  X,
  Layers,
  User,
  Mail,
  Building,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  deliverable_url: string | null;
  order_index: number;
}

interface UpdateItem {
  id: string;
  title: string;
  summary: string;
  loom_url: string | null;
  published_at: string;
}

interface TicketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
}

interface Project {
  id: string;
  client_name: string;
  client_email: string;
  company_name: string;
  project_name: string;
  project_type: string;
  status: string;
  health_status: "on_track" | "at_risk" | "needs_client_input" | "completed";
  staging_url: string | null;
  production_url: string | null;
  figma_url: string | null;
  target_launch_date: string | null;
  created_at: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Detail Modal State
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [detailMilestones, setDetailMilestones] = useState<Milestone[]>([]);
  const [detailUpdates, setDetailUpdates] = useState<UpdateItem[]>([]);
  const [detailTickets, setDetailTickets] = useState<TicketItem[]>([]);
  const [detailTab, setDetailTab] = useState<"milestones" | "updates" | "tickets" | "settings">("milestones");
  const [detailLoading, setDetailLoading] = useState(false);

  // New Project Form
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("Custom Web Application & Engine");
  const [newStagingUrl, setNewStagingUrl] = useState("");
  const [newFigmaUrl, setNewFigmaUrl] = useState("");
  const [newScopeSummary, setNewScopeSummary] = useState("");
  const [newTargetLaunch, setNewTargetLaunch] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New Update Form
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateSummary, setUpdateSummary] = useState("");
  const [updateLoom, setUpdateLoom] = useState("");
  const [updateCompletedText, setUpdateCompletedText] = useState("");
  const [updateNextText, setUpdateNextText] = useState("");
  const [updateBlockersText, setUpdateBlockersText] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Ticket Response Form
  const [respondingTicketId, setRespondingTicketId] = useState<string | null>(null);
  const [ticketResponseText, setTicketResponseText] = useState("");
  const [ticketNewStatus, setTicketNewStatus] = useState<string>("resolved");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (data.ok) {
        setProjects(data.projects || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function openProjectDetail(id: string) {
    setSelectedProjectId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}`);
      const data = await res.json();
      if (data.ok) {
        setDetailProject(data.project);
        setDetailMilestones(data.milestones || []);
        setDetailUpdates(data.updates || []);
        setDetailTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setSubmittingProject(true);

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: newClientName,
          client_email: newClientEmail,
          company_name: newCompanyName,
          project_name: newProjectName,
          project_type: newProjectType,
          staging_url: newStagingUrl || null,
          figma_url: newFigmaUrl || null,
          scope_summary: newScopeSummary || null,
          target_launch_date: newTargetLaunch || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setCreateModalOpen(false);
      // Reset form
      setNewClientName("");
      setNewClientEmail("");
      setNewCompanyName("");
      setNewProjectName("");
      setNewStagingUrl("");
      setNewFigmaUrl("");
      setNewScopeSummary("");
      setNewTargetLaunch("");
      fetchProjects();
    } catch (err: unknown) {
      setCreateError((err as Error).message);
    } finally {
      setSubmittingProject(false);
    }
  }

  async function handleUpdateHealth(newHealth: string) {
    if (!detailProject) return;
    try {
      await fetch(`/api/admin/projects/${detailProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ health_status: newHealth }),
      });
      setDetailProject({ ...detailProject, health_status: newHealth as any });
      fetchProjects();
    } catch {
      // ignore
    }
  }

  async function handleMilestoneToggle(milestoneId: string, currentStatus: string) {
    if (!detailProject) return;
    const nextStatus = currentStatus === "completed" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "in_progress";
    try {
      await fetch(`/api/admin/projects/${detailProject.id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestone_id: milestoneId,
          status: nextStatus,
        }),
      });
      setDetailMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, status: nextStatus as any } : m))
      );
    } catch {
      // ignore
    }
  }

  async function handlePublishUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!detailProject || !updateTitle.trim()) return;

    setSubmittingUpdate(true);
    try {
      const completedList = updateCompletedText.split("\n").map((s) => s.trim()).filter(Boolean);
      const nextList = updateNextText.split("\n").map((s) => s.trim()).filter(Boolean);
      const blockerList = updateBlockersText.split("\n").map((s) => s.trim()).filter(Boolean);

      const res = await fetch(`/api/admin/projects/${detailProject.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updateTitle.trim(),
          summary: updateSummary.trim(),
          loom_url: updateLoom.trim() || null,
          completed_items: completedList,
          next_steps: nextList,
          blockers: blockerList,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setDetailUpdates([data.update, ...detailUpdates]);
        setUpdateTitle("");
        setUpdateSummary("");
        setUpdateLoom("");
        setUpdateCompletedText("");
        setUpdateNextText("");
        setUpdateBlockersText("");
      }
    } catch {
      // ignore
    } finally {
      setSubmittingUpdate(false);
    }
  }

  async function handleTicketResponse(ticketId: string) {
    if (!detailProject) return;
    try {
      const res = await fetch(`/api/admin/projects/${detailProject.id}/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_response: ticketResponseText,
          status: ticketNewStatus,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setDetailTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, admin_response: ticketResponseText, status: ticketNewStatus as any } : t))
        );
        setRespondingTicketId(null);
        setTicketResponseText("");
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Are you sure you want to delete this project workspace and all its records?")) return;
    try {
      await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      setSelectedProjectId(null);
      setDetailProject(null);
      fetchProjects();
    } catch {
      // ignore
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const healthColors: Record<string, string> = {
    on_track: "bg-emerald-100 text-emerald-800 border-emerald-300",
    at_risk: "bg-amber-100 text-amber-800 border-amber-300",
    needs_client_input: "bg-blue-100 text-blue-800 border-blue-300",
    completed: "bg-purple-100 text-purple-800 border-purple-300",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Client Projects & Workspaces</h1>
            <p className="text-sm text-slate-500">
              Manage client delivery roadmaps, publish weekly Loom updates, and track tickets.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
          >
            <Plus size={16} /> New Client Workspace
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, company, or client email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-navy placeholder-slate-400 shadow-sm focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading workspaces...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-navy">No Client Projects Yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a project workspace to invite clients and manage their delivery roadmap.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
            >
              <Plus size={14} /> Create First Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-lavender px-2 py-0.5 text-[11px] font-bold text-purple">
                      {p.company_name}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        healthColors[p.health_status] || healthColors.on_track
                      }`}
                    >
                      {p.health_status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-navy">{p.project_name}</h3>
                  <p className="text-xs text-slate-500">{p.project_type}</p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      {p.client_name} ({p.client_email})
                    </p>
                    {p.target_launch_date && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        Target: {new Date(p.target_launch_date).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openProjectDetail(p.id)}
                    className="flex items-center gap-1 text-xs font-bold text-purple hover:underline"
                  >
                    Open Management Hub <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="text-slate-400 hover:text-red-500"
                    title="Delete Project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-navy">Create Client Project Workspace</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-navy">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Client Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Client Email (Brevo Invite & Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@brand.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Company / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Project Workspace Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Next.js SaaS Web App & Portal"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Project Type
                  </label>
                  <input
                    type="text"
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    placeholder="e.g. Custom Web App & Platform"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Target Launch Date
                  </label>
                  <input
                    type="date"
                    value={newTargetLaunch}
                    onChange={(e) => setNewTargetLaunch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Staging URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newStagingUrl}
                    onChange={(e) => setNewStagingUrl(e.target.value)}
                    placeholder="https://staging.example.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Figma Prototype Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={newFigmaUrl}
                    onChange={(e) => setNewFigmaUrl(e.target.value)}
                    placeholder="https://figma.com/file/..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Scope Summary & Architecture Notes
                </label>
                <textarea
                  rows={3}
                  value={newScopeSummary}
                  onChange={(e) => setNewScopeSummary(e.target.value)}
                  placeholder="Key deliverables, integrations, responsive specifications..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-navy focus:border-purple focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-sm font-semibold text-white shadow hover:brightness-110 disabled:opacity-50"
                >
                  {submittingProject ? "Creating & Notifying..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAIL / MANAGEMENT DRAWER MODAL */}
      {selectedProjectId && detailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-lavender px-2 py-0.5 text-xs font-bold text-purple">
                    {detailProject.company_name}
                  </span>
                  <select
                    value={detailProject.health_status}
                    onChange={(e) => handleUpdateHealth(e.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-bold text-navy focus:outline-none"
                  >
                    <option value="on_track">🟢 On Track</option>
                    <option value="at_risk">🟠 At Risk</option>
                    <option value="needs_client_input">🔵 Needs Client Feedback</option>
                    <option value="completed">🟣 Completed / Live</option>
                  </select>
                </div>
                <h2 className="mt-1 text-lg font-bold text-navy">{detailProject.project_name}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  setDetailProject(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              {[
                { id: "milestones", label: `Milestones (${detailMilestones.length})` },
                { id: "updates", label: `Weekly Looms (${detailUpdates.length})` },
                { id: "tickets", label: `Client Tickets (${detailTickets.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    detailTab === tab.id
                      ? "border-purple text-purple"
                      : "border-transparent text-slate-500 hover:text-navy"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* SUBTAB 1: MILESTONES */}
              {detailTab === "milestones" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Click any checkbox to toggle milestone between Pending & Completed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {detailMilestones.map((m) => {
                      const isDone = m.status === "completed";
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                            isDone ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleMilestoneToggle(m.id, m.status)}
                              className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                                isDone
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white hover:border-purple"
                              }`}
                            >
                              {isDone && <Check size={14} className="stroke-[3]" />}
                            </button>
                            <div>
                              <p className={`text-sm font-bold ${isDone ? "text-emerald-900 line-through" : "text-navy"}`}>
                                {m.title}
                              </p>
                              {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                            </div>
                          </div>

                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: UPDATES & LOOMS */}
              {detailTab === "updates" && (
                <div className="space-y-6">
                  {/* Publish Form */}
                  <form onSubmit={handlePublishUpdate} className="rounded-xl border border-purple/20 bg-lavender/30 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
                      <Video size={14} /> Publish Weekly Briefing (Loom & Sprint)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        placeholder="Update Title (e.g. Sprint 2: Core Database & Auth Engine)"
                        className="rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                      />
                      <input
                        type="url"
                        value={updateLoom}
                        onChange={(e) => setUpdateLoom(e.target.value)}
                        placeholder="Loom Video Link (https://loom.com/share/...)"
                        className="rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={updateSummary}
                      onChange={(e) => setUpdateSummary(e.target.value)}
                      placeholder="Summary overview of the week's progress..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-emerald-700 mb-1">
                          Shipped (1 per line)
                        </label>
                        <textarea
                          rows={3}
                          value={updateCompletedText}
                          onChange={(e) => setUpdateCompletedText(e.target.value)}
                          placeholder="Shipped item 1&#10;Shipped item 2"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-blue-700 mb-1">
                          Next Week (1 per line)
                        </label>
                        <textarea
                          rows={3}
                          value={updateNextText}
                          onChange={(e) => setUpdateNextText(e.target.value)}
                          placeholder="Next item 1&#10;Next item 2"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-amber-700 mb-1">
                          Action Needed (1 per line)
                        </label>
                        <textarea
                          rows={3}
                          value={updateBlockersText}
                          onChange={(e) => setUpdateBlockersText(e.target.value)}
                          placeholder="Client review copy&#10;DNS access"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingUpdate}
                      className="flex items-center gap-2 rounded-lg bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      <Send size={12} />
                      {submittingUpdate ? "Publishing & Alerting Client..." : "Publish & Email Client"}
                    </button>
                  </form>

                  {/* Past Updates */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Published Updates
                    </h4>
                    {detailUpdates.map((u) => (
                      <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-navy">{u.title}</h5>
                          <span className="text-xs text-slate-400">
                            {new Date(u.published_at).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        {u.summary && <p className="mt-1 text-xs text-slate-600">{u.summary}</p>}
                        {u.loom_url && (
                          <a
                            href={u.loom_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple hover:underline"
                          >
                            <Video size={12} /> Watch Loom Recording
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: TICKETS */}
              {detailTab === "tickets" && (
                <div className="space-y-4">
                  {detailTickets.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No support tickets submitted by client.</p>
                  ) : (
                    detailTickets.map((t) => (
                      <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                              {t.category}
                            </span>
                            <span className="text-xs text-slate-400">{t.priority} priority</span>
                          </div>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            t.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <h4 className="mt-2 text-sm font-bold text-navy">{t.title}</h4>
                        <p className="mt-1 text-xs text-slate-600">{t.description}</p>

                        {t.admin_response && (
                          <div className="mt-3 rounded-lg bg-lavender/40 p-3 text-xs text-navy">
                            <span className="font-bold text-purple">Our Reply:</span> {t.admin_response}
                          </div>
                        )}

                        {respondingTicketId === t.id ? (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            <textarea
                              rows={2}
                              value={ticketResponseText}
                              onChange={(e) => setTicketResponseText(e.target.value)}
                              placeholder="Type response for the client..."
                              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-navy focus:outline-none"
                            />
                            <div className="flex items-center justify-between">
                              <select
                                value={ticketNewStatus}
                                onChange={(e) => setTicketNewStatus(e.target.value)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs"
                              >
                                <option value="in_review">Mark In Review</option>
                                <option value="resolved">Mark Resolved</option>
                                <option value="closed">Mark Closed</option>
                              </select>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRespondingTicketId(null)}
                                  className="px-2 py-1 text-xs text-slate-500"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTicketResponse(t.id)}
                                  className="rounded bg-purple px-3 py-1 text-xs font-bold text-white hover:brightness-110"
                                >
                                  Save Response
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => {
                                setRespondingTicketId(t.id);
                                setTicketResponseText(t.admin_response || "");
                              }}
                              className="text-xs font-bold text-purple hover:underline"
                            >
                              {t.admin_response ? "Edit Response" : "Reply to Ticket &rarr;"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
