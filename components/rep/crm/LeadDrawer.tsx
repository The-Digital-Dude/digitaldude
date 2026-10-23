"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENCIES, LOST_REASONS, LOST_REASON_LABELS, STAGES, STAGE_LABELS, STATUSES, STATUS_LABELS, CALL_OUTCOMES, MEETING_OUTCOMES, MESSAGE_OUTCOMES, type Stage } from "@/lib/crm/model";
import { Proposal } from "@/lib/content/proposals";
import { ProposalDraftModal } from "./ProposalDraftModal";
import { CrmLead, GRADE_STYLE, HEAT_STYLE, crm, dueLabel, when } from "./shared";
import { ExternalLink, Copy, FileCheck2, Eye, FileText, Send, Globe, Linkedin, Zap, Check, Pencil } from "lucide-react";
import { formatLeadIntelligenceNotes, parseLeadIntelligence, generateExecutivePitch, generateDirectMessagePitch } from "@/lib/crm/intelligence";

interface Activity { id: string; type: string; outcome: string | null; summary: string; occurred_at: string }
interface Task { id: string; title: string; due_at: string; status: string; kind: string; auto: boolean; cancel_reason?: string | null }

const field = "w-full rounded-lg bg-[#0D1322] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20";
const label = "block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1";
const btn = "rounded-lg bg-purple px-3 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition";
const btnGhost = "rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50 transition";

const ACTIVITY_OUTCOMES: Record<string, readonly string[]> = { call: CALL_OUTCOMES, meeting: MEETING_OUTCOMES, linkedin: MESSAGE_OUTCOMES, whatsapp: MESSAGE_OUTCOMES, note: [] };
const ACTIVITY_LABEL: Record<string, string> = { call: "Phone call", meeting: "Meeting", linkedin: "LinkedIn message", whatsapp: "WhatsApp message", note: "Note" };
const pretty = (s: string) => s.replace(/_/g, " ");

/** Local "datetime-local" value for a date. */
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const DAY_MS = 24 * 3_600_000;
/** Tomorrow, at the same time of day. */
const tomorrowInput = () => toLocalInput(new Date(Date.now() + DAY_MS));
/** One day after the later of now and the task's due time (so snoozing an overdue task moves it to tomorrow, not yesterday). */
const snoozedDue = (dueIso: string) => new Date(Math.max(Date.now(), new Date(dueIso).getTime()) + DAY_MS).toISOString();

export function LeadDrawer({
  lead,
  onClose,
  onChanged,
  onEmail,
  onEditContact,
  onErased,
}: {
  lead: CrmLead;
  onClose: () => void;
  onChanged: () => void;
  onEmail: (l: CrmLead, pitch?: { subject: string; body: string }) => void;
  onEditContact: (l: CrmLead) => void;
  onErased: () => void;
}) {
  const intel = parseLeadIntelligence(lead.notes);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingResearch, setEditingResearch] = useState(false);
  const [researchDraft, setResearchDraft] = useState({
    website: intel.website ?? "",
    linkedinUrl: intel.linkedinUrl ?? "",
    location: intel.location ?? "",
    industry: intel.industry ?? "",
    techStack: intel.techStack.join(", "),
    painPoints: intel.painPoints ?? "",
    solution: intel.solution ?? "",
    qcBy: intel.qcBy ?? "",
    priority: intel.priority ?? "",
    fitScore: intel.fitScore == null ? "" : String(intel.fitScore),
    generalNotes: intel.generalNotes ?? "",
  });

  // Deal fields (edited together and saved with one button).
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [status, setStatus] = useState(lead.status ?? "new");
  const [lostReason, setLostReason] = useState(lead.lost_reason ?? "");
  const [lostNote, setLostNote] = useState(lead.lost_note ?? "");
  const [value, setValue] = useState(String(lead.estimated_deal_value ?? 0));
  const [currency, setCurrency] = useState(lead.currency || "BDT");
  const [closeDate, setCloseDate] = useState(lead.expected_close_date ?? "");
  const [probability, setProbability] = useState(lead.probability == null ? "" : String(lead.probability));
  const [country, setCountry] = useState(lead.country ?? "");
  const [tags, setTags] = useState((lead.tags ?? []).join(", "));

  // New activity / task forms.
  const [aType, setAType] = useState("call");
  const [aOutcome, setAOutcome] = useState("");
  const [aSummary, setASummary] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [tDue, setTDue] = useState(tomorrowInput);

  const load = useCallback(async () => {
    const r = await crm<{ activities: Activity[]; tasks: Task[]; proposals?: Proposal[] }>(`/api/rep/leads/${lead.id}`);
    if (r.ok) {
      setActivities(r.activities ?? []);
      setTasks(r.tasks ?? []);
      if (r.proposals) setProposals(r.proposals);
    }
  }, [lead.id, setActivities, setTasks, setProposals]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const next = parseLeadIntelligence(lead.notes);
    setResearchDraft({
      website: next.website ?? "",
      linkedinUrl: next.linkedinUrl ?? "",
      location: next.location ?? "",
      industry: next.industry ?? "",
      techStack: next.techStack.join(", "),
      painPoints: next.painPoints ?? "",
      solution: next.solution ?? "",
      qcBy: next.qcBy ?? "",
      priority: next.priority ?? "",
      fitScore: next.fitScore == null ? "" : String(next.fitScore),
      generalNotes: next.generalNotes ?? "",
    });
  }, [lead.id, lead.notes]);

  const flash = (ok: boolean, text: string) => setMsg({ ok, text });

  async function saveDeal() {
    if (stage === "lost" && lead.stage !== "lost" && !lostReason) return flash(false, "Choose why this deal was lost.");
    setBusy(true);
    const patch: Record<string, unknown> = {
      stage, status,
      estimated_deal_value: Number(value) || 0,
      currency,
      expected_close_date: closeDate || null,
      probability: probability === "" ? null : Number(probability),
      country: country.trim() ? country.trim().toUpperCase() : null,
      tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    };
    if (stage === "lost") { patch.lost_reason = lostReason || null; patch.lost_note = lostNote.trim() || null; }
    const r = await crm(`/api/rep/leads/${lead.id}`, "PATCH", patch);
    setBusy(false);
    if (!r.ok) return flash(false, r.error ?? "Could not save");
    flash(true, "Saved.");
    onChanged();
    void load();
  }

  async function saveResearch() {
    if (!researchDraft.painPoints.trim() || !researchDraft.solution.trim()) return flash(false, "Pain Point / Trigger and Proposed Solution are both required.");
    const fitScore = researchDraft.fitScore.trim() === "" ? undefined : Number(researchDraft.fitScore);
    if (fitScore !== undefined && (!Number.isInteger(fitScore) || fitScore < 0 || fitScore > 100)) return flash(false, "Research fit score must be a whole number from 0 to 100.");
    setBusy(true);
    const notes = formatLeadIntelligenceNotes({
      ...researchDraft,
      fitScore,
      notes: researchDraft.generalNotes,
    });
    const r = await crm(`/api/rep/leads/${lead.id}`, "PATCH", { notes });
    setBusy(false);
    if (!r.ok) return flash(false, r.error ?? "Could not save the research");
    setEditingResearch(false);
    flash(true, "Research intelligence saved.");
    onChanged();
  }

  async function logActivity() {
    if (!aSummary.trim()) return flash(false, "Say what happened.");
    setBusy(true);
    const r = await crm(`/api/rep/leads/${lead.id}/activities`, "POST", { type: aType, outcome: aOutcome || undefined, summary: aSummary.trim() });
    setBusy(false);
    if (!r.ok) return flash(false, r.error ?? "Could not log it");
    setASummary("");
    setAOutcome("");
    flash(true, "Logged.");
    onChanged();
    void load();
  }

  async function addTask() {
    if (!tTitle.trim()) return flash(false, "Give the task a title.");
    setBusy(true);
    const r = await crm("/api/rep/tasks", "POST", { leadId: lead.id, title: tTitle.trim(), dueAt: new Date(tDue).toISOString() });
    setBusy(false);
    if (!r.ok) return flash(false, r.error ?? "Could not add the task");
    setTTitle("");
    flash(true, "Task added.");
    onChanged();
    void load();
  }

  async function taskAction(t: Task, action: "done" | "cancelled" | "snooze") {
    const body = action === "snooze" ? { dueAt: snoozedDue(t.due_at) } : { status: action };
    const r = await crm(`/api/rep/tasks/${t.id}`, "PATCH", body);
    if (!r.ok) return flash(false, r.error ?? "Could not update the task");
    onChanged();
    void load();
  }

  async function erase() {
    const typed = window.prompt(`This permanently erases ${lead.full_name}'s personal data and adds ${lead.email} to the do-not-contact list. It cannot be undone.\n\nType ERASE to confirm.`);
    if (typed !== "ERASE") return;
    const r = await crm(`/api/rep/leads/${lead.id}/erase`, "POST", { confirm: true });
    if (!r.ok) return flash(false, r.error ?? "Could not erase");
    onErased();
  }

  const openTasks = tasks.filter((t) => t.status === "open");
  const closedTasks = tasks.filter((t) => t.status !== "open").slice(-5);
  const outcomes = ACTIVITY_OUTCOMES[aType] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Lead ${lead.full_name}`}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-[#0F1626] border-l border-white/[0.08] p-5 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white">{lead.full_name}</h2>
            <p className="text-xs text-slate-400 font-mono">{lead.email}</p>
            <p className="text-xs text-slate-400">{[lead.job_title, lead.company_name].filter(Boolean).join(" · ") || "No company yet"}</p>
            {(intel.website || intel.linkedinUrl || intel.location || intel.industry) && (
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-[11px]">
                {intel.website && (
                  <a
                    href={intel.website.startsWith("http") ? intel.website : `https://${intel.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                    title="Open company website"
                  >
                    <Globe size={11} /> {intel.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                  </a>
                )}
                {intel.linkedinUrl && (
                  <a
                    href={intel.linkedinUrl.startsWith("http") ? intel.linkedinUrl : `https://${intel.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                    title="View LinkedIn profile"
                  >
                    <Linkedin size={11} /> LinkedIn
                  </a>
                )}
                {intel.location && <span className="text-slate-400">📍 {intel.location}</span>}
                {intel.industry && <span className="text-slate-400">🏢 {intel.industry}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className={btnGhost} aria-label="Close">Close</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
          {lead.fit_grade && <span className={`rounded px-2 py-1 ${GRADE_STYLE[lead.fit_grade]}`} title="How well this person and company match who we sell to">Fit {lead.fit_grade} · {lead.fit_score}</span>}
          {lead.engagement_label && <span className={`rounded px-2 py-1 ${HEAT_STYLE[lead.engagement_label]}`} title="What they have actually done: replies, page views, clicks, bookings">{lead.engagement_label} · {lead.engagement_score}</span>}
          {lead.stale && <span className="rounded bg-amber-500/15 px-2 py-1 text-amber-300">quiet {lead.days_quiet}d</span>}
          {lead.email_check && lead.email_check.status !== "safe" && <span className={`rounded px-2 py-1 ${lead.email_check.status === "invalid" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`} title={lead.email_check.reason}>email {lead.email_check.status}</span>}
        </div>
        {lead.next_move && <p className="text-xs text-slate-300">Suggested: <span className="font-bold text-white">{lead.next_move}</span></p>}

        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => onEmail(lead)}>Write an email</button>
          <button className={btnGhost} onClick={() => onEditContact(lead)}>Edit contact details</button>
          <a className={btnGhost} href={`/api/rep/leads/${lead.id}/export`} title="Download everything held about this person">Export their data</a>
        </div>

        {/* ========================================================================= */}
        {/* RESEARCH INTELLIGENCE & STRATEGIC PITCH CARD */}
        {/* ========================================================================= */}
        {
          <section className="space-y-3.5 rounded-2xl border border-purple/30 bg-gradient-to-br from-purple/10 via-[#131B2E] to-[#0D1322] p-4 shadow-lg shadow-purple/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple/20 text-purple-300">
                  <Zap size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Research Intelligence &amp; Pitch
                  </h3>
                  <p className="text-[10px] text-purple-300/80">Audit facts &amp; tailored solution ready to send</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {intel.fitScore != null && (
                  <span className="rounded-md bg-purple/20 border border-purple/40 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    Research Fit: {intel.fitScore}/100
                  </span>
                )}
                <button type="button" className={btnGhost} onClick={() => setEditingResearch((value) => !value)}>
                  <Pencil size={11} className="inline mr-1" /> {editingResearch ? "Cancel" : intel.hasIntelligence ? "Edit" : "Add research"}
                </button>
              </div>
            </div>

            {editingResearch && (
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-black/20 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><label className={label}>Website</label><input className={field} value={researchDraft.website} onChange={(e) => setResearchDraft((d) => ({ ...d, website: e.target.value }))} /></div>
                  <div><label className={label}>LinkedIn URL</label><input className={field} value={researchDraft.linkedinUrl} onChange={(e) => setResearchDraft((d) => ({ ...d, linkedinUrl: e.target.value }))} /></div>
                  <div><label className={label}>Location</label><input className={field} value={researchDraft.location} onChange={(e) => setResearchDraft((d) => ({ ...d, location: e.target.value }))} /></div>
                  <div><label className={label}>Industry</label><input className={field} value={researchDraft.industry} onChange={(e) => setResearchDraft((d) => ({ ...d, industry: e.target.value }))} /></div>
                  <div><label className={label}>Tech stack</label><input className={field} value={researchDraft.techStack} onChange={(e) => setResearchDraft((d) => ({ ...d, techStack: e.target.value }))} placeholder="HubSpot, Excel, WordPress" /></div>
                  <div><label className={label}>Research fit (0–100)</label><input type="number" min={0} max={100} className={field} value={researchDraft.fitScore} onChange={(e) => setResearchDraft((d) => ({ ...d, fitScore: e.target.value }))} /></div>
                  <div><label className={label}>QC / Researcher</label><input className={field} value={researchDraft.qcBy} onChange={(e) => setResearchDraft((d) => ({ ...d, qcBy: e.target.value }))} /></div>
                  <div><label className={label}>Priority</label><input className={field} value={researchDraft.priority} onChange={(e) => setResearchDraft((d) => ({ ...d, priority: e.target.value }))} placeholder="High, Medium, or Low" /></div>
                </div>
                <div><label className={label}>Pain Point / Trigger *</label><textarea required rows={4} className={field} value={researchDraft.painPoints} onChange={(e) => setResearchDraft((d) => ({ ...d, painPoints: e.target.value }))} /></div>
                <div><label className={label}>Proposed Solution / Pitch *</label><textarea required rows={4} className={field} value={researchDraft.solution} onChange={(e) => setResearchDraft((d) => ({ ...d, solution: e.target.value }))} /></div>
                <div><label className={label}>General notes</label><textarea rows={3} className={field} value={researchDraft.generalNotes} onChange={(e) => setResearchDraft((d) => ({ ...d, generalNotes: e.target.value }))} /></div>
                <button type="button" className={btn} disabled={busy} onClick={saveResearch}>{busy ? "Saving…" : "Save research"}</button>
              </div>
            )}

            {!intel.hasIntelligence && !editingResearch && <p className="text-xs text-slate-400">No structured research yet. Add the required pain point and solution before drafting outreach.</p>}

            {/* Known Tech Stack */}
            {intel.techStack.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Known Tech Stack</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {intel.techStack.map((tech, idx) => (
                    <span key={idx} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Points */}
            {intel.painPoints && (
              <div className="space-y-1 rounded-xl bg-black/30 border border-white/[0.06] p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  ⚠ Identified Bottlenecks / Triggers
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {intel.painPoints}
                </p>
              </div>
            )}

            {/* Proposed Solution */}
            {intel.solution && (
              <div className="space-y-1 rounded-xl bg-purple/10 border border-purple/20 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1">
                  ✨ Tailored Solution &amp; Pitch
                </span>
                <p className="text-xs text-purple-100 whitespace-pre-line leading-relaxed">
                  {intel.solution}
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  const pitch = generateExecutivePitch({
                    fullName: lead.full_name,
                    companyName: lead.company_name,
                    jobTitle: lead.job_title,
                    intel,
                  });
                  flash(true, "Executive pitch generated! Opening outreach composer…");
                  onEmail(lead, pitch);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 transition shadow-sm"
                title="Open outreach composer pre-filled with this tailored pitch"
              >
                <Send size={12} /> Pitch this Lead
              </button>

              <button
                type="button"
                onClick={() => {
                  const dm = generateDirectMessagePitch({
                    fullName: lead.full_name,
                    companyName: lead.company_name,
                    intel,
                  });
                  navigator.clipboard.writeText(dm);
                  setCopiedPitch(true);
                  flash(true, "LinkedIn / WhatsApp pitch copied to clipboard!");
                  setTimeout(() => setCopiedPitch(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                title="Copy short direct message pitch for LinkedIn or WhatsApp"
              >
                {copiedPitch ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedPitch ? "Copied DM Pitch!" : "Copy DM Pitch"}
              </button>

              <button
                type="button"
                onClick={() => setShowProposalModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white hover:bg-white/10 transition"
                title="Draft a full technical specification with this solution"
              >
                <FileText size={12} /> Draft Proposal from Solution
              </button>
            </div>
          </section>
        }

        {msg && <p className={`rounded-lg p-2 text-xs font-semibold ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`} role="status">{msg.text}</p>}

        {/* Deal */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Deal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Stage</label><select className={field} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></div>
            <div><label className={label}>Status</label><select className={field} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            {stage === "lost" && (
              <>
                <div><label className={label}>Why was it lost?</label><select className={field} value={lostReason} onChange={(e) => setLostReason(e.target.value)}><option value="">Choose a reason…</option>{LOST_REASONS.map((r) => <option key={r} value={r}>{LOST_REASON_LABELS[r]}</option>)}</select></div>
                <div><label className={label}>Note (optional)</label><input className={field} value={lostNote} maxLength={500} onChange={(e) => setLostNote(e.target.value)} /></div>
              </>
            )}
            <div><label className={label}>Deal value</label><input type="number" min={0} className={field} value={value} onChange={(e) => setValue(e.target.value)} /></div>
            <div><label className={label}>Currency</label><select className={field} value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={label}>Expected close date</label><input type="date" className={field} value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /></div>
            <div><label className={label}>Win chance % (blank = stage default)</label><input type="number" min={0} max={100} className={field} value={probability} onChange={(e) => setProbability(e.target.value)} /></div>
            <div><label className={label}>Country (2 letters, e.g. AU)</label><input className={field} value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} /></div>
            <div><label className={label}>Tags (comma separated)</label><input className={field} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="warm, referral" /></div>
          </div>
          <button className={btn} disabled={busy} onClick={saveDeal}>{busy ? "Saving…" : "Save deal details"}</button>
        </section>

        {/* Proposals & Closing */}
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <FileText size={14} className="text-purple" /> Proposals &amp; Closing
              </h3>
              <p className="text-[11px] text-slate-400">Specifications, live client views &amp; digital signatures</p>
            </div>
            <button
              type="button"
              onClick={() => setShowProposalModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-purple px-2.5 py-1.5 text-xs font-bold text-white hover:brightness-110 shadow-xs transition"
            >
              + Draft Proposal
            </button>
          </div>

          {proposals.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">
              No technical specification drafted yet. Generate one to share an unguessable link with live view tracking and 1-click legal e-signatures.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {proposals.map((p) => {
                const isSigned = Boolean(p.signed_at);
                const views = p.view_count || 0;
                return (
                  <div key={p.id} className="rounded-lg border border-white/[0.06] bg-[#0D1322] p-2.5 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.project_title}</span>
                          {p.is_active && <span className="rounded-md bg-purple/20 px-1.5 py-0.2 text-[9px] font-bold text-purple uppercase">Active</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {p.budget_range} · {p.target_timeline}
                        </div>
                      </div>

                      <div>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <FileCheck2 size={11} /> Executed &amp; Won
                          </span>
                        ) : views > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple/20 border border-purple/30 px-2 py-0.5 text-[10px] font-bold text-purple">
                            <Eye size={11} /> Viewed {views}x
                          </span>
                        ) : p.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                            Ready to Share
                          </span>
                        ) : (
                          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px] truncate max-w-[140px]">
                        {p.slug}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/proposals/${p.slug}`;
                            navigator.clipboard.writeText(url);
                            setCopiedSlug(p.slug);
                            flash(true, "Proposal link copied to clipboard!");
                            setTimeout(() => setCopiedSlug(null), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition"
                          title="Copy secure link to clipboard"
                        >
                          <Copy size={11} /> {copiedSlug === p.slug ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/proposals/${p.slug}`;
                            const draftText = `Hi ${lead.full_name},\n\nFollowing our discussion, I have prepared our bespoke technical architecture specification and milestone proposal for ${lead.company_name || 'your project'}:\n\n${url}\n\nPlease review the scope, architecture modules, and roadmap. You can digitally execute the specification directly on the page whenever you are ready to kick off.\n\nBest regards,`;
                            navigator.clipboard.writeText(draftText);
                            flash(true, "Proposal email pitch copied! Opening outreach composer…");
                            onEmail(lead);
                          }}
                          className="inline-flex items-center gap-1 text-purple-300 hover:text-white transition"
                          title="Copy proposal email template and open composer"
                        >
                          <Send size={11} /> Compose Email
                        </button>
                        <a
                          href={`/proposals/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-purple hover:underline font-semibold"
                        >
                          <ExternalLink size={11} /> Open Spec
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Next steps</h3>
          {openTasks.length === 0 ? <p className="text-xs text-slate-500">No next step scheduled. Add one so this lead does not go cold.</p> : (
            <ul className="space-y-2">
              {openTasks.map((t) => {
                const d = dueLabel(t.due_at);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] p-2 text-xs">
                    <div><span className="font-semibold text-white">{t.title}</span>{t.auto && <span className="ml-1 text-[9px] uppercase text-slate-500">auto</span>}<div className={d.overdue ? "text-rose-300" : "text-slate-400"}>{d.text}</div></div>
                    <div className="flex gap-1">
                      <button className={btnGhost} onClick={() => taskAction(t, "done")}>Done</button>
                      <button className={btnGhost} onClick={() => taskAction(t, "snooze")} title="Move to tomorrow">+1 day</button>
                      <button className={btnGhost} onClick={() => taskAction(t, "cancelled")} title="Cancel this task">✕</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {closedTasks.length > 0 && <p className="text-[10px] text-slate-500">Recently closed: {closedTasks.map((t) => `${t.title} (${t.status}${t.cancel_reason ? `: ${t.cancel_reason}` : ""})`).join(" · ")}</p>}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <input className={field} placeholder="e.g. Send the pricing sheet" value={tTitle} maxLength={200} onChange={(e) => setTTitle(e.target.value)} />
            <input type="datetime-local" className={field} value={tDue} onChange={(e) => setTDue(e.target.value)} />
            <button className={btn} disabled={busy} onClick={addTask}>Add</button>
          </div>
        </section>

        {/* Log activity */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Log something you did</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>What</label><select className={field} value={aType} onChange={(e) => { setAType(e.target.value); setAOutcome(""); }}>{Object.entries(ACTIVITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            {outcomes.length > 0 && <div><label className={label}>Outcome</label><select className={field} value={aOutcome} onChange={(e) => setAOutcome(e.target.value)}><option value="">—</option>{outcomes.map((o) => <option key={o} value={o}>{pretty(o)}</option>)}</select></div>}
          </div>
          <textarea className={`${field} min-h-[70px]`} placeholder="What was said or agreed?" value={aSummary} maxLength={1000} onChange={(e) => setASummary(e.target.value)} />
          <button className={btn} disabled={busy} onClick={logActivity}>Log it</button>
        </section>

        {/* Timeline */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Timeline</h3>
          {activities.length === 0 ? <p className="text-xs text-slate-500">Nothing recorded yet.</p> : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/[0.06] p-2 text-xs">
                  <div className="flex justify-between text-[10px] uppercase text-slate-500"><span className="font-bold">{pretty(a.type)}{a.outcome ? ` · ${pretty(a.outcome)}` : ""}</span><span>{when(a.occurred_at)}</span></div>
                  <div className="mt-0.5 text-slate-200 whitespace-pre-line">{a.summary}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-white/[0.06] pt-4">
          <button className="text-xs font-semibold text-rose-300 hover:underline" onClick={erase}>Erase this person&apos;s data…</button>
        </section>
      </div>

      <ProposalDraftModal
        lead={lead}
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        onCreated={(newProp) => {
          setProposals((prev) => [newProp, ...prev]);
          onChanged();
          void load();
        }}
      />
    </div>
  );
}
