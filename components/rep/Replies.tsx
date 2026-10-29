"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { call, card, Msg } from "./poolShared";

interface Reply { id: string; classification: string; body: string; receivedAt: string; contactName: string | null; contactEmail: string; companyName: string }

const TONE: Record<string, string> = {
  interested: "bg-emerald-500/15 text-emerald-300",
  not_interested: "bg-white/5 text-slate-400",
  opt_out: "bg-rose-500/15 text-rose-300",
  uncertain: "bg-amber-500/15 text-amber-300",
};

/** Replies from the rep's own contacts. Read-only: the team answers every reply, so there is nothing for the rep to send from here. */
export function RepliesPanel() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ error?: string; note?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call("/api/rep/pool/replies", "GET");
    if (r.ok) setReplies(r.replies as Reply[]);
    else setMsg({ error: r.error ?? "Could not load replies" });
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  return (
    <div className="space-y-4">
      <Msg error={msg?.error} note={msg?.note} />
      <p className="rounded-lg bg-sky-500/10 p-3 text-xs text-sky-200">When a contact replies, the team answers it. You can read what they wrote here and on the lead&apos;s timeline, and you will be told when there is a next step for you.</p>
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
              {r.classification === "opt_out" ? <p className="mt-2 text-[11px] text-rose-300">They asked not to be contacted. They are on the do-not-contact list.</p> : <p className="mt-2 text-[11px] text-slate-500">The team is answering this one.</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
