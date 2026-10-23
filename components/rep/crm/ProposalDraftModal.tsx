"use client";

import { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, Loader2, Layers, Calendar, DollarSign, Plus, Trash2 } from "lucide-react";
import { PROPOSAL_BLUEPRINTS, ProposalBlueprint } from "@/lib/crm/proposals";
import { Proposal, ArchitectureModule, DeliverablePhase } from "@/lib/content/proposals";
import { parseLeadIntelligence } from "@/lib/crm/intelligence";
import { CrmLead } from "./shared";

interface Props {
  lead: CrmLead;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (p: Proposal) => void;
}

const field = "w-full rounded-lg bg-[#0D1322] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition";
const label = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1";

export function ProposalDraftModal({ lead, isOpen, onClose, onCreated }: Props) {
  const intel = parseLeadIntelligence(lead.notes);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(PROPOSAL_BLUEPRINTS[0].id);
  const activeBlueprint = PROPOSAL_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) || PROPOSAL_BLUEPRINTS[0];

  const company = lead.company_name || lead.full_name;
  const currency = lead.currency || "USD";
  const defaultMin = lead.estimated_deal_value ? Math.round(lead.estimated_deal_value * 0.8) : activeBlueprint.defaultBudgetMin;
  const defaultMax = lead.estimated_deal_value || activeBlueprint.defaultBudgetMax;

  const [projectTitle, setProjectTitle] = useState(`${activeBlueprint.name.split("&")[0].trim()} for ${company}`);
  const [systemType, setSystemType] = useState(activeBlueprint.systemType);
  const [targetTimeline, setTargetTimeline] = useState(activeBlueprint.targetTimeline);
  const [budgetRange, setBudgetRange] = useState(`${currency} ${defaultMin.toLocaleString()} – ${defaultMax.toLocaleString()}`);
  const [scopeSummary, setScopeSummary] = useState(
    intel.solution
      ? intel.solution.slice(0, 450)
      : `Bespoke ${activeBlueprint.systemType.toLowerCase()} custom-engineered for ${company} to streamline operations, eliminate spreadsheet patchwork, and establish automated client workflows.`
  );
  const [problemStatement, setProblemStatement] = useState(
    intel.painPoints
      ? `Identified operational bottleneck: ${intel.painPoints.slice(0, 400)}`
      : lead.notes?.trim()
      ? `Identified operational bottleneck: ${lead.notes.slice(0, 300)}`
      : `Currently constrained by manual spreadsheet administration, delayed client communication, and disconnected operational tools.`
  );
  const [techStack, setTechStack] = useState<string[]>(activeBlueprint.techStack);
  const [modules, setModules] = useState<ArchitectureModule[]>(activeBlueprint.architectureModules);
  const [phases, setPhases] = useState<DeliverablePhase[]>(activeBlueprint.deliverablePhases);

  const [aiSynthesizing, setAiSynthesizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSelectBlueprint(bpId: string) {
    setSelectedBlueprintId(bpId);
    const bp = PROPOSAL_BLUEPRINTS.find((b) => b.id === bpId) || PROPOSAL_BLUEPRINTS[0];
    setProjectTitle(`${bp.name.split("&")[0].trim()} for ${company}`);
    setSystemType(bp.systemType);
    setTargetTimeline(bp.targetTimeline);
    const minVal = lead.estimated_deal_value ? Math.round(lead.estimated_deal_value * 0.8) : bp.defaultBudgetMin;
    const maxVal = lead.estimated_deal_value || bp.defaultBudgetMax;
    setBudgetRange(`${currency} ${minVal.toLocaleString()} – ${maxVal.toLocaleString()}`);
    setScopeSummary(
      `Bespoke ${bp.systemType.toLowerCase()} custom-engineered for ${company} to streamline operations, eliminate spreadsheet patchwork, and establish automated client workflows.`
    );
    setTechStack(bp.techStack);
    setModules(bp.architectureModules);
    setPhases(bp.deliverablePhases);
  }

  async function handleAiTailor() {
    setAiSynthesizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/rep/leads/${lead.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          synthesizeOnly: true,
          blueprintId: selectedBlueprintId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.tailored) {
        setScopeSummary(data.tailored.scopeSummary);
        if (data.tailored.problemStatement) setProblemStatement(data.tailored.problemStatement);
        if (data.tailored.architectureModules) setModules(data.tailored.architectureModules);
      } else {
        setError(data.error || "Could not synthesize AI spec. Using standard blueprint.");
      }
    } catch {
      setError("AI service unavailable. Using blueprint.");
    } finally {
      setAiSynthesizing(false);
    }
  }

  async function handleSave(status: "draft" | "sent") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rep/leads/${lead.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: projectTitle.trim(),
          systemType: systemType.trim(),
          scopeSummary: scopeSummary.trim(),
          problemStatement: problemStatement.trim(),
          targetTimeline: targetTimeline.trim(),
          budgetRange: budgetRange.trim(),
          techStack,
          architectureModules: modules,
          deliverablePhases: phases,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to create proposal.");
        setSaving(false);
        return;
      }

      // Copy link if published
      if (status === "sent" && typeof navigator !== "undefined" && navigator.clipboard) {
        const fullUrl = `${window.location.origin}/proposals/${data.proposal.slug}`;
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      }

      onCreated(data.proposal);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-2xl rounded-3xl bg-[#090D16] border border-white/10 p-6 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple/20 text-purple border border-purple/30">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Draft Bespoke Technical Specification</h2>
            <p className="text-xs text-slate-400">
              For <strong className="text-white">{company}</strong> · {lead.full_name}
            </p>
          </div>
        </div>

        {/* Blueprint selector */}
        <div className="mt-5">
          <label className={label}>Select Architectural Blueprint</label>
          <div className="grid grid-cols-2 gap-2">
            {PROPOSAL_BLUEPRINTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleSelectBlueprint(bp.id)}
                className={`rounded-xl p-3 text-left border transition ${
                  selectedBlueprintId === bp.id
                    ? "bg-purple/15 border-purple text-white shadow-xs"
                    : "bg-[#0D1322] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10"
                }`}
              >
                <div className="text-xs font-bold text-white">{bp.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{bp.targetTimeline}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Tailoring action bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-purple/10 border border-purple/20 p-3">
          <div className="text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple" /> AI Discovery Synthesis
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Synthesize lead notes, pain points, and deal value into custom architecture modules.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAiTailor}
            disabled={aiSynthesizing}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-purple px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition"
          >
            {aiSynthesizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiSynthesizing ? "Tailoring…" : "Tailor with AI"}
          </button>
        </div>

        {/* Core fields */}
        <div className="mt-4 space-y-3">
          <div>
            <label className={label}>Project Title</label>
            <input className={field} value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>System Type</label>
              <input className={field} value={systemType} onChange={(e) => setSystemType(e.target.value)} />
            </div>
            <div>
              <label className={label}>Timeline</label>
              <input className={field} value={targetTimeline} onChange={(e) => setTargetTimeline(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={label}>Budget Range / Estimate</label>
            <input className={field} value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} />
          </div>

          <div>
            <label className={label}>Scope Summary</label>
            <textarea
              className={`${field} min-h-[60px]`}
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
            />
          </div>

          <div>
            <label className={label}>Problem Statement / Discovery Context</label>
            <textarea
              className={`${field} min-h-[60px]`}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />
          </div>
        </div>

        {/* Modules preview */}
        <div className="mt-4">
          <label className={label}>Architecture Modules ({modules.length})</label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {modules.map((m, idx) => (
              <div key={idx} className="rounded-lg border border-white/[0.06] bg-[#0D1322] p-2.5 text-xs">
                <div className="font-bold text-white flex justify-between">
                  <span>{m.name}</span>
                  <span className="text-[10px] text-purple">{m.phase}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.deliverables.slice(0, 3).map((d, dIdx) => (
                    <span key={dIdx} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("draft")}
              className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("sent")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md shadow-purple/20 transition"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Generate Secure Link &amp; Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
