"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { btn, btnGhost, call, card, input, Msg, type BasisDraft } from "./poolShared";

interface Row {
  id: string; name: string | null; role: string | null; email: string; sourceUrl: string | null; companyName: string; country: string | null;
}
interface Edit { draft: BasisDraft; tick: boolean; legalBasis: string }

const MAX_DRAFT = 10;

/**
 * Every contact still waiting for a lawful basis, in one table. "Draft with AI" fills in the evidence for the
 * ones it can verify; the rep reads each row, ticks the ones they have checked, and records them together.
 * Nothing is recorded without a tick, and the server applies the same checks as the single-contact form.
 */
export function NeedsBasisPanel({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; note?: string } | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call("/api/rep/pool/needs-basis", "GET");
    if (r.ok) setRows(r.contacts as Row[]);
    else setMsg({ error: r.error ?? "Could not load contacts" });
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggle = (id: string) => setPick((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function draft() {
    const ids = [...pick].slice(0, MAX_DRAFT);
    if (ids.length === 0) { setMsg({ error: "Tick the contacts you want drafted first." }); return; }
    setBusy(true);
    setMsg(null);
    const r = await call("/api/rep/pool/basis/draft", "POST", { contactIds: ids });
    setBusy(false);
    if (!r.ok) { setMsg({ error: r.error ?? "Could not draft" }); return; }
    const drafts = r.drafts as BasisDraft[];
    setEdits((prev) => {
      const next = { ...prev };
      for (const d of drafts) next[d.contactId] = { draft: d, tick: d.verified, legalBasis: d.legalBasis };
      return next;
    });
    const verified = drafts.filter((d) => d.verified).length;
    setMsg({ note: `${verified} of ${drafts.length} verified on a real page and ticked. Read each one before you record. ${pick.size > MAX_DRAFT ? `Only the first ${MAX_DRAFT} were drafted; run it again for the rest.` : ""}` });
  }

  async function record() {
    const items = Object.values(edits)
      .filter((e) => e.tick && e.legalBasis.trim().length >= 10)
      .map((e) => ({ contactId: e.draft.contactId, consentType: e.draft.consentType, legalBasis: e.legalBasis.trim(), evidenceUrl: e.draft.evidenceUrl ?? "", evidenceNotes: e.draft.evidenceNotes }));
    if (items.length === 0) { setMsg({ error: "Tick at least one reviewed row with a basis of 10+ characters." }); return; }
    setBusy(true);
    setMsg(null);
    const r = await call("/api/rep/pool/basis/record", "POST", { items });
    setBusy(false);
    if (!r.ok) { setMsg({ error: [r.error, ...(r.issues ?? []).map((i) => i.message)].filter(Boolean).join(" · ") }); return; }
    const out: Record<string, string> = {};
    for (const x of r.results as { contactId: string; ok: boolean; eligible?: boolean; error?: string; blocked?: string | null }[]) out[x.contactId] = x.ok ? (x.eligible ? "Recorded" : (x.blocked ?? "Saved, not yet eligible")) : (x.error ?? "Failed");
    setResults(out);
    setMsg({ note: `${r.recorded as number} contact(s) cleared. They are in your Leads CRM.` });
    await load();
    onChanged();
  }

  if (loading) return <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  if (rows.length === 0) return <div className={`${card} text-center text-xs text-slate-400`}>Nothing waiting. Contacts you add or accept appear here until a lawful basis is recorded.</div>;

  const ticked = Object.values(edits).filter((e) => e.tick).length;
  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-xs text-slate-300">{rows.length} contact{rows.length === 1 ? "" : "s"} need a lawful basis. Tick up to {MAX_DRAFT} and let AI check their websites.</p>
        <div className="flex gap-2">
          <button className={btnGhost} disabled={busy} onClick={() => setPick(new Set(rows.slice(0, MAX_DRAFT).map((r) => r.id)))}>Tick first {MAX_DRAFT}</button>
          <button className={btn} disabled={busy || pick.size === 0} onClick={() => void draft()}><Sparkles size={12} className="mr-1 inline" />{busy ? "Working…" : `Draft with AI (${Math.min(pick.size, MAX_DRAFT)})`}</button>
          <button className={btn} disabled={busy || ticked === 0} onClick={() => void record()}>Record ticked ({ticked})</button>
        </div>
      </div>
      <Msg error={msg?.error} note={msg?.note} />
      <ul className="space-y-3">
        {rows.map((r) => {
          const e = edits[r.id];
          return (
            <li key={r.id} className={card}>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={e ? e.tick : pick.has(r.id)} onChange={() => (e ? setEdits({ ...edits, [r.id]: { ...e, tick: !e.tick } }) : toggle(r.id))} aria-label={`Select ${r.email}`} />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-white">{r.name || r.email}{r.role && <span className="font-normal text-slate-500"> · {r.role}</span>}</p>
                  <p className="text-slate-400">{r.email} · {r.companyName}{r.country && ` · ${r.country}`}</p>
                  {results[r.id] && <p className="mt-1 text-[11px] text-emerald-300">{results[r.id]}</p>}
                  {e && (
                    <div className="mt-3 space-y-2">
                      {e.draft.verified ? (
                        <p className="flex items-center gap-1.5 text-[11px] text-emerald-300"><CheckCircle2 size={12} /> Address found on <a className="underline" href={e.draft.evidenceUrl ?? "#"} target="_blank" rel="noopener noreferrer">this page</a>. AI draft: read it before recording.</p>
                      ) : (
                        <p className="flex items-start gap-1.5 text-[11px] text-amber-300"><TriangleAlert size={12} className="mt-0.5 shrink-0" /> {e.draft.warning}</p>
                      )}
                      <textarea className={input} rows={2} value={e.legalBasis} placeholder="Why you may contact them" onChange={(ev) => setEdits({ ...edits, [r.id]: { ...e, legalBasis: ev.target.value } })} />
                      {e.draft.evidenceNotes && <p className="text-[11px] text-slate-500">{e.draft.evidenceNotes}</p>}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
