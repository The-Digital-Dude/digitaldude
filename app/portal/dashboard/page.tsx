"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Video,
  Plus,
  Send,
  MessageSquare,
  HelpCircle,
  FileCheck,
  Layout,
  LogOut,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Play,
  Copy,
  Check,
  Layers,
  Calendar,
  ShieldAlert,
  FolderGit2,
  FileText,
  User,
  Activity,
  Milestone as MilestoneIcon,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
  deliverable_url: string | null;
  order_index: number;
}

interface UpdateItem {
  id: string;
  title: string;
  summary: string;
  loom_url: string | null;
  completed_items: string[] | null;
  next_steps: string[] | null;
  blockers: string[] | null;
  published_at: string;
}

interface TicketItem {
  id: string;
  title: string;
  description: string;
  category: "general" | "bug" | "change_request" | "urgent";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_review" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ProjectData {
  id: string;
  client_name: string;
  client_email: string;
  company_name: string;
  project_name: string;
  project_type: string;
  status: "onboarding" | "discovery" | "in_progress" | "in_review" | "completed" | "paused";
  health_status: "on_track" | "at_risk" | "needs_client_input" | "completed";
  staging_url: string | null;
  production_url: string | null;
  figma_url: string | null;
  repo_url: string | null;
  assets_drive_url: string | null;
  contract_url: string | null;
  scope_summary: string | null;
  target_launch_date: string | null;
  kickoff_date: string | null;
}

type TabType = "roadmap" | "staging" | "changelog" | "tickets" | "scope";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("roadmap");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // New Ticket State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState<"general" | "bug" | "change_request" | "urgent">("general");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/dashboard");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load project details");
      }

      setProject(data.project);
      setMilestones(data.milestones || []);
      setUpdates(data.updates || []);
      setTickets(data.tickets || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/portal/auth/logout", { method: "POST" });
      router.push("/portal/login");
      router.refresh();
    } catch {
      router.push("/portal/login");
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      setTicketError("Please enter both title and description.");
      return;
    }

    setTicketSubmitting(true);
    setTicketError(null);
    setTicketSuccess(null);

    try {
      const res = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticketTitle.trim(),
          description: ticketDescription.trim(),
          category: ticketCategory,
          priority: ticketPriority,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create ticket.");
      }

      setTicketSuccess("Ticket dispatched to your dedicated engineering team.");
      setTicketTitle("");
      setTicketDescription("");
      setTimeout(() => {
        setTicketModalOpen(false);
        setTicketSuccess(null);
        fetchDashboardData();
      }, 1200);
    } catch (err: unknown) {
      setTicketError((err as Error).message);
    } finally {
      setTicketSubmitting(false);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  // Format embeddable loom URL
  function getLoomEmbedUrl(url: string | null) {
    if (!url) return null;
    if (url.includes("loom.com/embed/")) return url;
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
          <p className="text-sm text-slate-400">Loading your project workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131B2E] p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-xl font-bold">Workspace Unavailable</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error || "No active project workspace found associated with this email address."}
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-xl bg-purple px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const progressPct = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  const healthBadges = {
    on_track: { label: "On Track", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    at_risk: { label: "At Risk", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    needs_client_input: { label: "Needs Client Feedback", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { label: "Launched & Live", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  };

  const currentHealth = healthBadges[project.health_status || "on_track"];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple selection:text-white pb-20">
      {/* Top Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[600px] rounded-full bg-purple/15 blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo-full-color.png"
                alt="The Digital Dude"
                width={140}
                height={28}
                className="h-7 w-auto brightness-0 invert"
              />
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Portal
              </span>
            </Link>
            <div className="hidden h-5 w-[1px] bg-white/10 sm:block" />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{project.company_name}</p>
              <p className="text-[11px] text-slate-400">{project.project_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentHealth.color}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {currentHealth.label}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Project Banner Hero */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-[#131B2E] to-[#0B0F19] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  {project.project_type || "Custom Software & Web Engineering"}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {project.project_name}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Client Lead: <span className="text-slate-200">{project.client_name}</span> ({project.client_email})
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 min-w-[130px]">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Overall Progress</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{progressPct}%</span>
                  <span className="text-xs text-slate-400">{completedMilestones}/{milestones.length} done</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-purple to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {project.target_launch_date && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 min-w-[130px]">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Target Launch</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {new Date(project.target_launch_date).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              <button
                onClick={() => setTicketModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-purple px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple/20 transition hover:brightness-110 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Submit Request
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-px scrollbar-none">
            {[
              { id: "roadmap", label: "Roadmap & Milestones", icon: MilestoneIcon },
              { id: "staging", label: "Deliverables & Links", icon: ExternalLink },
              { id: "changelog", label: "Weekly Looms & Updates", icon: Video, badge: updates.length },
              { id: "tickets", label: "Support & Requests", icon: MessageSquare, badge: tickets.length },
              { id: "scope", label: "Scope & Agreements", icon: FileCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? "border-purple text-purple-400 bg-white/5 rounded-t-xl"
                      : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {typeof tab.badge === "number" && tab.badge > 0 && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* TAB 1: ROADMAP & MILESTONES */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Project Lifecycle Timeline</h2>
                <p className="text-xs text-slate-400">Step-by-step progress towards production handoff.</p>
              </div>
            </div>

            <div className="relative space-y-4 before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
              {milestones.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-8 text-center text-slate-400">
                  Milestones are currently being scheduled by your project manager.
                </div>
              ) : (
                milestones.map((m, idx) => {
                  const isDone = m.status === "completed";
                  const isInProgress = m.status === "in_progress";
                  return (
                    <div
                      key={m.id}
                      className={`relative flex items-start gap-4 rounded-2xl border p-5 transition ${
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : isInProgress
                          ? "border-purple/40 bg-purple/10 shadow-lg shadow-purple/5"
                          : "border-white/5 bg-[#131B2E]/60 text-slate-400"
                      }`}
                    >
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                          isDone
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : isInProgress
                            ? "bg-purple text-white ring-4 ring-purple/20 animate-pulse"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {isDone ? <Check className="h-5 w-5 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className={`text-base font-bold ${isDone ? "text-emerald-300" : isInProgress ? "text-white" : "text-slate-300"}`}>
                            {m.title}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                              isDone
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isInProgress
                                ? "bg-purple/30 text-purple-300"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {isDone ? "Completed" : isInProgress ? "In Progress" : "Pending"}
                          </span>
                        </div>

                        {m.description && (
                          <p className="mt-1 text-sm text-slate-400">{m.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          {m.due_date && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              Target Date: {new Date(m.due_date).toLocaleDateString("en-GB")}
                            </span>
                          )}
                          {m.deliverable_url && (
                            <a
                              href={m.deliverable_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Milestone Deliverable
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DELIVERABLES & STAGING */}
        {activeTab === "staging" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Staging URL Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-purple/30 bg-[#131B2E] p-6 shadow-xl">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple/20 text-purple-400">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Live Staging Preview</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Real-time engineering preview deployed on our high-speed edge infrastructure.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                {project.staging_url ? (
                  <div className="space-y-3">
                    <a
                      href={project.staging_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-semibold text-white hover:brightness-110 transition"
                    >
                      Open Staging Sandbox <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleCopy(project.staging_url!, "staging")}
                      className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      {copiedLink === "staging" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLink === "staging" ? "Copied to clipboard" : "Copy URL"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Staging link will appear once engine build begins.</p>
                )}
              </div>
            </div>

            {/* Production Domain */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Live Production Domain</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Your primary public website / web app URL.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                {project.production_url ? (
                  <a
                    href={project.production_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:brightness-110 transition"
                  >
                    Visit Live Production <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 italic">Scheduled for launch phase.</p>
                )}
              </div>
            </div>

            {/* Figma Prototype */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-6">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                  <Layout className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Figma Design & UI Specs</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Interactive UI components, design tokens, and wireframes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                {project.figma_url ? (
                  <a
                    href={project.figma_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 py-2.5 text-xs font-semibold text-pink-300 hover:bg-pink-500/20 transition"
                  >
                    Open Figma Workspace <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 italic">Design assets will be linked during discovery.</p>
                )}
              </div>
            </div>

            {/* GitHub Repo Card */}
            {project.repo_url && (
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <FolderGit2 className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Codebase Repository</h3>
                  <p className="mt-1 text-xs text-slate-400">Private client repository access.</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    View Repository <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Brand Assets Drive */}
            {project.assets_drive_url && (
              <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131B2E] p-6">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">Shared Brand Asset Drive</h3>
                  <p className="mt-1 text-xs text-slate-400">Logos, copy, typography, and image assets.</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href={project.assets_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 px-4 py-2.5 text-xs font-semibold hover:bg-blue-600/30 transition"
                  >
                    Open Google Drive <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WEEKLY ASYNC CHANGELOG & LOOMS */}
        {activeTab === "changelog" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Async Briefings</h2>
                <p className="text-xs text-slate-400">
                  Recorded video walkthroughs & sprint summaries published every Friday.
                </p>
              </div>
            </div>

            {updates.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-8 text-center text-slate-400">
                Your first sprint update will be recorded and published here.
              </div>
            ) : (
              updates.map((update) => {
                const loomEmbed = getLoomEmbedUrl(update.loom_url);
                return (
                  <div
                    key={update.id}
                    className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 shadow-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                          Sprint Update
                        </span>
                        <h3 className="text-lg font-bold text-white">{update.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(update.published_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Loom Video Player if available */}
                    {loomEmbed && (
                      <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black">
                        <div className="relative pb-[56.25%] h-0">
                          <iframe
                            src={loomEmbed}
                            frameBorder="0"
                            allowFullScreen
                            className="absolute top-0 left-0 h-full w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {update.summary && (
                      <p className="mt-4 text-sm leading-relaxed text-slate-300">
                        {update.summary}
                      </p>
                    )}

                    {/* Three column bullets */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Completed */}
                      {update.completed_items && update.completed_items.length > 0 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> What Shipped
                          </h4>
                          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                            {update.completed_items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {update.next_steps && update.next_steps.length > 0 && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                            <Clock className="h-3.5 w-3.5" /> Next Sprint Focus
                          </h4>
                          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                            {update.next_steps.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-400">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Blockers / Client Action */}
                      {update.blockers && update.blockers.length > 0 && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                            <AlertCircle className="h-3.5 w-3.5" /> Needed From Client
                          </h4>
                          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                            {update.blockers.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-400">&bull;</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: TICKETS & CHANGE REQUESTS */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Support & Change Requests</h2>
                <p className="text-xs text-slate-400">
                  Ask questions, report edge-case bugs, or request scope additions directly.
                </p>
              </div>
              <button
                onClick={() => setTicketModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-semibold text-white shadow hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> New Ticket
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-8 text-center text-slate-400">
                No tickets open. Use the button above to request anything from the engineering team.
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((t) => {
                  const statusStyles = {
                    open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                    in_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                    resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                    closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
                  };
                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-white/10 bg-[#131B2E] p-5 shadow-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[t.status]}`}>
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-slate-400 uppercase tracking-wider">
                            {t.category.replace("_", " ")} &bull; {t.priority} priority
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(t.created_at).toLocaleDateString("en-GB")}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-white">{t.title}</h3>
                      <p className="mt-1 text-sm text-slate-300 leading-relaxed">{t.description}</p>

                      {t.admin_response && (
                        <div className="mt-4 rounded-xl border border-purple/30 bg-purple/10 p-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                            <Sparkles className="h-3.5 w-3.5" /> Digital Dude Response:
                          </div>
                          <p className="mt-1 text-xs text-slate-200 leading-relaxed">
                            {t.admin_response}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCOPE & AGREEMENTS */}
        {activeTab === "scope" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-white">Project Scope Summary</h2>
              <p className="mt-1 text-xs text-slate-400">
                Agreed contract parameters, inclusions, and architecture boundaries.
              </p>

              <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-4 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                {project.scope_summary || "Full bespoke web application & high-converting digital platform architecture."}
              </div>

              {project.contract_url && (
                <div className="mt-6 flex items-center justify-between rounded-xl border border-purple/30 bg-purple/10 p-4">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Master Service Agreement</p>
                      <p className="text-[11px] text-slate-400">Executed proposal and scope document</p>
                    </div>
                  </div>
                  <a
                    href={project.contract_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-purple px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    View Document <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Dedicated Contacts */}
            <div className="rounded-2xl border border-white/10 bg-[#131B2E] p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Dedicated Team Contacts</h3>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                    Lead Solutions Architect
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">Farhad Neiloy</p>
                  <a
                    href="mailto:info@digitaldude.co.uk"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    info@digitaldude.co.uk
                  </a>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Emergency Engineering Line
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    For production outages or urgent DNS/SSL blockers, flag ticket as &ldquo;Urgent&rdquo;.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE TICKET MODAL */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#131B2E] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Create Request / Ticket</h3>
              <button
                onClick={() => setTicketModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {ticketError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {ticketError}
              </div>
            )}

            {ticketSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {ticketSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Header typography tweak or question about auth flow"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-purple focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2.5 text-xs text-white focus:border-purple focus:outline-none"
                  >
                    <option value="general">General Question</option>
                    <option value="bug">Bug Report</option>
                    <option value="change_request">Scope Change / Addon</option>
                    <option value="urgent">Urgent Blocker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2.5 text-xs text-white focus:border-purple focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Detailed Description & Steps
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Provide context, URLs, or specific requirements..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-purple focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-purple px-5 py-2.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
