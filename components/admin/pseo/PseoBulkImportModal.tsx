"use client";

import { useState } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  FileCode,
  ArrowRight,
  Layers
} from "lucide-react";

interface PseoBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type ImportType = "locations" | "solutions" | "comparisons" | "custom_csv";

export function PseoBulkImportModal({
  isOpen,
  onClose,
  onImported,
}: PseoBulkImportModalProps) {
  const [importType, setImportType] = useState<ImportType>("locations");
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number } | null>(null);

  if (!isOpen) return null;

  // Generate Sample CSVs
  function downloadSampleCsv(type: ImportType) {
    let content = "";
    let filename = "";

    if (type === "locations") {
      filename = "pseo_locations_sample.csv";
      content = `city,region,country,country_code,currency,service_slug,title,meta_description,hero_headline
Newcastle,Tyne and Wear,United Kingdom,UK,GBP,crm-development,Custom CRM Development in Newcastle | The Digital Dude,Custom CRM development in Newcastle and the North East with zero per-seat fees.,Custom CRM Development for Newcastle Enterprises
Sheffield,South Yorkshire,United Kingdom,UK,GBP,saas-development,SaaS Product Development in Sheffield | The Digital Dude,Multi-tenant SaaS engineering for Sheffield scaleups.,Bespoke SaaS Development for Sheffield Brands
Gold Coast,Queensland,Australia,AU,AUD,marketplace-development,Marketplace Platform Development Gold Coast | The Digital Dude,Two-sided service and booking marketplace development in Gold Coast.,Custom Marketplace Development in Gold Coast`;
    } else if (type === "solutions") {
      filename = "pseo_solutions_sample.csv";
      content = `industry_slug,industry_name,service_slug,title,meta_description,hero_headline,featured_case_study
automotive,Automotive & Dealerships,crm-development,Automotive Dealership CRM Software | The Digital Dude,Custom dealership CRM with vehicle inventory sync and test drive booking.,Custom CRM Engineered for Automotive Dealerships,property-compliance-crm
healthcare,Private Healthcare & Clinics,erp-hrm-systems,Clinic Management & Patient Scheduling Portal | The Digital Dude,HIPAA and GDPR compliant patient scheduling and clinic management ERP.,Bespoke Clinic Operations Portals for Healthcare Providers,logistics-platform`;
    } else if (type === "comparisons") {
      filename = "pseo_comparisons_sample.csv";
      content = `slug,competitor_name,category,title,meta_description,hero_headline
custom-crm-vs-zoho,Zoho CRM,CRM,Custom Software vs Zoho CRM | The Digital Dude,Compare bespoke operational software vs Zoho CRM. Eliminate complexity and license fees.,Custom CRM vs Zoho CRM: Full Comparison
custom-portal-vs-sharepoint,Microsoft SharePoint,Operations,Custom Portal vs Microsoft SharePoint | The Digital Dude,Compare custom web portal vs SharePoint intranet. Faster UX and zero Microsoft 365 licensing.,Custom Client Portal vs Microsoft SharePoint`;
    }

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleParseInput() {
    setParsingError(null);
    setParsedRows([]);

    if (!rawText.trim()) {
      setParsingError("Please paste CSV data or JSON array.");
      return;
    }

    // Attempt JSON parse first
    if (rawText.trim().startsWith("[") && rawText.trim().endsWith("]")) {
      try {
        const json = JSON.parse(rawText);
        if (Array.isArray(json)) {
          setParsedRows(json);
          return;
        }
      } catch (e: any) {
        setParsingError(`Invalid JSON format: ${e.message}`);
        return;
      }
    }

    // CSV Parse
    try {
      const lines = rawText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setParsingError("CSV must contain a header row and at least one data row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Basic CSV regex to handle commas inside quotes
        const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
        const cleanValues = match.map((v) => v.trim().replace(/^["']|["']$/g, ""));

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cleanValues[idx] || "";
        });

        // Derive slug if not present
        if (!rowObj.slug) {
          if (rowObj.city && rowObj.service_slug) {
            rowObj.slug = `locations/${rowObj.city.toLowerCase().replace(/\s+/g, "-")}/${rowObj.service_slug}`;
            rowObj.category = "location";
          } else if (rowObj.industry_slug && rowObj.service_slug) {
            rowObj.slug = `solutions/${rowObj.industry_slug}/${rowObj.service_slug}`;
            rowObj.category = "solution";
          } else {
            rowObj.slug = `custom/${(rowObj.title || `page-${i}`).toLowerCase().replace(/[^\w-]/g, "-")}`;
            rowObj.category = "custom";
          }
        }

        rows.push(rowObj);
      }

      if (rows.length === 0) {
        setParsingError("No valid rows could be parsed.");
        return;
      }

      setParsedRows(rows);
    } catch (err: any) {
      setParsingError(`Failed to parse CSV: ${err.message}`);
    }
  }

  async function handleExecuteBulkImport() {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setParsingError(null);

    try {
      const res = await fetch("/api/admin/pseo/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Bulk import failed");
      }

      setImportResult({ count: data.count || parsedRows.length });
      onImported();
    } catch (err: any) {
      setParsingError(err.message || "Failed to process bulk import.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">
                Bulk Upload Programmatic SEO Pages
              </h3>
              <p className="text-xs text-slate-500">
                Upload CSV or JSON to generate 10–500+ localized or vertical landing pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importResult ? (
            <div className="rounded-2xl bg-emerald-50 p-8 text-center space-y-4 border border-emerald-200">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-bold text-emerald-950">
                Bulk Import Successful!
              </h4>
              <p className="text-sm text-emerald-800 max-w-md mx-auto">
                Successfully processed and upserted{" "}
                <strong>{importResult.count} programmatic pages</strong> into the database. They are now live on your sitemap and discovery feeds.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setRawText("");
                    setParsedRows([]);
                  }}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                >
                  Import Another Batch
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Close & View Pages
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Template selection */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 1: Choose Template / Format
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["locations", "solutions", "comparisons"] as ImportType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImportType(t)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition border ${
                        importType === t
                          ? "bg-navy text-white border-navy"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t} Batch
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => downloadSampleCsv(importType)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-accent-primary hover:bg-slate-50 transition ml-auto"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Sample CSV ({importType})
                  </button>
                </div>
              </div>

              {/* Step 2: Paste Raw CSV or JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Step 2: Paste CSV Data or JSON Array</span>
                  <span className="font-normal text-slate-400">Comma-separated with headers</span>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`city,region,country,country_code,currency,service_slug,title,meta_description,hero_headline\nNewcastle,Tyne and Wear,United Kingdom,UK,GBP,crm-development,Custom CRM Development in Newcastle,Bespoke CRM software for Newcastle firms,Custom CRM Development in Newcastle`}
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseInput}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Parse & Validate Records
                  </button>
                </div>
              </div>

              {/* Error Callout */}
              {parsingError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{parsingError}</span>
                </div>
              )}

              {/* Step 3: Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Step 3: Preview ({parsedRows.length} Valid Records Ready)</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5 font-bold text-navy">Slug / URL</th>
                          <th className="p-2.5 font-bold text-navy">Title</th>
                          <th className="p-2.5 font-bold text-navy">Category</th>
                          <th className="p-2.5 font-bold text-navy">Headline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono text-[11px] text-accent-primary">{r.slug}</td>
                            <td className="p-2.5 font-medium text-slate-800 max-w-[200px] truncate">{r.title}</td>
                            <td className="p-2.5 capitalize text-slate-600">{r.category || importType}</td>
                            <td className="p-2.5 text-slate-600 max-w-[200px] truncate">{r.hero_headline || r.heroHeadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || parsedRows.length === 0}
              onClick={handleExecuteBulkImport}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-accent-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Upserting {parsedRows.length} Pages...
                </>
              ) : (
                <>
                  Upload & Publish {parsedRows.length} Pages
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
