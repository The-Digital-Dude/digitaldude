"use client";

import { useState } from "react";
import { crm } from "./shared";
import { parseCsvText, detectColumnMapping, IMPORT_FIELDS, INTEL_FIELDS } from "@/lib/crm/csv";

interface Row { line: number; email?: string; outcome: "add" | "skip" | "invalid"; reason?: string; warning?: string }
interface Result { committed: boolean; summary: { total: number; willAdd: number; skipped: number; invalid: number; added: number; max: number }; rows: Row[]; unmappedColumns: string[] }

const btn = "rounded-lg bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition";
const btnGhost = "rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50 transition";

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Contact Name",
  first_name: "First Name",
  last_name: "Last Name",
  email: "Work Email (Required)",
  company_name: "Company Name",
  job_title: "Job / Decision Maker Title",
  phone: "Phone Number",
  country: "Country Code (2-letter)",
  tags: "Tags (comma-separated)",
  estimated_deal_value: "Estimated Deal Size ($)",
  lead_source: "Lead Source",
  notes: "General Notes",
  stage: "Pipeline Stage",
  website: "Company Website",
  linkedin_url: "LinkedIn Profile URL",
  tech_stack: "Tech Stack (Known)",
  pain_points: "Pain Points / Triggers",
  solution: "Proposed Solution / Pitch",
  city: "City / Metro",
  industry: "Industry",
  sub_industry: "Sub-Industry",
  qc_by: "QC / Researcher",
  fit_score: "Fit Score (0-100)",
  priority: "Priority (High/Med/Low)",
};

/** Add many leads from a CSV with interactive column mapping: check first, then confirm. */
export function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRow, setSampleRow] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    setResult(null);
    setError(null);
    if (!file) return;
    if (file.size > 600_000) return setError("That file is too large. Import up to 300 leads at a time.");
    setFileName(file.name);
    const rawText = await file.text();
    setCsv(rawText);

    try {
      const rows = parseCsvText(rawText);
      if (rows.length >= 1) {
        const fileHeaders = rows[0] || [];
        setHeaders(fileHeaders);
        setSampleRow(rows[1] || []);
        const detected = detectColumnMapping(fileHeaders);
        setMapping(detected);
        setShowMapping(true);
      }
    } catch {
      // Fallback if client-side parse fails
    }
  }

  function handleMapChange(header: string, targetField: string) {
    setMapping((prev) => ({ ...prev, [header]: targetField }));
    setResult(null); // Reset preview when mapping changes
  }

  async function run(commit: boolean) {
    setBusy(true);
    setError(null);
    const r = await crm<Result>("/api/rep/leads/import", "POST", { csv, commit, mapping });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "The import failed");
    setResult(r as Result);
    if (commit) onDone();
  }

  const issues = result?.rows.filter((r) => r.outcome !== "add" || r.warning) ?? [];
  const mappedCount = Object.values(mapping).filter((v) => v && v !== "ignore").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Import leads">
      <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0F1626] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white">Import leads from a CSV</h2>
            <p className="text-xs text-slate-400">Map your CSV columns, preview duplicate and bounce checks, then import up to 300 leads.</p>
          </div>
          <button className={btnGhost} onClick={onClose}>Close</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(e) => void pick(e.target.files?.[0])} className="text-xs text-slate-300" aria-label="Choose a CSV file" />
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
          <a className="text-xs text-purple-300 hover:underline" href="/api/rep/leads/export?template=1">Download a template</a>
        </div>

        {/* INTERACTIVE COLUMN MAPPING CARD */}
        {headers.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  Column Mapping
                </span>
                <p className="text-[11px] text-slate-400">
                  {mappedCount} of {headers.length} columns mapped. You can review or reassign any field below:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapping((s) => !s)}
                className="text-[11px] font-bold text-purple-300 hover:text-purple-200"
              >
                {showMapping ? "Hide Mapper ▲" : "Customize Mapping ▼"}
              </button>
            </div>

            {showMapping && (
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-white/[0.06] bg-black/30 p-2.5">
                {headers.map((h, idx) => {
                  const currentTarget = mapping[h] || "ignore";
                  const sampleVal = sampleRow[idx] ? `e.g. "${sampleRow[idx].slice(0, 30)}"` : "empty sample";
                  return (
                    <div key={h} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-200 block truncate">{h}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{sampleVal}</span>
                      </div>
                      <div className="sm:w-60 shrink-0">
                        <select
                          value={currentTarget}
                          onChange={(e) => handleMapChange(h, e.target.value)}
                          className={`w-full rounded-lg border px-2 py-1 text-xs outline-none transition font-medium ${
                            currentTarget === "ignore"
                              ? "border-white/10 bg-white/5 text-slate-400"
                              : "border-purple-500/40 bg-purple-950/40 text-purple-200 font-bold"
                          }`}
                        >
                          <option value="ignore">✕ Ignore (Skip column)</option>
                          <optgroup label="Standard CRM Fields">
                            <option value="full_name">Full Contact Name</option>
                            <option value="first_name">First Name</option>
                            <option value="last_name">Last Name</option>
                            <option value="email">Work Email</option>
                            <option value="company_name">Company Name</option>
                            <option value="job_title">Job / Decision Maker Title</option>
                            <option value="phone">Phone Number</option>
                            <option value="country">Country Code (2-letter)</option>
                            <option value="tags">Tags</option>
                            <option value="estimated_deal_value">Estimated Deal Size ($)</option>
                            <option value="lead_source">Lead Source</option>
                            <option value="stage">Pipeline Stage</option>
                            <option value="notes">General Notes</option>
                          </optgroup>
                          <optgroup label="Research &amp; Intelligence">
                            <option value="tech_stack">Tech Stack</option>
                            <option value="pain_points">Pain Points / Triggers</option>
                            <option value="solution">Proposed Pitch / Solution</option>
                            <option value="website">Company Website</option>
                            <option value="linkedin_url">LinkedIn URL</option>
                            <option value="city">City / Metro</option>
                            <option value="industry">Industry</option>
                            <option value="sub_industry">Sub-Industry</option>
                            <option value="qc_by">QC Researcher</option>
                            <option value="fit_score">Fit Score (0-100)</option>
                            <option value="priority">Priority</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {fileName && !result && (
          <button className={btn} disabled={busy || !csv} onClick={() => run(false)}>
            {busy ? "Checking columns & verifying…" : `Check & Validate ${fileName}`}
          </button>
        )}
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
                <button className={btnGhost} onClick={() => { setResult(null); setCsv(""); setFileName(""); setHeaders([]); setMapping({}); }}>Choose a different file</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
