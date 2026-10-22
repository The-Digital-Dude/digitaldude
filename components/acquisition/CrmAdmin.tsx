"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Empty, Stat, btnCls, btnGhostCls, fmtDate, inputCls, labelCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";
import { LOST_REASONS, LOST_REASON_LABELS, OPEN_STAGES, STAGES, STAGE_LABELS, STATUSES, STATUS_LABELS, type Stage } from "@/lib/crm/model";
import type { CrmReport } from "@/lib/crm/report";
import type { CrmSettings } from "@/lib/crm/settings";

interface AdminLead {
  id: string;
  employee_id: string;
  owner: string;
  full_name: string;
  email: string;
  company_name: string | null;
  stage: string;
  status: string;
  country: string | null;
  tags: string[] | null;
  estimated_deal_value: number | null;
  currency: string | null;
  fit_score: number | null;
  engagement_score: number | null;
  stale: boolean;
  days_quiet: number;
  created_at: string;
}

interface Detail {
  lead: Record<string, unknown>;
  activities: { id: string; type: string; outcome: string | null; summary: string; occurred_at: string }[];
  tasks: { id: string; title: string; due_at: string; status: string }[];
}

const money = (v: number, c: string) => new Intl.NumberFormat("en", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v);

export function CrmAdmin({ report, reps, settings }: { report: CrmReport; reps: { id: string; full_name: string }[]; settings: CrmSettings }) {
  const [tab, setTab] = useState<"report" | "leads" | "settings">("report");
  return (
    <div className="space-y-6">
      <div className="flex gap-1" role="tablist">
        {([["report", "Report"], ["leads", "All leads"], ["settings", "CRM settings"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={tab === k ? btnCls : btnGhostCls}>{label}</button>
        ))}
      </div>
      {tab === "report" && <ReportView report={report} />}
      {tab === "leads" && <LeadsView reps={reps} />}
      {tab === "settings" && <SettingsView initial={settings} learned={report.learned} />}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------------------- report
function ReportView({ report }: { report: CrmReport }) {
  const t = report.totals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Leads" value={t.leads} />
        <Stat label="Open deals" value={t.open} />
        <Stat label="Gone quiet" value={t.stale} hint="past the stale-lead threshold" />
        <Stat label="Overdue tasks" value={t.overdueTasks} />
        <Stat label="Won / lost" value={`${t.won} / ${t.lost}`} />
      </div>
      <Card title="Pipeline forecast">
        {report.forecast.length === 0 ? <Empty>No deal values yet. Reps add an expected value to each lead.</Empty> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">Currency</th><th>Open deals</th><th>Open value</th><th>Weighted forecast</th><th>Won</th></tr></thead>
            <tbody>
              {report.forecast.map((f) => (
                <tr key={f.currency} className="border-t border-slate-100"><td className="py-2 font-semibold">{f.currency}</td><td>{f.openCount}</td><td>{money(f.open, f.currency)}</td><td className="font-semibold text-purple">{money(f.weighted, f.currency)}</td><td>{money(f.won, f.currency)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-navy/50">Weighted = value × the win probability for its stage (or the rep&apos;s own number for that lead). Currencies are never added together.</p>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Where leads are">
          <ul className="space-y-1 text-sm">
            {STAGES.map((s) => <li key={s} className="flex justify-between border-b border-slate-100 py-1"><span>{STAGE_LABELS[s]}</span><span className="font-semibold">{report.byStage[s]}</span></li>)}
          </ul>
        </Card>
        <Card title="Why deals are lost">
          {report.lostReasons.length === 0 ? <Empty>No lost deals yet.</Empty> : (
            <ul className="space-y-1 text-sm">{report.lostReasons.map((r) => <li key={r.reason} className="flex justify-between border-b border-slate-100 py-1"><span>{LOST_REASON_LABELS[r.reason]}</span><span className="font-semibold">{r.count}</span></li>)}</ul>
          )}
        </Card>
      </div>
      <Card title="By rep">
        {report.perRep.length === 0 ? <Empty>No leads yet.</Empty> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">Rep</th><th>Open</th><th>Quiet</th><th>Overdue tasks</th><th>Won</th><th>Lost</th></tr></thead>
            <tbody>{report.perRep.map((r) => <tr key={r.id} className="border-t border-slate-100"><td className="py-2 font-semibold">{r.name}</td><td>{r.open}</td><td>{r.stale > 0 ? <Badge tone="amber">{r.stale}</Badge> : 0}</td><td>{r.overdueTasks > 0 ? <Badge tone="red">{r.overdueTasks}</Badge> : 0}</td><td>{r.won}</td><td>{r.lost}</td></tr>)}</tbody>
          </table>
        )}
      </Card>
      <Card title="Your real win rates">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">Reached stage</th><th>Leads</th><th>Went on to win</th><th>Win rate</th><th>Probability in use</th></tr></thead>
          <tbody>
            {report.learned.map((l) => (
              <tr key={l.stage} className="border-t border-slate-100">
                <td className="py-2">{STAGE_LABELS[l.stage]}</td><td>{l.reached}</td><td>{l.won}</td>
                <td>{l.rate === null ? "—" : `${Math.round(l.rate * 100)}%`}{l.suggested === null && l.reached > 0 ? <span className="ml-1 text-xs text-navy/40">(too few to trust)</span> : null}</td>
                <td>{report.probabilities[l.stage]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-navy/50">The probabilities start as general defaults. Once at least 10 leads have reached a stage, the real rate here is the better number: update it under CRM settings.</p>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------------------- leads
function LeadsView({ reps }: { reps: { id: string; full_name: string }[] }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [rep, setRep] = useState("");
  const [stale, setStale] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ leads: AdminLead[]; total: number; pageSize: number } | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState<ApiResult | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (q.trim()) p.set("q", q.trim());
    if (stage) p.set("stage", stage);
    if (status) p.set("status", status);
    if (rep) p.set("rep", rep);
    if (stale) p.set("stale", "1");
    const r = await api(`/api/acquisition/crm/leads?${p}`, "GET");
    if (r.ok) setData({ leads: r.leads as AdminLead[], total: Number(r.total), pageSize: Number(r.pageSize) });
    else setMsg(r);
  }, [q, stage, status, rep, stale, page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function reassign() {
    if (!target || sel.length === 0) return;
    if (!window.confirm(`Move ${sel.length} lead(s) to ${reps.find((r) => r.id === target)?.full_name}? Their open tasks move too.`)) return;
    setBusy(true);
    const r = await api("/api/acquisition/crm/reassign", "POST", { leadIds: sel, toEmployeeId: target });
    setBusy(false);
    setMsg(r);
    if (r.ok) { setSel([]); void load(); }
  }

  async function merge() {
    const picked = (data?.leads ?? []).filter((l) => sel.includes(l.id));
    if (picked.length !== 2) return;
    const [keep, drop] = [...picked].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (!window.confirm(`Merge "${drop.full_name}" into the older lead "${keep.full_name}"? The duplicate is removed; its timeline and open tasks move across.`)) return;
    setBusy(true);
    const r = await api("/api/acquisition/crm/merge", "POST", { keepId: keep.id, dropId: drop.id });
    setBusy(false);
    setMsg(r);
    if (r.ok) { setSel([]); void load(); }
  }

  async function open(id: string) {
    const r = await api(`/api/acquisition/crm/leads/${id}`, "GET");
    if (r.ok) setDetail({ lead: r.lead as Record<string, unknown>, activities: r.activities as Detail["activities"], tasks: r.tasks as Detail["tasks"] });
    else setMsg(r);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2"><label className={labelCls}>Search name, email or company</label><input className={inputCls} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <div><label className={labelCls}>Rep</label><select className={inputCls} value={rep} onChange={(e) => { setRep(e.target.value); setPage(1); }}><option value="">All reps</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
          <div><label className={labelCls}>Stage</label><select className={inputCls} value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}><option value="">Any</option>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></div>
          <div><label className={labelCls}>Status</label><select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Any</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
          <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-navy"><input type="checkbox" checked={stale} onChange={(e) => { setStale(e.target.checked); setPage(1); }} /> Gone quiet only</label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select className={`${inputCls} max-w-xs`} value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Reassign to"><option value="">Reassign selected to…</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select>
          <button className={btnCls} disabled={busy || !target || sel.length === 0} onClick={reassign}>Reassign {sel.length || ""}</button>
          <button className={btnGhostCls} disabled={busy || sel.length !== 2} onClick={merge} title="Select exactly two leads">Merge two selected</button>
          <a className={btnGhostCls} href="/api/acquisition/crm/export">Export all (CSV)</a>
        </div>
        <Feedback result={msg} />
      </Card>

      <Card>
        {!data ? <p className="text-sm text-navy/50">Loading…</p> : data.leads.length === 0 ? <Empty>No leads match.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="w-8" /><th className="py-1">Lead</th><th>Owner</th><th>Stage</th><th>Status</th><th>Fit</th><th>Engagement</th><th>Quiet</th></tr></thead>
              <tbody>
                {data.leads.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td><input type="checkbox" checked={sel.includes(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.full_name}`} /></td>
                    <td className="py-2"><button className="text-left font-semibold text-purple hover:underline" onClick={() => open(l.id)}>{l.full_name}</button><div className="text-xs text-navy/50">{l.email}{l.company_name ? ` · ${l.company_name}` : ""}</div></td>
                    <td>{l.owner}</td><td>{STAGE_LABELS[l.stage as Stage] ?? l.stage}</td><td>{STATUS_LABELS[l.status as keyof typeof STATUS_LABELS] ?? l.status}</td>
                    <td>{l.fit_score ?? "—"}</td><td>{l.engagement_score ?? "—"}</td>
                    <td>{l.stale ? <Badge tone="amber">{l.days_quiet}d</Badge> : <span className="text-navy/40">{l.days_quiet}d</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm text-navy/60">
          <span>{data ? `${data.total} lead${data.total === 1 ? "" : "s"}` : ""}</span>
          <span className="flex items-center gap-2"><button className={btnGhostCls} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>Page {page} of {pages}<button className={btnGhostCls} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></span>
        </div>
      </Card>

      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} onSaved={() => { void load(); setDetail(null); }} />}
    </div>
  );
}

function DetailPanel({ detail, onClose, onSaved }: { detail: Detail; onClose: () => void; onSaved: () => void }) {
  const lead = detail.lead as { id: string; full_name: string; email: string; stage: string; status: string; lost_reason?: string | null; employees?: { full_name: string } | null };
  const [stage, setStage] = useState(lead.stage);
  const [status, setStatus] = useState(lead.status);
  const [reason, setReason] = useState(lead.lost_reason ?? "");
  const [res, setRes] = useState<ApiResult | null>(null);
  async function save() {
    const patch: Record<string, unknown> = { stage, status };
    if (stage === "lost") patch.lost_reason = reason || null;
    const r = await api(`/api/acquisition/crm/leads/${lead.id}`, "PATCH", patch);
    setRes(r);
    if (r.ok) onSaved();
  }
  return (
    <Card title={`${lead.full_name} · ${lead.email}`} action={<button className={btnGhostCls} onClick={onClose}>Close</button>}>
      <p className="mb-3 text-xs text-navy/50">Owned by {lead.employees?.full_name ?? "—"}</p>
      <div className="grid gap-3 md:grid-cols-4">
        <div><label className={labelCls}>Stage</label><select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}</select></div>
        <div><label className={labelCls}>Status</label><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
        {stage === "lost" && <div><label className={labelCls}>Why lost</label><select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Choose a reason…</option>{LOST_REASONS.map((r) => <option key={r} value={r}>{LOST_REASON_LABELS[r]}</option>)}</select></div>}
        <div className="flex items-end"><button className={btnCls} onClick={save}>Save</button></div>
      </div>
      <Feedback result={res} />
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold text-navy">Timeline</h3>
          {detail.activities.length === 0 ? <Empty>Nothing yet.</Empty> : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
              {detail.activities.map((a) => <li key={a.id} className="rounded-lg border border-slate-100 p-2"><div className="flex justify-between text-xs text-navy/50"><span className="font-semibold uppercase">{a.type.replace(/_/g, " ")}{a.outcome ? ` · ${a.outcome.replace(/_/g, " ")}` : ""}</span><span>{fmtDate(a.occurred_at)}</span></div><div>{a.summary}</div></li>)}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-navy">Tasks</h3>
          {detail.tasks.length === 0 ? <Empty>No tasks.</Empty> : (
            <ul className="space-y-2 text-sm">{detail.tasks.map((t) => <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2"><span>{t.title}</span><span className="text-xs text-navy/50">{t.status === "open" ? `due ${fmtDate(t.due_at)}` : t.status}</span></li>)}</ul>
          )}
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------------------------------------------------- settings
function SettingsView({ initial, learned }: { initial: CrmSettings; learned: CrmReport["learned"] }) {
  const [s, setS] = useState<CrmSettings>(initial);
  const [res, setRes] = useState<ApiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const num = (v: string) => (v === "" ? 0 : Number(v));
  async function save() {
    setBusy(true);
    setRes(await api("/api/acquisition/crm/settings", "PUT", s));
    setBusy(false);
  }
  return (
    <div className="space-y-6">
      <Card title="Gone-quiet alerts">
        <p className="mb-3 text-sm text-navy/60">A lead is &quot;quiet&quot; when nothing has happened for this many days. Reps get a daily list; you are told when one is quiet for twice as long.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {OPEN_STAGES.map((st) => (
            <div key={st}><label className={labelCls}>{STAGE_LABELS[st]} (days)</label><input type="number" min={1} max={90} className={inputCls} value={s.staleDays[st as keyof CrmSettings["staleDays"]]} onChange={(e) => setS({ ...s, staleDays: { ...s.staleDays, [st]: num(e.target.value) } })} /></div>
          ))}
        </div>
      </Card>
      <Card title="Win probability by stage">
        <p className="mb-3 text-sm text-navy/60">Used for the weighted forecast. These start as general guesses: replace them with your real rates (shown beside each) once enough leads have reached the stage.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {OPEN_STAGES.map((st) => {
            const l = learned.find((x) => x.stage === st);
            return (
              <div key={st}><label className={labelCls}>{STAGE_LABELS[st]} (%)</label><input type="number" min={0} max={100} className={inputCls} value={s.probabilities[st]} onChange={(e) => setS({ ...s, probabilities: { ...s.probabilities, [st]: num(e.target.value) } })} />
                <p className="mt-1 text-xs text-navy/50">{l?.suggested != null ? `Your real rate: ${l.suggested}%` : "Not enough data yet"}</p></div>
            );
          })}
        </div>
      </Card>
      <Card title="Follow-ups and privacy">
        <div className="grid gap-3 md:grid-cols-3">
          <div><label className={labelCls}>Follow-up task after an email (working days)</label><input type="number" min={1} max={14} className={inputCls} value={s.followUpBusinessDays} onChange={(e) => setS({ ...s, followUpBusinessDays: num(e.target.value) })} /></div>
          <div><label className={labelCls}>Anonymise inactive leads after (months, minimum 6)</label><input type="number" min={6} max={120} className={inputCls} value={s.retentionMonths} onChange={(e) => setS({ ...s, retentionMonths: num(e.target.value) })} /></div>
        </div>
        <p className="mt-2 text-xs text-navy/50">Leads that are not won and have had no activity for this long have their personal details removed automatically. Won deals are kept.</p>
      </Card>
      <div><button className={btnCls} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save CRM settings"}</button><Feedback result={res} /></div>
    </div>
  );
}
