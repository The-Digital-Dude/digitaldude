"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton, Feedback, api, useAction, type ApiResult } from "./client";
import { Badge, StatusBadge, btnCls, btnGhostCls, inputCls, labelCls } from "./ui";
import { Pagination } from "@/components/admin/Pagination";

interface Market { id: string; name: string; country: string }
interface Rep { id: string; full_name: string; email: string; status: string; onboarding_completed: boolean | null }
interface Row {
  id: string; name: string; domain: string | null; website: string | null; country: string | null; region: string | null; industry: string | null;
  status: string; pool_status: string; owner_employee_id: string | null; fit_score: number | null; fit_band: string | null; contact_count: number;
  source: string; possible_duplicate_of: string | null; acq_markets: { name: string } | null;
}

const POOL = ["unassigned", "assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"];
const label = (s: string) => s.replace(/_/g, " ");
const BAND: Record<string, { text: string; tone: "green" | "amber" | "slate" }> = {
  prioritize_review: { text: "Prioritise", tone: "green" },
  gather_evidence: { text: "Gather evidence", tone: "amber" },
  deprioritize: { text: "Deprioritise", tone: "slate" },
};

const EMPTY = { q: "", market: "", country: "", band: "", poolStatus: "", owner: "", source: "", duplicate: false, contacts: "", research: "" };

/** The global lead pool: filters, server pagination, multi-select and bulk actions. */
export function PoolTable({ markets }: { markets: Market[] }) {
  const [f, setF] = useState(EMPTY);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [rows, setRows] = useState<Row[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState({ action: "", employeeId: "", poolStatus: "", marketId: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(f.q), 300);
    return () => clearTimeout(t);
  }, [f.q]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    const merged = { ...f, q: debouncedQ };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v === true ? "1" : String(v));
    return p;
  }, [f, debouncedQ]);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams(query);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    const r = await api(`/api/acquisition/pool?${p.toString()}`, "GET");
    if (r.ok) {
      setRows(r.companies as Row[]);
      setTotal(Number(r.totalCount ?? 0));
      setReps(r.reps as Rep[]);
      setLoadError(null);
    } else setLoadError(r.error ?? "Could not load the pool");
    setLoading(false);
  }, [query, page, pageSize]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [query]);

  const repName = (id: string | null) => (id ? reps.find((r) => r.id === id)?.full_name ?? "Unknown" : null);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function runBulk() {
    const ids = [...selected];
    if (!ids.length || !bulk.action) return;
    let body: Record<string, unknown> = { action: bulk.action, companyIds: ids };
    let confirmText = "";
    if (bulk.action === "assign") {
      body = { ...body, employeeId: bulk.employeeId === "none" ? null : bulk.employeeId };
      if (!bulk.employeeId) { setResult({ ok: false, error: "Choose a rep (or Unassign) first" }); return; }
      confirmText = bulk.employeeId === "none" ? `Unassign ${ids.length} companies and return them to the pool?` : `Assign ${ids.length} companies to ${repName(bulk.employeeId)}?`;
    } else if (bulk.action === "set_status") {
      if (!bulk.poolStatus) { setResult({ ok: false, error: "Choose a status first" }); return; }
      body = { ...body, poolStatus: bulk.poolStatus };
    } else if (bulk.action === "set_market") {
      body = { ...body, marketId: bulk.marketId || null };
      confirmText = `Change the market (and country/industry) of ${ids.length} companies?`;
    } else if (bulk.action === "find_contacts") {
      if (ids.length > 10) { setResult({ ok: false, error: "Select 10 or fewer companies for one contact search (it uses finder credits)." }); return; }
      confirmText = `Search for contacts at ${ids.length} companies? This uses contact-finder credits.`;
    } else if (bulk.action === "archive") confirmText = `Archive ${ids.length} companies? They leave the pool and are released from their owners (nothing is deleted).`;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setResult(null);
    const r = await api("/api/acquisition/pool/bulk", "POST", body);
    setBusy(false);
    setResult(r);
    if (r.ok) {
      setNote(bulk.action === "find_contacts" ? `Searched ${r.searched as number} compan${r.searched === 1 ? "y" : "ies"}: ${r.suggestions as number} new suggestion${r.suggestions === 1 ? "" : "s"}${(r.skipped as number) > 0 ? `, ${r.skipped as number} skipped` : ""}.${r.stopped ? ` Stopped: ${r.stopped as string}` : ""} Review them under Suggestions.` : `${r.changed} compan${r.changed === 1 ? "y" : "ies"} updated.`);
      setSelected(new Set());
      void load();
    }
  }

  const exportUrl = `/api/acquisition/pool/export?${query.toString()}`;
  const filtersActive = JSON.stringify({ ...f }) !== JSON.stringify(EMPTY);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <input className={inputCls} placeholder="Search name or website…" value={f.q} onChange={set("q")} />
        <select className={inputCls} value={f.market} onChange={set("market")}><option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <input className={inputCls} placeholder="Country (e.g. GB)" maxLength={2} value={f.country} onChange={set("country")} />
        <select className={inputCls} value={f.poolStatus} onChange={set("poolStatus")}><option value="">Any pool status</option>{POOL.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>
        <select className={inputCls} value={f.owner} onChange={set("owner")}><option value="">Any owner</option><option value="none">Unowned</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select>
        <select className={inputCls} value={f.band} onChange={set("band")}><option value="">Any fit</option><option value="prioritize_review">Prioritise</option><option value="gather_evidence">Gather evidence</option><option value="deprioritize">Deprioritise</option></select>
        <select className={inputCls} value={f.contacts} onChange={set("contacts")}><option value="">Contacts: any</option><option value="no">No contacts (needs contact)</option><option value="yes">Has contacts</option></select>
        <select className={inputCls} value={f.source} onChange={set("source")}><option value="">Any source</option><option value="manual">Manual</option><option value="ai_discovery">AI discovered</option></select>
        <select className={inputCls} value={f.research} onChange={set("research")}><option value="">Research: active</option><option value="new">New</option><option value="researched">Researched</option><option value="deprioritized">Deprioritised</option><option value="archived">Archived</option></select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.duplicate} onChange={set("duplicate")} /> Possible duplicates only</label>
        <div className="flex items-center gap-2 sm:col-span-2">
          {filtersActive && <button className={btnGhostCls} onClick={() => setF(EMPTY)}>Clear filters</button>}
          <a className={btnGhostCls} href={exportUrl}>Export CSV ({total})</a>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-purple/30 bg-lavender/40 p-3">
          <strong className="text-sm">{selected.size} selected</strong>
          <select className={`${inputCls} max-w-xs`} value={bulk.action} onChange={(e) => setBulk({ ...bulk, action: e.target.value })}>
            <option value="">Bulk action…</option>
            <option value="assign">Assign to rep / unassign</option>
            <option value="set_status">Set pool status</option>
            <option value="set_market">Change market</option>
            <option value="research">Run AI research</option>
            <option value="find_contacts">Find contacts (max 10)</option>
            <option value="apply_rules">Apply assignment rules</option>
            <option value="archive">Archive</option>
          </select>
          {bulk.action === "assign" && (
            <select className={`${inputCls} max-w-xs`} value={bulk.employeeId} onChange={(e) => setBulk({ ...bulk, employeeId: e.target.value })}>
              <option value="">Choose…</option><option value="none">Unassign (return to pool)</option>
              {reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}{r.onboarding_completed ? "" : " (onboarding)"}</option>)}
            </select>
          )}
          {bulk.action === "set_status" && <select className={`${inputCls} max-w-xs`} value={bulk.poolStatus} onChange={(e) => setBulk({ ...bulk, poolStatus: e.target.value })}><option value="">Choose…</option>{POOL.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>}
          {bulk.action === "set_market" && <select className={`${inputCls} max-w-xs`} value={bulk.marketId} onChange={(e) => setBulk({ ...bulk, marketId: e.target.value })}><option value="">No market</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
          <button className={btnCls} disabled={busy || !bulk.action} onClick={() => void runBulk()}>{busy ? "Working…" : "Apply"}</button>
          <button className={btnGhostCls} onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}
      {note && <p className="mt-2 text-sm font-medium text-emerald-700" role="status">{note}</p>}
      <Feedback result={result && !result.ok ? result : null} />
      {loadError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{loadError}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-navy/50">
            <tr>
              <th className="w-8 py-2 pr-2"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              <th className="pr-4">Company</th><th className="pr-4">Market / place</th><th className="pr-4">Fit</th><th className="pr-4">Pool status</th><th className="pr-4">Owner</th><th>Contacts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={7} className="py-8 text-center text-navy/50">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-navy/50">No companies match these filters.</td></tr>}
            {!loading && rows.map((c) => (
              <tr key={c.id} className={selected.has(c.id) ? "bg-lavender/30" : ""}>
                <td className="py-2 pr-2"><input type="checkbox" aria-label={`Select ${c.name}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} /></td>
                <td className="pr-4">
                  <Link className="font-semibold text-purple hover:underline" href={`/admin/acquisition/companies/${c.id}`}>{c.name}</Link>
                  <div className="text-xs text-navy/50">{c.domain ?? "no website"}{c.source === "ai_discovery" && <> · <Badge tone="purple">AI discovered</Badge></>}{c.possible_duplicate_of && <> · <Badge tone="amber">possible duplicate</Badge></>}</div>
                </td>
                <td className="pr-4 text-navy/70">{c.acq_markets?.name ?? "—"}<div className="text-xs text-navy/50">{[c.region, c.country].filter(Boolean).join(", ")}</div></td>
                <td className="pr-4">{c.fit_score === null ? <span className="text-navy/40">not scored</span> : <span className="flex items-center gap-2"><strong>{c.fit_score}</strong>{c.fit_band && BAND[c.fit_band] && <Badge tone={BAND[c.fit_band].tone}>{BAND[c.fit_band].text}</Badge>}</span>}</td>
                <td className="pr-4"><StatusBadge status={c.pool_status} /></td>
                <td className="pr-4">{repName(c.owner_employee_id) ?? <span className="text-navy/40">unowned</span>}</td>
                <td>{c.contact_count > 0 ? c.contact_count : <Badge tone="amber">needs contact</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} totalCount={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}

/* ---------- Rep market access + auto-assignment rules ---------- */

interface Grant { employee_id: string; market_id: string; claim_cap: number }
interface Rule { id: string; employee_id: string; market_id: string | null; country: string | null; min_fit_score: number | null; priority: number; enabled: boolean }

export function RepAccessCard({ reps, markets, grants }: { reps: Rep[]; markets: Market[]; grants: Grant[] }) {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ employeeId: "", marketId: "", claimCap: "25" });
  const marketName = (id: string) => markets.find((m) => m.id === id)?.name ?? "Unknown market";
  return (
    <div>
      <p className="mb-3 text-sm text-navy/70">Reps can claim unowned companies only from markets listed here, up to the cap on open companies (assigned, needs contact, contacted). A cap of 0 stops claiming. Revoking access never takes back companies a rep already owns.</p>
      <ul className="mb-4 space-y-2 text-sm">
        {reps.map((r) => {
          const mine = grants.filter((g) => g.employee_id === r.id);
          return (
            <li key={r.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold text-navy">{r.full_name} {!r.onboarding_completed && <Badge tone="amber">onboarding not complete</Badge>}</p>
              {mine.length === 0 ? <p className="text-xs text-navy/50">No markets (cannot claim).</p> : (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {mine.map((g) => (
                    <li key={g.market_id} className="flex items-center gap-2 rounded-full bg-lavender px-3 py-1 text-xs">
                      {marketName(g.market_id)} · cap {g.claim_cap}
                      <button className="font-bold text-red-600" aria-label={`Remove ${marketName(g.market_id)}`} onClick={() => { if (window.confirm("Remove this market from the rep? Companies they already own stay with them.")) void run("/api/acquisition/rep-markets", "DELETE", { employeeId: r.id, marketId: g.market_id }); }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); void run("/api/acquisition/rep-markets", "POST", { employeeId: f.employeeId, marketId: f.marketId, claimCap: Number(f.claimCap) }); }}>
        <div><label className={labelCls}>Rep</label><select className={inputCls} required value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}><option value="">Choose…</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
        <div><label className={labelCls}>Market</label><select className={inputCls} required value={f.marketId} onChange={(e) => setF({ ...f, marketId: e.target.value })}><option value="">Choose…</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><label className={labelCls}>Claim cap</label><input className={inputCls} type="number" min={0} max={1000} value={f.claimCap} onChange={(e) => setF({ ...f, claimCap: e.target.value })} /></div>
        <div className="flex items-end"><button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Grant / update"}</button></div>
        <div className="sm:col-span-4"><Feedback result={result} /></div>
      </form>
    </div>
  );
}

export function RulesCard({ reps, markets, rules }: { reps: Rep[]; markets: Market[]; rules: Rule[] }) {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ employeeId: "", marketId: "", country: "", minFitScore: "", priority: "100" });
  const repName = (id: string) => reps.find((r) => r.id === id)?.full_name ?? "Former rep";
  const marketName = (id: string | null) => (id ? markets.find((m) => m.id === id)?.name ?? "Unknown" : null);
  return (
    <div>
      <p className="mb-3 text-sm text-navy/70">After research scores a new, unowned company, the first matching enabled rule (lowest priority number) assigns it. Rules never move companies that already have an owner.</p>
      {rules.length === 0 ? <p className="mb-4 text-sm text-navy/50">No rules yet.</p> : (
        <ul className="mb-4 space-y-2 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
              <span>
                <Badge tone={r.enabled ? "green" : "slate"}>{r.enabled ? "on" : "off"}</Badge>{" "}
                #{r.priority}: {[marketName(r.market_id), r.country && `country ${r.country}`, r.min_fit_score !== null && `fit ≥ ${r.min_fit_score}`].filter(Boolean).join(" · ")} → <strong>{repName(r.employee_id)}</strong>
              </span>
              <span className="flex gap-2">
                <ActionButton url={`/api/acquisition/assignment-rules/${r.id}`} method="PATCH" body={{ enabled: !r.enabled }} variant="ghost">{r.enabled ? "Turn off" : "Turn on"}</ActionButton>
                <ActionButton url={`/api/acquisition/assignment-rules/${r.id}`} method="PATCH" body={{ delete: true }} variant="danger" confirm="Delete this rule?">Delete</ActionButton>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-3 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault(); void run("/api/acquisition/assignment-rules", "POST", { employeeId: f.employeeId, marketId: f.marketId || null, country: f.country || null, minFitScore: f.minFitScore === "" ? null : Number(f.minFitScore), priority: Number(f.priority) }); }}>
        <div><label className={labelCls}>Assign to</label><select className={inputCls} required value={f.employeeId} onChange={(e) => setF({ ...f, employeeId: e.target.value })}><option value="">Choose…</option>{reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
        <div><label className={labelCls}>Market (optional)</label><select className={inputCls} value={f.marketId} onChange={(e) => setF({ ...f, marketId: e.target.value })}><option value="">Any</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><label className={labelCls}>Country (optional)</label><input className={inputCls} maxLength={2} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="GB" /></div>
        <div><label className={labelCls}>Min fit score</label><input className={inputCls} type="number" min={0} max={100} value={f.minFitScore} onChange={(e) => setF({ ...f, minFitScore: e.target.value })} /></div>
        <div><label className={labelCls}>Priority</label><input className={inputCls} type="number" min={0} max={1000} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} /></div>
        <div className="sm:col-span-5"><button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Add rule"}</button><Feedback result={result} /></div>
      </form>
    </div>
  );
}
