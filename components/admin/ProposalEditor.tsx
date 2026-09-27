"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Mail
} from "lucide-react";
import { Proposal, ArchitectureModule, DeliverablePhase } from "@/lib/content/proposals";
import { EmailComposerModal, EmailComposerRecipient } from "@/components/admin/EmailComposerModal";

const defaultTechStack = [
  "Next.js 16 (App Router)",
  "TypeScript",
  "Supabase PostgreSQL (RLS)",
  "Tailwind CSS",
  "Cloudflare CDN & Edge",
  "Role-Based Access Control (RBAC)",
  "Stripe Billing & Webhooks"
];

const defaultModules: ArchitectureModule[] = [
  {
    name: "Central Admin & Operations Dashboard",
    description: "Management control room to monitor active jobs, staff assignments, and key performance indicators in real time.",
    deliverables: ["KPI dashboard", "User management with RBAC", "Real-time audit log", "1-click CSV/PDF export"],
    phase: "Phase 2"
  },
  {
    name: "Client / User Self-Service Portal",
    description: "Responsive portal enabling clients to submit requests, track progress, review documents, and make payments.",
    deliverables: ["Magic-link secure login", "Live order milestone tracker", "Digital document approval", "Automated email alerts"],
    phase: "Phase 2"
  }
];

const defaultPhases: DeliverablePhase[] = [
  {
    phase: "Phase 1: Architecture & Wireframing",
    duration: "Weeks 1–2",
    milestones: ["Database schema & ERD sign-off", "Figma user flows & UI kit", "RBAC permission matrix"]
  },
  {
    phase: "Phase 2: Core Engineering & Database Build",
    duration: "Weeks 3–5",
    milestones: ["PostgreSQL database & RLS deployment", "Admin & client portal UI build", "Authentication setup"]
  },
  {
    phase: "Phase 3: Integrations & Testing",
    duration: "Weeks 6–7",
    milestones: ["Payment & webhook integrations", "End-to-end security audit", "Stakeholder UAT testing"]
  },
  {
    phase: "Phase 4: Launch & Handover",
    duration: "Week 8",
    milestones: ["Production deployment to custom domain", "Staff training video handover", "100% IP & source code transfer"]
  }
];

export function ProposalEditor({
  initialData,
  isEdit = false,
}: {
  initialData?: Proposal;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);

  // Form Fields
  const [clientName, setClientName] = useState(initialData?.client_name || "");
  const [clientEmail, setClientEmail] = useState(initialData?.client_email || "");
  const [companyName, setCompanyName] = useState(initialData?.company_name || "");
  const [country, setCountry] = useState(initialData?.country || "United Kingdom");
  const [projectTitle, setProjectTitle] = useState(initialData?.project_title || "");
  const [systemType, setSystemType] = useState(initialData?.system_type || "Custom Web Application");
  const [scopeSummary, setScopeSummary] = useState(initialData?.scope_summary || "");
  const [problemStatement, setProblemStatement] = useState(initialData?.problem_statement || "");
  const [targetTimeline, setTargetTimeline] = useState(initialData?.target_timeline || "4–8 Weeks");
  const [budgetRange, setBudgetRange] = useState(initialData?.budget_range || "$6,500 – $15,000");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [validUntil, setValidUntil] = useState(
    () => initialData?.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [emailRecipient, setEmailRecipient] = useState<EmailComposerRecipient | null>(null);

  // Dynamic Lists
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.tech_stack
      ? Array.isArray(initialData.tech_stack)
        ? initialData.tech_stack
        : JSON.parse(initialData.tech_stack as any || "[]")
      : defaultTechStack
  );
  const [newTech, setNewTech] = useState("");

  const [modules, setModules] = useState<ArchitectureModule[]>(
    initialData?.architecture_modules
      ? Array.isArray(initialData.architecture_modules)
        ? initialData.architecture_modules
        : JSON.parse(initialData.architecture_modules as any || "[]")
      : defaultModules
  );

  const [phases, setPhases] = useState<DeliverablePhase[]>(
    initialData?.deliverable_phases
      ? Array.isArray(initialData.deliverable_phases)
        ? initialData.deliverable_phases
        : JSON.parse(initialData.deliverable_phases as any || "[]")
      : defaultPhases
  );

  // Sync when initialData loads or changes
  useEffect(() => {
    if (initialData) {
      setClientName(initialData.client_name || "");
      setClientEmail(initialData.client_email || "");
      setCompanyName(initialData.company_name || "");
      setCountry(initialData.country || "United Kingdom");
      setProjectTitle(initialData.project_title || "");
      setSystemType(initialData.system_type || "Custom Web Application");
      setScopeSummary(initialData.scope_summary || "");
      setProblemStatement(initialData.problem_statement || "");
      setTargetTimeline(initialData.target_timeline || "4–8 Weeks");
      setBudgetRange(initialData.budget_range || "$6,500 – $15,000");
      setStatus(initialData.status || "draft");
      setValidUntil(
        initialData.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
      );
      if (initialData.tech_stack) {
        setTechStack(
          Array.isArray(initialData.tech_stack)
            ? initialData.tech_stack
            : JSON.parse((initialData.tech_stack as any) || "[]")
        );
      }
      if (initialData.architecture_modules) {
        setModules(
          Array.isArray(initialData.architecture_modules)
            ? initialData.architecture_modules
            : JSON.parse((initialData.architecture_modules as any) || "[]")
        );
      }
      if (initialData.deliverable_phases) {
        setPhases(
          Array.isArray(initialData.deliverable_phases)
            ? initialData.deliverable_phases
            : JSON.parse((initialData.deliverable_phases as any) || "[]")
        );
      }
    }
  }, [initialData]);

  // Fetch recent bookings to populate from
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();
        if (data.ok) {
          setBookings(data.bookings || []);
        }
      } catch {
        // ignore
      }
    }
    if (!isEdit) {
      loadBookings();
    }
  }, [isEdit]);

  const handleSelectBooking = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookingId = e.target.value;
    if (!bookingId) return;
    const b = bookings.find((item) => item.id === bookingId);
    if (!b) return;

    setClientName(b.name || "");
    setClientEmail(b.work_email || "");
    setCompanyName(b.company_name || "");
    setCountry(b.country || "United Kingdom");
    setProblemStatement(b.message || "");
    setProjectTitle(`Custom Web Architecture Specification for ${b.company_name}`);
    setScopeSummary(`Bespoke operational platform designed to streamline internal workflows and automate key customer touchpoints for ${b.company_name}.`);
  };

  const handleAddTech = () => {
    if (!newTech.trim()) return;
    setTechStack([...techStack, newTech.trim()]);
    setNewTech("");
  };

  const handleRemoveTech = (idx: number) => {
    setTechStack(techStack.filter((_, i) => i !== idx));
  };

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        name: "New System Module",
        description: "Description of module architecture and business capabilities.",
        deliverables: ["Core deliverable item"],
        phase: "Phase 2"
      }
    ]);
  };

  const handleRemoveModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const handleModuleChange = (idx: number, field: keyof ArchitectureModule, val: any) => {
    const updated = [...modules];
    updated[idx] = { ...updated[idx], [field]: val };
    setModules(updated);
  };

  const handleDeliverableBulletChange = (mIdx: number, text: string) => {
    const bullets = text.split("\n").filter((l) => l.trim().length > 0);
    const updated = [...modules];
    updated[mIdx] = { ...updated[mIdx], deliverables: bullets };
    setModules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      client_name: clientName,
      client_email: clientEmail,
      company_name: companyName,
      country,
      project_title: projectTitle,
      system_type: systemType,
      scope_summary: scopeSummary,
      problem_statement: problemStatement,
      target_timeline: targetTimeline,
      budget_range: budgetRange,
      tech_stack: techStack,
      architecture_modules: modules,
      deliverable_phases: phases,
      status,
      valid_until: validUntil,
    };

    try {
      const targetIdentifier = initialData?.id || initialData?.slug;
      const url = isEdit && targetIdentifier ? `/api/admin/proposals/${targetIdentifier}` : "/api/admin/proposals";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to save proposal.");
        return;
      }

      router.push("/admin/proposals");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/proposals"
            className="rounded-xl border border-slate-200 bg-white p-2 text-navy/70 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              {isEdit ? "Edit Proposal" : "Create Technical Proposal"}
            </h1>
            <p className="text-xs text-navy/60">
              {isEdit ? `Ref Code: ${initialData?.slug}` : "Draft a bespoke architecture scope brief for a lead or client."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && initialData?.slug && (
            <>
              <button
                type="button"
                onClick={() =>
                  setEmailRecipient({
                    name: clientName,
                    email: clientEmail,
                    companyName: companyName,
                    proposalSlug: initialData.slug,
                    proposalId: initialData.id,
                    projectTitle,
                    scopeSummary,
                    budgetRange,
                    targetTimeline,
                    defaultTemplateId: "proposal_delivery",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple/30 bg-purple/10 px-3.5 py-2 text-xs font-bold text-purple hover:bg-purple/20 transition"
              >
                <Mail size={13} /> Email Spec to Client
              </button>

              <a
                href={`/proposals/${initialData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
              >
                <ExternalLink size={13} /> View Public Spec
              </a>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : isEdit ? "Update Proposal" : "Publish Proposal"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Populate from Booking (If New) */}
      {!isEdit && bookings.length > 0 && (
        <div className="rounded-2xl border border-purple/20 bg-purple/[0.03] p-4 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
            <Sparkles size={13} /> Pre-populate from recent discovery call booking:
          </label>
          <select
            onChange={handleSelectBooking}
            defaultValue=""
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy outline-none focus:border-purple"
          >
            <option value="">Select a booking to auto-fill client details…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.company_name} ({new Date(b.slot_start).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols): Core Details, Architecture & Modules */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Project Overview Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy/70">
              1. Project Overview & Scope
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Custom Freight Dispatch & Driver Tracking Portal"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  System Type *
                </label>
                <input
                  type="text"
                  required
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  placeholder="e.g. Operations Portal & Logistics Hub"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Target Timeline *
                </label>
                <input
                  type="text"
                  required
                  value={targetTimeline}
                  onChange={(e) => setTargetTimeline(e.target.value)}
                  placeholder="e.g. 6–8 Weeks"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Scope Summary *
              </label>
              <textarea
                rows={3}
                required
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                placeholder="High-level summary of the target solution..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Client Problem Statement / Current Bottlenecks (Optional)
              </label>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Current manual processes, lost data, or spreadsheet chaos..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Architecture Modules Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy/70">
                2. System Architecture Modules ({modules.length})
              </h2>
              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-purple hover:bg-purple/5"
              >
                <Plus size={13} /> Add Module
              </button>
            </div>

            <div className="space-y-4">
              {modules.map((mod, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={mod.name}
                      onChange={(e) => handleModuleChange(idx, "name", e.target.value)}
                      placeholder="Module Name"
                      className="font-bold text-xs text-navy bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1"
                    />
                    <input
                      type="text"
                      value={mod.phase || "Phase 2"}
                      onChange={(e) => handleModuleChange(idx, "phase", e.target.value)}
                      placeholder="Phase (e.g. Phase 2)"
                      className="w-24 text-xs font-semibold text-purple bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="text-navy/40 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={mod.description}
                    onChange={(e) => handleModuleChange(idx, "description", e.target.value)}
                    placeholder="Module description..."
                    className="w-full text-xs text-navy/80 bg-white border border-slate-200 rounded-lg p-2"
                  />

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1">
                      Deliverable Bullets (one per line):
                    </label>
                    <textarea
                      rows={3}
                      value={mod.deliverables ? mod.deliverables.join("\n") : ""}
                      onChange={(e) => handleDeliverableBulletChange(idx, e.target.value)}
                      placeholder="Interactive route calendar&#10;Driver assignment engine"
                      className="w-full text-xs text-navy/80 bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Matrix Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy/70">
              3. Technology Stack & Infrastructure
            </h2>

            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-navy"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(idx)}
                    className="text-navy/40 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder="Add technology (e.g. OpenAI GPT-4o, Stripe, PostgreSQL)..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-navy hover:bg-slate-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Client Details & Commercials */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy/70">
              Client & Company Details
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Client Contact Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Client Email *
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Morgan Logistics Ltd"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Country / Region *
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United Kingdom"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Commercials & Status Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy/70">
              Commercials & Validity
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Estimated Budget Range *
              </label>
              <input
                type="text"
                required
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                placeholder="e.g. $8,500 – $14,000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Proposal Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-navy outline-none focus:border-purple"
              >
                <option value="draft">Draft (Private)</option>
                <option value="sent">Sent to Client</option>
                <option value="accepted">Accepted / In Progress</option>
                <option value="completed">Completed / Handed Over</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={!!emailRecipient}
        recipient={emailRecipient}
        onClose={() => setEmailRecipient(null)}
        onSent={() => {
          setStatus("sent");
        }}
      />
    </form>
  );
}
