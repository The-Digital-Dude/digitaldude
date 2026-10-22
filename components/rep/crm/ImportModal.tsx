"use client";

import { useState } from "react";
import { crm } from "./shared";

interface Row { line: number; email?: string; outcome: "add" | "skip" | "invalid"; reason?: string; warning?: string }
interface Result { committed: boolean; summary: { total: number; willAdd: number; skipped: number; invalid: number; added: number; max: number }; rows: Row[]; unmappedColumns: string[] }

const btn = "rounded-lg bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition";
const btnGhost = "rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50 transition";

/** Add many leads from a CSV: check first (nothing is saved), then confirm. */
export function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    setResult(null);
    setError(null);
    if (!file) return;
    if (file.size > 600_000) return setError("That file is too large. Import up to 300 leads at a time.");
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function run(commit: boolean) {
    setBusy(true);
    setError(null);
    const r = await crm<Result>("/api/rep/leads/import", "POST", { csv, commit });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "The import failed");
    setResult(r as Result);
    if (commit) onDone();
  }

  const issues = result?.rows.filter((r) => r.outcome !== "add" || r.warning) ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Import leads">
      <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0F1626] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Import leads from a CSV</h2>
            <p className="text-xs text-slate-400">Columns: Name (or First/Last name), Email, then optionally Phone, Company, Job title, Country, Tags, Source, Deal value, Notes. Up to 300 leads.</p>
          </div>
          <button className={btnGhost} onClick={onClose}>Close</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(e) => void pick(e.target.files?.[0])} className="text-xs text-slate-300" aria-label="Choose a CSV file" />
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
          <a className="text-xs text-purple-300 hover:underline" href="/api/rep/leads/export?template=1">Download a template</a>
        </div>
        {fileName && !result && <button className={btn} disabled={busy || !csv} onClick={() => run(false)}>{busy ? "Checking…" : `Check ${fileName}`}</button>}
        {error && <p className="rounded-lg bg-rose-500/10 p-2 text-xs font-semibold text-rose-300" role="alert">{error}</p>}

        {result && (
          <div className="space-y-3">
            <p className="text-sm text-white">
              {result.committed
                ? <>Added <b>{result.summary.added}</b> lead{result.summary.added === 1 ? "" : "s"}. </>
                : <><b>{result.summary.willAdd}</b> of {result.summary.total} will be added. </>}
              {result.summary.skipped + result.summary.invalid > 0 && <span className="text-slate-400">{result.summary.skipped + result.summary.invalid} skipped (below).</span>}
            </p>
            {result.unmappedColumns.length > 0 && <p className="text-[11px] text-slate-500">Ignored columns: {result.unmappedColumns.join(", ")}</p>}
            {issues.length > 0 && (
              <ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-white/[0.06] p-2 text-xs">
                {issues.map((r) => (
                  <li key={r.line} className={r.outcome === "add" ? "text-amber-300" : "text-slate-300"}>
                    <span className="text-slate-500">Row {r.line}</span> {r.email ?? ""} — {r.reason ?? r.warning}
                  </li>
                ))}
              </ul>
            )}
            {!result.committed && result.summary.willAdd > 0 && (
              <div className="flex gap-2">
                <button className={btn} disabled={busy} onClick={() => run(true)}>{busy ? "Importing and checking addresses…" : `Import ${result.summary.willAdd} lead${result.summary.willAdd === 1 ? "" : "s"}`}</button>
                <button className={btnGhost} onClick={() => { setResult(null); setCsv(""); setFileName(""); }}>Choose a different file</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
