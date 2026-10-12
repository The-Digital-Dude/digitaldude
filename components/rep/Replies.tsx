"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { btn, btnGhost, call, card, input, Msg } from "./poolShared";

interface Reply { id: string; classification: string; body: string; receivedAt: string; contactName: string | null; contactEmail: string; companyName: string }

const TONE: Record<string, string> = {
  interested: "bg-emerald-500/15 text-emerald-300",
  not_interested: "bg-white/5 text-slate-400",
  opt_out: "bg-rose-500/15 text-rose-300",
  uncertain: "bg-amber-500/15 text-amber-300",
};

/** Replies from the rep's own contacts. "Suggest a reply" drafts text; "Use in composer" opens the normal outreach composer to edit and send. */
export function RepliesPanel({ onUseReply }: { onUseReply?: (r: { email: string; name: string; company: string; message: string }) => void }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ error?: string; note?: string } | null>(null);
  const [rowErr, setRowErr] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call("/api/rep/pool/replies", "GET");
    if (r.ok) setReplies(r.replies as Reply[]);
    else setMsg({ error: r.error ?? "Could not load replies" });
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function suggest(id: string) {
    setBusy(id);
    setRowErr((m) => ({ ...m, [id]: "" }));
    const r = await call(`/api/rep/pool/replies/${id}/suggest`, "POST", {});
    setBusy(null);
    if (r.ok) setDrafts((d) => ({ ...d, [id]: String(r.suggestion) }));
    else setRowErr((m) => ({ ...m, [id]: r.error ?? "Could not suggest a reply" }));
  }

  if (loading) return <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  return (
    <div className="space-y-4">
      <Msg error={msg?.error} note={msg?.note} />
      {replies.length === 0 ? (
        <div className={`${card} text-center text-xs text-slate-400`}>No replies yet. When a contact answers, it appears here (and you get a notification).</div>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => (
            <li key={r.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="font-bold text-white">{r.contactName || r.contactEmail} <span className="font-normal text-slate-500">· {r.companyName} · {new Date(r.receivedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span></p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${TONE[r.classification] ?? TONE.uncertain}`}>{r.classification.replace(/_/g, " ")}</span>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/[0.03] p-2.5 font-sans text-xs text-slate-300">{r.body || "(empty)"}</pre>
              {r.classification !== "opt_out" && (
                drafts[r.id] === undefined ? (
                  <div className="mt-3">
                    <button className={btnGhost} disabled={busy === r.id} onClick={() => void suggest(r.id)}><Sparkles size={12} className="mr-1 inline" />{busy === r.id ? "Thinking…" : "Suggest a reply"}</button>
                    <Msg error={rowErr[r.id]} />
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-slate-500">AI draft. Read and change it as you like. You send it from the outreach composer.</p>
                    <textarea className={input} rows={6} value={drafts[r.id]} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <button className={btn} disabled={!onUseReply} onClick={() => onUseReply?.({ email: r.contactEmail, name: r.contactName ?? "", company: r.companyName, message: drafts[r.id] })}>Use in composer</button>
                      <button className={btnGhost} onClick={() => setDrafts((d) => { const n = { ...d }; delete n[r.id]; return n; })}>Discard</button>
                    </div>
                  </div>
                )
              )}
              {r.classification === "opt_out" && <p className="mt-2 text-[11px] text-rose-300">They asked not to be contacted. They are on the do-not-contact list.</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
