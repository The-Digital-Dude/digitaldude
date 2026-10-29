"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Edit3, Layers, Plus, Search, Send, Trash2, Upload, Users, FileCheck2, FileText, Eye } from "lucide-react";
import { LOST_REASONS, LOST_REASON_LABELS, STAGES, STAGE_LABELS, STATUSES, STATUS_LABELS, type Stage } from "@/lib/crm/model";
import { parseLeadIntelligence } from "@/lib/crm/intelligence";
import { FOLLOW_UP_LABELS, FOLLOW_UP_REASONS, type FollowUpReason } from "@/lib/crm/followups";
import { Pagination } from "@/components/admin/Pagination";
import { CrmLead, Forecast, GRADE_STYLE, HEAT_STYLE, SavedView, ViewFilters, applyFilters, crm, dueLabel, money } from "./shared";
import { LeadDrawer } from "./LeadDrawer";
import { TasksPanel } from "./TasksPanel";
import { ImportModal } from "./ImportModal";

const field = "rounded-lg bg-[#0D1322] border border-white/[0.08] px-2.5 py-2 text-xs text-white outline-none focus:border-purple";
const pill = (on: boolean) => `px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${on ? "bg-purple text-white shadow-md shadow-purple/20" : "bg-[#131B2E] text-slate-400 hover:text-white border border-white/[0.05]"}`;

type Sort = "priority" | "newest" | "value" | "quiet";

interface Props {
  leads: CrmLead[];
  forecast: Forecast[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (l: CrmLead) => void;
  onDelete: (id: string) => void;
  onEmail: (l: CrmLead, pitch?: { subject: string; body: string }) => void;
  onEnroll: () => void;
}

export function LeadsCrm({ leads, forecast, selectedIds, setSelectedIds, onRefresh, onAdd, onEdit, onDelete, onEmail, onEnroll }: Props) {
  const [mode, setMode] = useState<"list" | "board" | "tasks">("list");
  const [filters, setFilters] = useState<ViewFilters>({});
  const [sort, setSort] = useState<Sort>("priority");
  const [views, setViews] = useState<SavedView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [lostFor, setLostFor] = useState<{ lead: CrmLead; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  useEffect(() => {
    void crm<{ views: SavedView[] }>("/api/rep/views").then((r) => r.ok && setViews(r.views ?? []));
  }, []);

  const set = (patch: Partial<ViewFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtered = useMemo(() => {
    const list = applyFilters(leads, filters);
    const by: Record<Sort, (a: CrmLead, b: CrmLead) => number> = {
      priority: (a, b) => (b.priority ?? -1) - (a.priority ?? -1),
      newest: (a, b) => b.created_at.localeCompare(a.created_at),
      value: (a, b) => (b.estimated_deal_value || 0) - (a.estimated_deal_value || 0),
      quiet: (a, b) => (b.days_quiet ?? 0) - (a.days_quiet ?? 0),
    };
    return [...list].sort(by[sort]);
  }, [leads, filters, sort]);

  const paginated = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filtered.slice(from, from + pageSize);
  }, [filtered, page, pageSize]);

  const tags = useMemo(() => [...new Set(leads.flatMap((l) => l.tags ?? []))].sort(), [leads]);
  const countries = useMemo(() => [...new Set(leads.map((l) => l.country).filter((c): c is string => !!c))].sort(), [leads]);
  const quiet = leads.filter((l) => l.stale).length;
  const noNext = leads.filter((l) => l.needs_next_step).length;
  const overdue = leads.filter((l) => l.task_overdue).length;
  const openLead = openId ? leads.find((l) => l.id === openId) ?? null : null;

  async function patchStage(lead: CrmLead, stage: Stage, lostReason?: string) {
    setError(null);
    const r = await crm(`/api/rep/leads/${lead.id}`, "PATCH", stage === "lost" ? { stage, lost_reason: lostReason } : { stage });
    if (!r.ok) setError(r.error ?? "Could not change the stage");
    onRefresh();
  }
  function changeStage(lead: CrmLead, stage: Stage) {
    if (stage === lead.stage) return;
    if (stage === "lost") return setLostFor({ lead, reason: "" });
    void patchStage(lead, stage);
  }

  async function saveView() {
    const name = window.prompt("Name this view (for example “UK leads gone quiet”)");
    if (!name?.trim()) return;
    const r = await crm<{ view: SavedView }>("/api/rep/views", "POST", { name: name.trim(), filters });
    if (!r.ok) return setError(r.error ?? "Could not save the view");
    setViews((v) => [...v.filter((x) => x.id !== r.view.id && x.name !== r.view.name), r.view]);
  }
  async function deleteView(id: string) {
    await crm(`/api/rep/views?id=${id}`, "DELETE");
    setViews((v) => v.filter((x) => x.id !== id));
  }

  const filtersActive = Object.values(filters).some((v) => v !== undefined && v !== "" && v !== false);
  const allSelected = paginated.length > 0 && paginated.every((l) => selectedIds.includes(l.id));

  const scoreChips = (l: CrmLead) => (
    <div className="flex flex-wrap gap-1">
      {l.fit_grade && <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${GRADE_STYLE[l.fit_grade]}`} title={`Fit ${l.fit_score}/100: how well they match who we sell to`}>Fit {l.fit_grade}</span>}
      {l.engagement_label && <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${HEAT_STYLE[l.engagement_label]}`} title={`Engagement ${l.engagement_score}/100: what they have done`}>{l.engagement_label}</span>}
    </div>
  );

  const nextStep = (l: CrmLead) => {
    if (l.stage === "won" || l.stage === "lost") return <span className="text-slate-500">—</span>;
    if (l.team_answering && !l.next_task_due) return <span className="font-semibold text-sky-300">Replied · team answering</span>;
    if (l.next_task_due) {
      const d = dueLabel(l.next_task_due);
      return <span className={d.overdue ? "text-rose-300" : "text-slate-300"}>{l.next_task_title ? `${l.next_task_title} · ` : ""}{d.text}{(l.open_tasks ?? 0) > 1 ? ` (+${(l.open_tasks ?? 1) - 1})` : ""}</span>;
    }
    if (l.needs_next_step) return <span className="font-semibold text-amber-300">No next step</span>;
    return <span className="text-slate-500">—</span>;
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button onClick={() => { setMode("list"); setFilters({ stale: true }); }} className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-3 text-left hover:border-purple/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gone quiet</div><div className="text-xl font-extrabold text-white">{quiet}</div>
        </button>
        <button onClick={() => setMode("tasks")} className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-3 text-left hover:border-purple/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue next steps</div><div className={`text-xl font-extrabold ${overdue ? "text-rose-300" : "text-white"}`}>{overdue}</div>
        </button>
        <button onClick={() => { setMode("list"); setFilters({ noNextStep: true }); }} className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-3 text-left hover:border-purple/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leads without a next step</div><div className={`text-xl font-extrabold ${noNext ? "text-amber-300" : "text-white"}`}>{noNext}</div>
        </button>
        <div className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weighted pipeline</div>
          {forecast.length === 0 ? <div className="text-xl font-extrabold text-white">—</div> : forecast.slice(0, 2).map((f) => <div key={f.currency} className="text-sm font-extrabold text-white" title={`${f.openCount} open deals worth ${money(f.open, f.currency)} before weighting`}>{money(f.weighted, f.currency)}</div>)}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist">
          {([["list", "List"], ["board", "Board"], ["tasks", "Tasks"]] as const).map(([k, v]) => <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={pill(mode === k)}>{v}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
          <a href="/api/rep/leads/export" className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Download size={13} /> Export</a>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><Upload size={13} /> Import CSV</button>
          <button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md"><Plus size={14} /> Add lead</button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      {mode === "tasks" ? (
        <TasksPanel onOpenLead={(id) => setOpenId(id)} onChanged={onRefresh} />
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative max-w-md flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={filters.q ?? ""} onChange={(e) => set({ q: e.target.value })} placeholder="Search leads by name, email, company…" className="w-full rounded-xl bg-[#131B2E] border border-white/[0.08] py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20" />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button onClick={() => set({ stage: undefined })} className={pill(!filters.stage)}>All</button>
                {STAGES.map((s) => <button key={s} onClick={() => set({ stage: s })} className={pill(filters.stage === s)}>{STAGE_LABELS[s]}</button>)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className={field} value={filters.status ?? ""} onChange={(e) => set({ status: e.target.value || undefined })} aria-label="Status"><option value="">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
              <select className={field} value={filters.grade ?? ""} onChange={(e) => set({ grade: e.target.value || undefined })} aria-label="Fit grade"><option value="">Any fit</option>{["A", "B", "C", "D"].map((g) => <option key={g} value={g}>Fit {g}</option>)}</select>
              <select className={field} value={filters.followUp ?? ""} onChange={(e) => set({ followUp: (e.target.value || undefined) as FollowUpReason | "any" | undefined })} aria-label="Follow-up needed"><option value="">Any follow-up status</option><option value="any">Needs a follow-up</option>{FOLLOW_UP_REASONS.map((r) => <option key={r} value={r}>{FOLLOW_UP_LABELS[r]}</option>)}</select>
              {tags.length > 0 && <select className={field} value={filters.tag ?? ""} onChange={(e) => set({ tag: e.target.value || undefined })} aria-label="Tag"><option value="">Any tag</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select>}
              {countries.length > 0 && <select className={field} value={filters.country ?? ""} onChange={(e) => set({ country: e.target.value || undefined })} aria-label="Country"><option value="">Any country</option>{countries.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"><input type="checkbox" className="accent-purple" checked={!!filters.stale} onChange={(e) => set({ stale: e.target.checked || undefined })} /> Gone quiet</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"><input type="checkbox" className="accent-purple" checked={!!filters.noNextStep} onChange={(e) => set({ noNextStep: e.target.checked || undefined })} /> No next step</label>
              <select className={field} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by"><option value="priority">Best first</option><option value="newest">Newest</option><option value="value">Biggest deal</option><option value="quiet">Quiet longest</option></select>
              {filtersActive && <button className="text-xs font-semibold text-slate-400 hover:text-white" onClick={() => setFilters({})}>Clear filters</button>}
              {filtersActive && <button className="text-xs font-semibold text-purple-300 hover:underline" onClick={saveView}>Save this view</button>}
            </div>
            {views.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Saved views</span>
                {views.map((v) => (
                  <span key={v.id} className="inline-flex items-center overflow-hidden rounded-lg border border-white/[0.08]">
                    <button className="bg-[#131B2E] px-2.5 py-1 font-semibold text-slate-200 hover:text-white" onClick={() => setFilters(v.filters)}>{v.name}</button>
                    <button className="bg-[#131B2E] px-1.5 py-1 text-slate-500 hover:text-rose-300" onClick={() => deleteView(v.id)} aria-label={`Delete view ${v.name}`}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 py-16 text-center space-y-3">
              <Users size={32} className="mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-400">{leads.length === 0 ? "No leads yet." : "No leads match these filters."}</p>
              {leads.length === 0 && <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-md"><Plus size={14} /> Add first lead</button>}
            </div>
          ) : mode === "list" ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? [...new Set([...selectedIds, ...paginated.map((l) => l.id)])]
                                : selectedIds.filter((id) => !paginated.some((l) => l.id === id))
                            )
                          }
                          className="cursor-pointer rounded border-white/20 bg-slate-950 accent-purple"
                          aria-label="Select all on page"
                        />
                      </th>
                      <th className="px-4 py-3">Contact</th><th className="px-4 py-3">Company &amp; title</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Deal</th><th className="px-4 py-3">Next step</th><th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {paginated.map((l) => (
                      <tr key={l.id} className={`transition hover:bg-white/[0.02] ${selectedIds.includes(l.id) ? "bg-purple/10" : ""}`}>
                        <td className="px-3 py-3 text-center"><input type="checkbox" checked={selectedIds.includes(l.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, l.id] : selectedIds.filter((x) => x !== l.id))} className="cursor-pointer rounded border-white/20 bg-slate-950 accent-purple" aria-label={`Select ${l.full_name}`} /></td>
                        <td className="px-4 py-3">
                          <button className="block text-left font-bold text-white hover:text-purple-300" onClick={() => setOpenId(l.id)}>{l.full_name}</button>
                          <span className="font-mono text-[11px] text-slate-400">{l.email}</span>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {l.proposal_status && (
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                l.proposal_status === "accepted" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                                l.proposal_status === "viewed" ? "bg-purple/20 text-purple border border-purple/30" :
                                "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              }`}>
                                {l.proposal_status === "accepted" ? <><FileCheck2 size={10} /> Signed</> :
                                 l.proposal_status === "viewed" ? <><Eye size={10} /> Viewed ({l.proposal_views}x)</> :
                                 <><FileText size={10} /> Ready to Share</>}
                              </span>
                            )}
                            {l.email_check && (l.email_check.status === "invalid" || l.email_check.status === "risky") && <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${l.email_check.status === "invalid" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`} title={l.email_check.reason}>email {l.email_check.status}</span>}
                            {l.status === "unqualified" && !l.email_check && <span className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-300" title={l.lost_note || "Unqualified lead"}>Disqualified</span>}
                            {l.pool_contact_status && l.pool_contact_status !== "eligible" && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300" title="Record a lawful basis in Lead Pool before emailing this contact">needs lawful basis</span>}
                            {(l.tags ?? []).map((t) => <button key={t} onClick={() => set({ tag: t })} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 hover:bg-white/10">{t}</button>)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block font-medium text-white">{l.company_name || "—"}</span>
                          <span className="text-[11px] text-slate-400">{l.job_title || "—"}</span>
                          {(() => {
                            const intel = parseLeadIntelligence(l.notes);
                            if (!intel.hasIntelligence) return null;
                            return (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="inline-flex items-center gap-0.5 rounded bg-purple/20 border border-purple/30 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                                  ⚡ Research Ready
                                </span>
                                {intel.techStack.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="rounded bg-white/5 border border-white/10 px-1 py-0.5 text-[9px] text-slate-400">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <select value={l.stage} onChange={(e) => changeStage(l, e.target.value as Stage)} aria-label={`Stage for ${l.full_name}`} className="cursor-pointer rounded-lg border border-white/[0.08] bg-[#0D1322] px-2 py-1 text-xs font-semibold text-purple-300 outline-none focus:border-purple">
                            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                          </select>
                          {l.status === "unqualified" ? (
                            <div className="mt-1 space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-300" title={l.lost_note || "Lead does not meet qualification criteria"}>
                                ✕ Unqualified
                              </span>
                              {l.lost_note && (
                                <div className="max-w-[170px] truncate text-[10px] text-rose-400 font-medium" title={l.lost_note}>
                                  {l.lost_note}
                                </div>
                              )}
                            </div>
                          ) : (
                            l.status && l.status !== "new" && <div className="mt-1 text-[10px] text-slate-500">{STATUS_LABELS[l.status]}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">{scoreChips(l)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-white">{money(l.estimated_deal_value, l.currency)}{l.expected_close_date && <div className="text-[10px] font-normal text-slate-500">close {l.expected_close_date}</div>}</td>
                        <td className="px-4 py-3">{nextStep(l)}{l.stale && <div className="mt-0.5 text-[10px] font-bold text-amber-300">quiet {l.days_quiet}d</div>}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEmail(l)}
                              disabled={l.status === "unqualified"}
                              title={l.status === "unqualified" ? (l.lost_note || "Cannot email disqualified lead") : "Send direct outreach"}
                              className={`rounded-lg p-1.5 transition ${l.status === "unqualified" ? "opacity-30 cursor-not-allowed bg-white/5 text-slate-500" : "bg-purple/10 text-purple-300 hover:bg-purple/20"}`}
                            >
                              <Send size={13} />
                            </button>
                            <button onClick={() => onEdit(l)} title="Edit contact" className="rounded-lg bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10"><Edit3 size={13} /></button>
                            <button onClick={() => onDelete(l.id)} title="Delete prospect" className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400 transition hover:bg-rose-500/20"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                totalCount={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                variant="dark"
              />
            </div>
          ) : (
            <div className="grid auto-cols-[minmax(230px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3">
              {STAGES.map((stage) => {
                const col = filtered.filter((l) => l.stage === stage);
                const limit = columnLimits[stage] || 30;
                const visibleCol = col.slice(0, limit);
                const total = col.reduce((s, l) => s + (l.estimated_deal_value || 0), 0);
                const cur = col[0]?.currency;
                return (
                  <div key={stage} onDragOver={(e) => e.preventDefault()} onDrop={() => { const l = leads.find((x) => x.id === dragId); setDragId(null); if (l) changeStage(l, stage); }} className="min-h-[200px] rounded-2xl border border-white/[0.08] bg-[#131B2E]/50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">{STAGE_LABELS[stage]} <span className="text-slate-500">{col.length}</span></h3>
                      {cur && total > 0 && col.every((l) => l.currency === cur) && <span className="text-[10px] font-bold text-slate-400">{money(total, cur)}</span>}
                    </div>
                    <div className="space-y-2">
                      {visibleCol.map((l) => (
                        <div key={l.id} draggable onDragStart={() => setDragId(l.id)} onDragEnd={() => setDragId(null)} className={`cursor-grab rounded-xl border bg-[#0D1322] p-3 active:cursor-grabbing ${l.stale ? "border-amber-500/40" : "border-white/[0.06]"}`}>
                          <button className="block text-left text-sm font-bold text-white hover:text-purple-300" onClick={() => setOpenId(l.id)}>{l.full_name}</button>
                          <div className="text-[11px] text-slate-400">{l.company_name || l.email}</div>
                          {(() => {
                            const intel = parseLeadIntelligence(l.notes);
                            if (!intel.hasIntelligence) return null;
                            return (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="inline-flex items-center gap-0.5 rounded bg-purple/20 border border-purple/30 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                                  ⚡ Research
                                </span>
                                {intel.techStack.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="rounded bg-white/5 border border-white/10 px-1 py-0.2 text-[9px] text-slate-400">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                          {l.proposal_status && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                l.proposal_status === "accepted" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                                l.proposal_status === "viewed" ? "bg-purple/20 text-purple border border-purple/30" :
                                "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              }`}>
                                {l.proposal_status === "accepted" ? <><FileCheck2 size={10} /> Signed</> :
                                 l.proposal_status === "viewed" ? <><Eye size={10} /> Viewed ({l.proposal_views}x)</> :
                                 <><FileText size={10} /> Ready to Share</>}
                              </span>
                            </div>
                          )}
                          {l.status === "unqualified" && (
                            <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[10px] text-rose-200">
                              <div className="font-bold text-rose-300 flex items-center gap-1">✕ Unqualified</div>
                              {l.lost_note && <div className="line-clamp-2 text-[9px] text-rose-200/90 mt-0.5">{l.lost_note}</div>}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-2">{scoreChips(l)}<span className="font-mono text-[11px] font-bold text-white">{money(l.estimated_deal_value, l.currency)}</span></div>
                          <div className="mt-1.5 text-[10px]">{nextStep(l)}{l.stale && <span className="ml-1 font-bold text-amber-300">quiet {l.days_quiet}d</span>}</div>
                          <select value={l.stage} onChange={(e) => changeStage(l, e.target.value as Stage)} aria-label={`Move ${l.full_name} to a stage`} className="mt-2 w-full rounded-md border border-white/[0.06] bg-[#131B2E] px-1.5 py-1 text-[10px] text-slate-300 md:hidden">
                            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                          </select>
                        </div>
                      ))}
                      {col.length > visibleCol.length && (
                        <button
                          type="button"
                          onClick={() => setColumnLimits((prev) => ({ ...prev, [stage]: limit + 30 }))}
                          className="w-full mt-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-semibold text-purple-300 hover:bg-white/[0.08] transition"
                        >
                          Load more ({col.length - visibleCol.length} remaining)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="sticky bottom-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-purple/40 bg-[#131B2E] p-4 shadow-2xl backdrop-blur-xl sm:flex-row">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple text-xs font-bold text-white shadow-md">{selectedIds.length}</span>
                <span className="text-xs font-bold text-white">{selectedIds.length} prospect(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds([])} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">Deselect all</button>
                <button onClick={onEnroll} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple to-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple/20 transition hover:brightness-110 active:scale-95"><Layers size={14} /> Enroll in campaign sequence…</button>
              </div>
            </div>
          )}
        </>
      )}

      {lostFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Why was this deal lost?">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/[0.08] bg-[#0F1626] p-5">
            <h2 className="text-base font-extrabold text-white">Why was {lostFor.lead.full_name} lost?</h2>
            <p className="text-xs text-slate-400">Pick the main reason. It helps the team see what to fix.</p>
            <select className={`${field} w-full`} value={lostFor.reason} onChange={(e) => setLostFor({ ...lostFor, reason: e.target.value })} autoFocus>
              <option value="">Choose a reason…</option>
              {LOST_REASONS.map((r) => <option key={r} value={r}>{LOST_REASON_LABELS[r]}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10" onClick={() => setLostFor(null)}>Cancel</button>
              <button className="rounded-lg bg-purple px-3 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={!lostFor.reason} onClick={() => { const { lead, reason } = lostFor; setLostFor(null); void patchStage(lead, "lost", reason); }}>Mark as lost</button>
            </div>
          </div>
        </div>
      )}

      {openLead && (
        <LeadDrawer
          key={openLead.id}
          lead={openLead}
          onClose={() => setOpenId(null)}
          onChanged={onRefresh}
          onEmail={(l, pitch) => { setOpenId(null); onEmail(l, pitch); }}
          onEditContact={(l) => { setOpenId(null); onEdit(l); }}
          onErased={() => { setOpenId(null); onRefresh(); }}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={onRefresh} />}
    </div>
  );
}
