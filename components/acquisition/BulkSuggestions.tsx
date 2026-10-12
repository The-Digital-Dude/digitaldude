"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, btnCls, btnGhostCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";

export interface SuggestionRow {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  source_url: string;
  evidence_excerpt: string;
  origin: string;
  confidence: number | null;
  company_id: string;
  company_name: string;
  owner_name: string | null;
}

/** Pending suggested addresses across every company, with bulk accept / dismiss. Accepted ones still need a lawful basis. */
export function BulkSuggestions({ rows }: { rows: SuggestionRow[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function run(action: "accept" | "dismiss") {
    const ids = [...picked];
    if (!ids.length) return;
    if (!window.confirm(action === "accept" ? `Add ${ids.length} address(es) as contacts? They still need a lawful basis before anyone can email them.` : `Dismiss ${ids.length} suggestion(s)?`)) return;
    setBusy(true);
    setResult(null);
    const r = await api("/api/acquisition/suggestions/bulk", "POST", { ids, action });
    setBusy(false);
    setResult(r);
    if (r.ok) {
      setNote(`${r.accepted as number} accepted, ${r.dismissed as number} dismissed${(r.skipped as number) > 0 ? `, ${r.skipped as number} skipped` : ""}.`);
      setPicked(new Set());
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-navy/80">
          <input type="checkbox" checked={picked.size === rows.length && rows.length > 0} onChange={(e) => setPicked(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} />
          {picked.size > 0 ? `${picked.size} selected` : "Select all"}
        </label>
        {picked.size > 0 && (
          <>
            <button className={btnCls} disabled={busy} onClick={() => void run("accept")}>{busy ? "Working…" : "Accept as contacts"}</button>
            <button className={btnGhostCls} disabled={busy} onClick={() => void run("dismiss")}>Dismiss</button>
          </>
        )}
        {note && <span className="text-sm font-medium text-emerald-700">{note}</span>}
      </div>
      <Feedback result={result && !result.ok ? result : null} />
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-3">
            <input type="checkbox" className="mt-1" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.email}`} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-navy">
                {r.email} <Badge tone={r.origin === "hunter" ? "purple" : "slate"}>{r.origin === "hunter" ? "Hunter" : "website"}</Badge>
                {r.confidence !== null && <span className="ml-2 text-xs text-navy/50">confidence {r.confidence}%</span>}
              </p>
              <p className="text-navy/60">
                <Link className="text-purple underline" href={`/admin/acquisition/companies/${r.company_id}`}>{r.company_name}</Link>
                {r.owner_name ? ` · owned by ${r.owner_name}` : " · unassigned"}
                {r.role && ` · ${r.role}`}
              </p>
              <p className="mt-1 text-xs text-navy/50">“{r.evidence_excerpt}” <a className="text-purple underline" href={r.source_url} target="_blank" rel="noopener noreferrer">source</a></p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
