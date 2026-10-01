"use client";

import { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type { MappingTarget } from "@/lib/leadImport";

interface JobOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface ImportCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const TARGET_LABELS: Record<MappingTarget, string> = {
  applicant_name: "Applicant Name",
  applicant_email: "Email",
  applicant_phone: "Phone",
  created_at: "Applied Date",
  screening: "Screening Question",
  metadata: "Metadata",
  ignore: "Ignore",
};

const TARGET_OPTIONS: MappingTarget[] = [
  "applicant_name",
  "applicant_email",
  "applicant_phone",
  "created_at",
  "screening",
  "metadata",
  "ignore",
];

type Step = "upload" | "map" | "result";

interface ImportResult {
  summary: { created: number; duplicate: number; error: number };
  results: Array<{ row: number; status: "created" | "duplicate" | "error"; error?: string }>;
}

export function ImportCandidatesModal({ isOpen, onClose, onImported }: ImportCandidatesModalProps) {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobPostingId, setJobPostingId] = useState("");
  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, MappingTarget>>({});

  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const list = data.jobs || [];
          setJobs(list);
          if (list.length > 0 && !jobPostingId) {
            setJobPostingId(list[0].id);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen]);

  function resetAndClose() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setErrorMessage("");
    onClose();
  }

  async function handleFileSelected(file: File) {
    setErrorMessage("");
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/applications/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Could not parse this file.");
      }
      setHeaders(data.headers);
      setRows(data.rows);
      setMapping(data.suggestedMapping);
      setStep("map");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not parse this file.");
    } finally {
      setParsing(false);
    }
  }

  async function handleCommit() {
    setCommitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/applications/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", jobPostingId, headers, mapping, rows }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Import failed.");
      }
      setResult({ summary: data.summary, results: data.results });
      setStep("result");
      onImported();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setCommitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4.5 sm:px-8 bg-white shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-purple/10 px-2.5 py-1 text-xs font-bold text-purple">
              <FileSpreadsheet size={13} />
              <span>Lead Import</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-navy mt-1">Import Candidates from CSV/Excel</h2>
            <p className="text-xs text-navy/60">
              Import leads collected from Facebook Ads or any other CSV/Excel export.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-full p-2 text-navy/40 hover:bg-slate-100 hover:text-navy transition shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-5">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
              {errorMessage}
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                  Target Job Posting <span className="text-red-500">*</span>
                </label>
                <select
                  value={jobPostingId}
                  onChange={(e) => setJobPostingId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.status})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-navy/50 mt-1">
                  Every candidate in this file will be attached to this job posting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                  <Upload size={13} /> CSV or Facebook Lead Ads Excel Export
                </label>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  disabled={!jobPostingId || parsing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-purple/10 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-purple hover:file:bg-purple/20 disabled:opacity-50"
                />
                {parsing && (
                  <p className="text-[11px] text-navy/60 mt-1.5 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Parsing file…
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "map" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-navy/70">
                <strong className="text-navy">{rows.length}</strong> candidate rows found. Confirm how each
                column should be mapped before importing.
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-navy/60">
                    <tr>
                      <th className="py-2.5 px-3">Column</th>
                      <th className="py-2.5 px-3">Maps To</th>
                      <th className="py-2.5 px-3">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {headers.map((header, idx) => (
                      <tr key={header}>
                        <td className="py-2 px-3 font-semibold text-navy">{header}</td>
                        <td className="py-2 px-3">
                          <select
                            value={mapping[header] || "ignore"}
                            onChange={(e) =>
                              setMapping((prev) => ({ ...prev, [header]: e.target.value as MappingTarget }))
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-navy outline-none focus:border-purple"
                          >
                            {TARGET_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {TARGET_LABELS[opt]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-navy/60 truncate max-w-[200px]">
                          {rows[0]?.[idx] || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!headers.some((h) => mapping[h] === "applicant_name") ||
              !headers.some((h) => mapping[h] === "applicant_email") ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 font-semibold flex items-center gap-2">
                  <AlertCircle size={14} /> Map at least one column to Applicant Name and one to Email before
                  importing.
                </div>
              ) : null}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-2">
                  Preview (first {Math.min(3, rows.length)} rows)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 font-bold text-navy/60">
                      <tr>
                        {headers
                          .filter((h) => mapping[h] !== "ignore")
                          .map((h) => (
                            <th key={h} className="py-2 px-2.5 whitespace-nowrap">
                              {TARGET_LABELS[mapping[h] || "ignore"]}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.slice(0, 3).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {headers
                            .filter((h) => mapping[h] !== "ignore")
                            .map((h) => (
                              <td key={h} className="py-2 px-2.5 text-navy/70 max-w-[160px] truncate">
                                {row[headers.indexOf(h)] || "—"}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <strong className="font-bold block text-sm">Import complete</strong>
                  {result.summary.created} created, {result.summary.duplicate} skipped as duplicates,{" "}
                  {result.summary.error} errors.
                </div>
              </div>

              {result.results.some((r) => r.status === "error") && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-1.5">
                  <strong className="text-xs font-bold text-red-900">Row errors</strong>
                  {result.results
                    .filter((r) => r.status === "error")
                    .map((r) => (
                      <p key={r.row} className="text-[11px] text-red-700">
                        Row {r.row}: {r.error}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 sm:px-8 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs shrink-0">
          <div>
            {step === "map" && (
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy/70 hover:bg-slate-100 transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy/70 hover:bg-slate-100 transition"
            >
              {step === "result" ? "Close" : "Cancel"}
            </button>
            {step === "map" && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={
                  committing ||
                  !headers.some((h) => mapping[h] === "applicant_name") ||
                  !headers.some((h) => mapping[h] === "applicant_email")
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
              >
                {committing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {committing ? "Importing…" : `Import ${rows.length} Candidates`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
