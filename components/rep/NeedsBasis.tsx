"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { btn, btnGhost, call, card, Msg, type BasisDraft } from "./poolShared";
import { emptyQuick, quickBody, quickFromDraft, QuickBasisFields, type QuickState } from "./QuickBasis";

interface Row {
  id: string; name: string | null; role: string | null; email: string; sourceUrl: string | null; companyName: string; country: string | null;
}
interface Edit { quick: QuickState; tick: boolean; draft?: BasisDraft }

const MAX_DRAFT = 10;

/**
 * Contacts still waiting for a lawful basis. When the tab opens, the AI checks the first 10 websites automatically; rows it
 * verified are pre-filled and ticked. For each row the rep either confirms in one click or picks a reason by hand.
 * Nothing is recorded without a click, and the server applies the same checks as everywhere else.
 */
export function NeedsBasisPanel({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; note?: string } | null>(null);
  const [rowMsg, setRowMsg] = useState<Record<string, { error?: string; note?: string }>>({});
  const autoDone = useRef(false);

  const get = (id: string): Edit => edits[id] ?? { quick: emptyQuick(), tick: false };
  const patch = (id: string, p: Partial<Edit>) => setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { quick: emptyQuick(), tick: false }), ...p } }));

  const runDraft = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setChecking(true);
    const r = await call("/api/rep/pool/basis/draft", "POST", { contactIds: ids.slice(0, MAX_DRAFT) });
    setChecking(false);
    if (!r.ok) { setMsg({ error: r.error ?? "Could not check the websites" }); return; }
    const drafts = r.drafts as BasisDraft[];
    setEdits((prev) => {
      const next = { ...prev };
      for (const d of drafts) {
        const cur = next[d.contactId] ?? { quick: emptyQuick(), tick: false };
        // A verified finding fills the row; an unverified one never overwrites what the rep has chosen.
        next[d.contactId] = d.verified ? { quick: quickFromDraft(d), tick: true, draft: d } : { ...cur, draft: d };
      }
      return next;
    });
    const verified = drafts.filter((d) => d.verified).length;
    setMsg({ note: `AI checked ${drafts.length} website${drafts.length === 1 ? "" : "s"}: ${verified} verified (ticked). Read each one, then confirm. For the others, choose a reason yourself.` });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call("/api/rep/pool/needs-basis", "GET");
    if (r.ok) {
      const list = r.contacts as Row[];
      setRows(list);
      if (!autoDone.current && list.length > 0) {
        autoDone.current = true;
        void runDraft(list.map((c) => c.id));
      }
    } else setMsg({ error: r.error ?? "Could not load contacts" });
    setLoading(false);
  }, [runDraft]);
  useEffect(() => { void load(); }, [load]);

  async function save(ids: string[]) {
    const items = ids.map((id) => ({ contactId: id, ...quickBody(get(id).quick)! }));
    return call("/api/rep/pool/basis/record", "POST", { items });
  }

  async function saveOne(id: string) {
    if (!quickBody(get(id).quick)) { setRowMsg((m) => ({ ...m, [id]: { error: "Choose why you may contact them first." } })); return; }
    setBusy(true);
    setRowMsg((m) => ({ ...m, [id]: {} }));
    const r = await save([id]);
    setBusy(false);
    const x = (r.results as { ok: boolean; eligible?: boolean; error?: string; blocked?: string | null }[] | undefined)?.[0];
    if (!r.ok || !x) { setRowMsg((m) => ({ ...m, [id]: { error: [r.error, ...(r.issues ?? []).map((i) => i.message)].filter(Boolean).join(" · ") || "Could not save" } })); return; }
    if (!x.ok || !x.eligible) { setRowMsg((m) => ({ ...m, [id]: { error: x.ok ? (x.blocked ?? "Saved, but not eligible yet.") : (x.error ?? "Failed") } })); return; }
    setMsg({ note: "Saved. The contact is in your Leads CRM." });
    await load();
    onChanged();
  }

  async function confirmTicked() {
    const ids = rows.map((r) => r.id).filter((id) => get(id).tick && quickBody(get(id).quick));
    if (ids.length === 0) { setMsg({ error: "Tick at least one row that has a reason chosen." }); return; }
    setBusy(true);
    setMsg(null);
    const r = await save(ids);
    setBusy(false);
    if (!r.ok) { setMsg({ error: [r.error, ...(r.issues ?? []).map((i) => i.message)].filter(Boolean).join(" · ") || "Could not save" }); return; }
    const m: Record<string, { error?: string }> = {};
    for (const x of r.results as { contactId: string; ok: boolean; eligible?: boolean; error?: string; blocked?: string | null }[]) if (!x.ok || !x.eligible) m[x.contactId] = { error: x.ok ? (x.blocked ?? "Saved, but not eligible yet.") : (x.error ?? "Failed") };
    setRowMsg(m);
    setMsg({ note: `${r.recorded as number} contact(s) cleared and added to your Leads CRM.${Object.keys(m).length ? ` ${Object.keys(m).length} need attention (shown on the row).` : ""}` });
    await load();
    onChanged();
  }

  if (loading && rows.length === 0) return <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  if (rows.length === 0) return <div className={`${card} text-center text-xs text-slate-400`}>Nothing waiting. Contacts you add or accept appear here until they are confirmed.</div>;

  const ready = rows.filter((r) => get(r.id).tick && quickBody(get(r.id).quick)).length;
  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-xs text-slate-300">{rows.length} contact{rows.length === 1 ? "" : "s"} to confirm. {checking ? "AI is checking their websites…" : "Confirm each in one click."}</p>
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} disabled={busy || checking} onClick={() => void runDraft(rows.map((r) => r.id))}><Sparkles size={12} className="mr-1 inline" />Check websites again</button>
          <button className={btn} disabled={busy || checking || ready === 0} onClick={() => void confirmTicked()}>Confirm ticked ({ready})</button>
        </div>
      </div>
      <Msg error={msg?.error} note={msg?.note} />
      <ul className="space-y-3">
        {rows.map((r) => {
          const e = get(r.id);
          return (
            <li key={r.id} className={card}>
              <div className="flex items-start gap-3 text-xs">
                <input type="checkbox" className="mt-1" checked={e.tick} onChange={() => patch(r.id, { tick: !e.tick })} aria-label={`Include ${r.email} in Confirm ticked`} />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-bold text-white">{r.name || r.email}{r.role && <span className="font-normal text-slate-500"> · {r.role}</span>}</p>
                  <p className="text-slate-400">{r.email} · {r.companyName}{r.country && ` · ${r.country}`}{r.sourceUrl && <> · <a className="text-purple-300 underline" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">where it was found</a></>}</p>
                  <QuickBasisFields value={e.quick} onChange={(quick) => patch(r.id, { quick })} draft={e.draft} sourceUrl={r.sourceUrl} />
                  <button className={btn} disabled={busy} onClick={() => void saveOne(r.id)}>{e.draft?.verified && e.quick.reason === "published" ? "Confirm & save" : "Save"}</button>
                  <Msg error={rowMsg[r.id]?.error} note={rowMsg[r.id]?.note} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
