"use client";

import { useCallback, useEffect, useState } from "react";
import { CrmTask, crm, dueLabel } from "./shared";

/** One day after the later of now and the task's due time (so snoozing an overdue task moves it to tomorrow, not yesterday). */
const snoozedDue = (dueIso: string) => new Date(Math.max(Date.now(), new Date(dueIso).getTime()) + 24 * 3_600_000).toISOString();

const btnGhost = "rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50 transition";

/** Everything the rep has to do, soonest first: overdue, today, then later. */
export function TasksPanel({ onOpenLead, onChanged }: { onOpenLead: (leadId: string) => void; onChanged: () => void }) {
  const [open, setOpen] = useState<CrmTask[]>([]);
  const [done, setDone] = useState<{ id: string; title: string; rep_leads: { full_name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await crm<{ open: CrmTask[]; done: { id: string; title: string; rep_leads: { full_name: string } | null }[] }>("/api/rep/tasks");
    if (r.ok) { setOpen(r.open ?? []); setDone(r.done ?? []); setError(null); } else setError(r.error ?? "Could not load tasks");
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(t: CrmTask, body: Record<string, unknown>) {
    const r = await crm(`/api/rep/tasks/${t.id}`, "PATCH", body);
    if (!r.ok) setError(r.error ?? "Could not update the task");
    await load();
    onChanged();
  }

  const now = new Date();
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  const overdue = open.filter((t) => new Date(t.due_at) < now);
  const today = open.filter((t) => new Date(t.due_at) >= now && new Date(t.due_at) <= endOfToday);
  const later = open.filter((t) => new Date(t.due_at) > endOfToday);

  const group = (title: string, list: CrmTask[], tone: string) => list.length === 0 ? null : (
    <section className="space-y-2">
      <h3 className={`text-xs font-extrabold uppercase tracking-wider ${tone}`}>{title} ({list.length})</h3>
      <ul className="space-y-2">
        {list.map((t) => {
          const d = dueLabel(t.due_at);
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-3">
              <div>
                <div className="text-sm font-semibold text-white">{t.title}</div>
                <button className="text-xs text-purple-300 hover:underline" onClick={() => onOpenLead(t.lead_id)}>{t.rep_leads?.full_name ?? "Lead"}{t.rep_leads?.company_name ? ` · ${t.rep_leads.company_name}` : ""}</button>
                <span className={`ml-2 text-xs ${d.overdue ? "text-rose-300" : "text-slate-400"}`}>{d.text}</span>
                {t.auto && <span className="ml-2 text-[9px] uppercase text-slate-500">auto</span>}
              </div>
              <div className="flex gap-1">
                <button className={btnGhost} onClick={() => act(t, { status: "done" })}>Done</button>
                <button className={btnGhost} onClick={() => act(t, { dueAt: snoozedDue(t.due_at) })}>+1 day</button>
                <button className={btnGhost} onClick={() => act(t, { status: "cancelled" })} title="Cancel">✕</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );

  if (loading) return <p className="text-xs text-slate-400">Loading your tasks…</p>;
  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300">{error}</p>}
      {open.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">You are all caught up. Tasks appear here when you send an email (a follow-up), get a reply, or someone books a call. You can also add your own from any lead.</p>}
      {group("Overdue", overdue, "text-rose-300")}
      {group("Today", today, "text-amber-300")}
      {group("Coming up", later, "text-slate-300")}
      {done.length > 0 && <p className="text-[11px] text-slate-500">Done this week: {done.map((d) => `${d.title}${d.rep_leads?.full_name ? ` (${d.rep_leads.full_name})` : ""}`).join(" · ")}</p>}
    </div>
  );
}
