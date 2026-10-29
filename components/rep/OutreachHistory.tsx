"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";

interface Log { id: string; recipient_email: string; recipient_name: string | null; company_name: string | null; subject: string; sent_at: string; stage?: string | null }

const field = "rounded-lg bg-[#0D1322] border border-white/[0.08] px-2.5 py-2 text-xs text-white outline-none focus:border-purple";
const pill = (on: boolean) => `px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${on ? "bg-purple text-white shadow-md shadow-purple/20" : "bg-[#131B2E] text-slate-400 hover:text-white"}`;

/** Every email the rep has sent, loaded a page at a time from the server (so 50 or 5,000 sends behave the same). */
export function OutreachHistory({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stage, setStage] = useState<"all" | "cold" | "follow_up">("all");
  const [range, setRange] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => { setQ(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), stage, range, q, tz: String(new Date().getTimezoneOffset()) });
    try {
      const res = await fetch(`/api/rep/outreach/history?${params}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; logs?: Log[]; total?: number; error?: string; stageFiltered?: boolean };
      if (!data.ok) { setError(data.error ?? "Could not load your sent emails."); return; }
      setError(null);
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setNote(stage !== "all" && data.stageFiltered === false ? "Cold and follow-up are not separated yet, so all sent emails are shown." : null);
    } catch {
      setError("Network error loading your sent emails.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, stage, range, q]);
  useEffect(() => { void load(); }, [load, refreshKey]);

  const change = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Sent emails <span className="font-normal text-slate-400">({total})</span></h3>
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([["all", "All"], ["cold", "Cold"], ["follow_up", "Follow-ups"]] as const).map(([k, label]) => <button key={k} onClick={() => change(() => setStage(k))} className={pill(stage === k)}>{label}</button>)}
        <select className={field} value={range} onChange={(e) => change(() => setRange(e.target.value))} aria-label="Date range">
          <option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
        </select>
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company or subject" className={`${field} w-full pl-8`} />
        </div>
      </div>

      {note && <p className="text-[11px] text-amber-300">{note}</p>}
      {error && <p className="rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

      {!error && logs.length === 0 && !loading ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#131B2E]/60 p-6 text-center text-sm text-slate-400">{total === 0 && !q && stage === "all" && range === "all" ? "You have not sent any emails yet." : "No sent emails match."}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#131B2E]/60">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400"><th className="px-3 py-2">Sent</th><th className="px-2 py-2">To</th><th className="px-2 py-2">Subject</th><th className="px-2 py-2">Type</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-white/[0.06] align-top">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-300">{new Date(l.sent_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-2 py-2.5"><div className="font-semibold text-white">{l.recipient_name || l.recipient_email}</div><div className="text-xs text-slate-400">{l.company_name ? `${l.company_name} · ` : ""}{l.recipient_email}</div></td>
                  <td className="px-2 py-2.5 text-xs text-slate-300">{l.subject}</td>
                  <td className="px-2 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${l.stage === "follow_up" ? "bg-sky-500/15 text-sky-300" : "bg-slate-500/20 text-slate-300"}`}>{l.stage === "follow_up" ? "Follow-up" : "Cold"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination variant="dark" page={page} pageSize={pageSize} totalCount={total} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
        </div>
      )}
    </div>
  );
}
