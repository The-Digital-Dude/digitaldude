"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Search, Send, Sparkles, X } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { FOLLOW_UP_LABELS, FOLLOW_UP_REASONS, type FollowUpReason } from "@/lib/crm/followups";
import { CrmLead, crm, dueLabel } from "./shared";

const field = "rounded-lg bg-[#0D1322] border border-white/[0.08] px-2.5 py-2 text-xs text-white outline-none focus:border-purple";
const pill = (on: boolean) => `px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${on ? "bg-purple text-white shadow-md shadow-purple/20" : "bg-[#131B2E] text-slate-400 hover:text-white"}`;
const REASON_STYLE: Record<FollowUpReason, string> = {
  replied: "bg-sky-500/15 text-sky-300",
  overdue: "bg-rose-500/15 text-rose-300",
  due_today: "bg-amber-500/15 text-amber-300",
  no_next_step: "bg-amber-500/15 text-amber-300",
  quiet: "bg-slate-500/20 text-slate-300",
};

const BUILTIN = {
  id: "follow_up",
  name: "Value follow-up",
  subject: "Quick follow-up regarding {{company}}",
  body: "Hi {{name}},\n\nFollowing up on my previous note about custom software for {{company}}.\n\nIf it would help, I can share a short example of how we have tackled something similar. Would a quick call this week suit you?\n\nBest regards,\n{{rep_name}}",
};

interface Template { id: string; name: string; subject: string; body: string }

const firstName = (full: string) => full.trim().split(/\s+/)[0] || "there";
const merge = (text: string, l: CrmLead, repName: string) =>
  text.replace(/\{\{name\}\}/gi, firstName(l.full_name)).replace(/\{\{company\}\}/gi, l.company_name || "your company").replace(/\{\{rep_name\}\}/gi, repName);

/** Why this lead cannot be emailed from here (null = fine). Sending still runs every server-side check. */
const blocked = (l: CrmLead): string | null => {
  if (l.email_check?.status === "invalid") return "This address looks invalid";
  if (l.pool_contact_status && l.pool_contact_status !== "eligible") return "Not cleared to email yet (Lead Pool)";
  return null;
};

interface Props {
  leads: CrmLead[];
  repName: string;
  onRefresh: () => void;
  /** Open the single-email composer for one lead (the Cold Outreach tab, set to a follow-up). */
  onEmail: (l: CrmLead) => void;
}

export function FollowUps({ leads, repName, onRefresh, onEmail }: Props) {
  const [reason, setReason] = useState<FollowUpReason | "any">("any");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [picked, setPicked] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);

  const needing = useMemo(() => leads.filter((l) => (l.follow_up_reasons ?? []).length > 0), [leads]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { any: needing.length };
    for (const r of FOLLOW_UP_REASONS) c[r] = needing.filter((l) => l.follow_up_reasons?.includes(r)).length;
    return c;
  }, [needing]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const urgency = (l: CrmLead) => FOLLOW_UP_REASONS.indexOf((l.follow_up_reasons ?? [])[0] ?? "quiet");
    return needing
      .filter((l) => (reason === "any" || l.follow_up_reasons?.includes(reason)) && (!needle || `${l.full_name} ${l.email} ${l.company_name ?? ""}`.toLowerCase().includes(needle)))
      .sort((a, b) => urgency(a) - urgency(b) || (b.days_quiet ?? 0) - (a.days_quiet ?? 0));
  }, [needing, reason, q]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * pageSize, current * pageSize);
  const emailable = rows.filter((l) => !blocked(l));
  const pickedLeads = leads.filter((l) => picked.includes(l.id));
  const allShownPicked = shown.filter((l) => !blocked(l)).every((l) => picked.includes(l.id)) && shown.some((l) => !blocked(l));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const setFilter = (r: FollowUpReason | "any") => { setReason(r); setPage(1); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("any")} className={pill(reason === "any")}>All needing follow-up <span className="opacity-70">{counts.any}</span></button>
        {FOLLOW_UP_REASONS.map((r) => <button key={r} onClick={() => setFilter(r)} className={pill(reason === r)}>{FOLLOW_UP_LABELS[r]} <span className="opacity-70">{counts[r]}</span></button>)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or company" className={`${field} w-full pl-8`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setPicked(emailable.map((l) => l.id))} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Select all {emailable.length} emailable</button>
          {picked.length > 0 && <button onClick={() => setPicked([])} className="text-xs font-semibold text-slate-400 hover:text-white">Clear ({picked.length})</button>}
          <button onClick={() => setComposing(true)} disabled={picked.length === 0} className="flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-40">
            <Send size={13} /> Email {picked.length || ""} selected
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-6 text-center text-sm text-slate-400">{needing.length === 0 ? "Nothing needs a follow-up right now." : "No leads match this filter."}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#131B2E]/60">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="w-8 px-3 py-2"><input type="checkbox" className="accent-purple" aria-label="Select this page" checked={allShownPicked} onChange={(e) => setPicked((p) => e.target.checked ? [...new Set([...p, ...shown.filter((l) => !blocked(l)).map((l) => l.id)])] : p.filter((id) => !shown.some((l) => l.id === id)))} /></th>
                <th className="px-2 py-2">Lead</th><th className="px-2 py-2">Why</th><th className="px-2 py-2">Next step</th><th className="px-2 py-2">Quiet for</th><th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => {
                const why = blocked(l);
                const d = l.next_task_due ? dueLabel(l.next_task_due) : null;
                return (
                  <tr key={l.id} className="border-t border-white/[0.06] align-top">
                    <td className="px-3 py-3"><input type="checkbox" className="accent-purple" aria-label={`Select ${l.full_name}`} disabled={!!why} title={why ?? undefined} checked={picked.includes(l.id)} onChange={() => toggle(l.id)} /></td>
                    <td className="px-2 py-3"><div className="font-semibold text-white">{l.full_name}</div><div className="text-xs text-slate-400">{l.company_name ? `${l.company_name} · ` : ""}{l.email}</div></td>
                    <td className="px-2 py-3"><div className="flex flex-wrap gap-1">{(l.follow_up_reasons ?? []).map((r) => <span key={r} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${REASON_STYLE[r]}`}>{FOLLOW_UP_LABELS[r]}</span>)}</div></td>
                    <td className="px-2 py-3 text-xs">{l.next_task_title ? <><div className="text-slate-200">{l.next_task_title}</div>{d && <div className={d.overdue ? "text-rose-300" : "text-slate-400"}>{d.text}</div>}</> : <span className="font-semibold text-amber-300">None set</span>}</td>
                    <td className="px-2 py-3 text-xs text-slate-300">{l.days_quiet !== undefined ? `${l.days_quiet}d` : "–"}</td>
                    <td className="px-2 py-3 text-right"><button onClick={() => onEmail(l)} disabled={!!why} title={why ?? "Write a follow-up to this lead"} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"><Mail size={12} /> Email</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination variant="dark" page={current} pageSize={pageSize} totalCount={rows.length} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
        </div>
      )}

      {composing && <BulkFollowUp leads={pickedLeads} repName={repName} onClose={() => setComposing(false)} onDone={() => { setPicked([]); onRefresh(); }} />}
    </div>
  );
}

type Result = { id: string; state: "pending" | "sending" | "sent" | "skipped" | "failed"; note?: string };

function BulkFollowUp({ leads, repName, onClose, onDone }: { leads: CrmLead[]; repName: string; onClose: () => void; onDone: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([BUILTIN]);
  const [templateId, setTemplateId] = useState(BUILTIN.id);
  const [subject, setSubject] = useState(BUILTIN.subject);
  const [body, setBody] = useState(BUILTIN.body);
  const [useAi, setUseAi] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await crm<{ templates: { id: string; template_name: string; subject: string; body_content: string }[] }>("/api/rep/templates");
      if (r.ok) setTemplates([BUILTIN, ...(r.templates ?? []).map((t) => ({ id: t.id, name: t.template_name, subject: t.subject, body: t.body_content }))]);
    })();
  }, []);

  function pick(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  }

  const first = leads[0];
  const set = (id: string, patch: Partial<Result>) => setResults((all) => (all ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function send() {
    if (!window.confirm(`Send ${leads.length} follow-up email${leads.length === 1 ? "" : "s"}? Each one goes out individually, to that lead only.`)) return;
    setRunning(true);
    setResults(leads.map((l) => ({ id: l.id, state: "pending" })));
    for (const l of leads) {
      set(l.id, { state: "sending" });
      let s = merge(subject, l, repName);
      let m = merge(body, l, repName);
      let note: string | undefined;
      if (useAi) {
        const ai = await crm<{ subject: string; body: string }>("/api/rep/pool/compose", "POST", { email: l.email, stage: "follow_up" });
        if (ai.ok && ai.subject && ai.body) { s = ai.subject; m = ai.body; } else note = `AI draft unavailable (${ai.error ?? "unknown"}); used your template`;
      }
      const res = await fetch("/api/rep/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: l.email, recipientName: l.full_name, companyName: l.company_name ?? "", subject: s, message: m, templateUsed: useAi ? "ai_follow_up" : templateId, stage: "follow_up", includeButton: false }),
      }).catch(() => null);
      const data = (res ? await res.json().catch(() => ({})) : {}) as { ok?: boolean; error?: string; riskyWarning?: boolean };
      if (res?.ok && data.ok) { set(l.id, { state: "sent", note }); continue; }
      if (res?.status === 429) {
        set(l.id, { state: "failed", note: data.error ?? "Sending limit reached" });
        setResults((all) => (all ?? []).map((r) => (r.state === "pending" ? { ...r, state: "skipped", note: "Stopped: sending limit reached" } : r)));
        break;
      }
      if (data.riskyWarning) { set(l.id, { state: "skipped", note: "Risky address: send it from the single composer to confirm" }); continue; }
      set(l.id, { state: "failed", note: data.error ?? "Could not send" });
    }
    setRunning(false);
    onDone();
  }

  const sent = results?.filter((r) => r.state === "sent").length ?? 0;
  const byId = new Map(leads.map((l) => [l.id, l]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Email selected leads">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1322] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Follow up with {leads.length} lead{leads.length === 1 ? "" : "s"}</h3>
          <button onClick={onClose} disabled={running} className="text-slate-400 hover:text-white disabled:opacity-40" aria-label="Close"><X size={18} /></button>
        </div>

        {!results ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</label>
              <select className={`${field} w-full`} value={templateId} onChange={(e) => pick(e.target.value)}>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-300">
              <input type="checkbox" className="mt-0.5 accent-purple" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
              <span><span className="inline-flex items-center gap-1 font-semibold text-white"><Sparkles size={12} /> Write each one with AI</span><span className="block text-slate-400">Drafts a follow-up from each lead&apos;s earlier email. Leads it cannot draft for (no earlier email, already replied, missing research) get your template below instead.</span></span>
            </label>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
              <input className={`${field} w-full`} value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Message</label>
              <textarea className={`${field} w-full`} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              <p className="mt-1 text-[11px] text-slate-500">Merge tags: {"{{name}}"}, {"{{company}}"}, {"{{rep_name}}"}. Each lead gets their own filled-in copy.</p>
            </div>
            {first && !useAi && (
              <div className="rounded-lg border border-white/[0.08] bg-[#131B2E]/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview for {first.full_name}</p>
                <p className="mt-1 text-sm font-semibold text-white">{merge(subject, first, repName)}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-300">{merge(body, first, repName)}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Cancel</button>
              <button onClick={() => void send()} disabled={!subject.trim() || !body.trim()} className="flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"><Send size={13} /> Send {leads.length}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">{running ? "Sending, one at a time…" : `Done: ${sent} of ${results.length} sent.`}</p>
            <ul className="max-h-80 divide-y divide-white/[0.06] overflow-y-auto rounded-lg border border-white/[0.08]">
              {results.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
                  <span className="min-w-0"><span className="font-semibold text-white">{byId.get(r.id)?.full_name}</span>{r.note && <span className="block text-slate-400">{r.note}</span>}</span>
                  <span className={r.state === "sent" ? "text-emerald-300" : r.state === "failed" ? "text-rose-300" : r.state === "skipped" ? "text-amber-300" : "text-slate-400"}>{r.state}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end"><button onClick={onClose} disabled={running} className="rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40">Close</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
