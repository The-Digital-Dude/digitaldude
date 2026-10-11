"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Globe,
  SearchCheck,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Gauge,
  Key,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface Props {
  initialInspectUrl?: string | null;
  onCloseInspect?: () => void;
}

export function IndexingHub({ initialInspectUrl, onCloseInspect }: Props) {
  const [googleQuota, setGoogleQuota] = useState<{
    limit: number;
    used: number;
    remaining: number;
    hasAuth: boolean;
  }>({ limit: 200, used: 0, remaining: 200, hasAuth: false });

  const [loadingQuota, setLoadingQuota] = useState(false);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [submittingIndexNow, setSubmittingIndexNow] = useState(false);

  const [googleResult, setGoogleResult] = useState<{
    ok: boolean;
    submitted?: number;
    failed?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const [indexNowResult, setIndexNowResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Inspection tool
  const [inspectUrl, setInspectUrl] = useState(initialInspectUrl || `${SITE_URL}/`);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);

  // Custom batch URLs input
  const [customUrls, setCustomUrls] = useState("");

  useEffect(() => {
    fetchQuota();
    if (initialInspectUrl) {
      setInspectUrl(initialInspectUrl);
      handleInspect(initialInspectUrl);
    }
  }, [initialInspectUrl]);

  async function fetchQuota() {
    setLoadingQuota(true);
    try {
      const res = await fetch("/api/admin/seo/google");
      const data = await res.json();
      if (data.ok && data.quota) {
        setGoogleQuota(data.quota);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuota(false);
    }
  }

  async function handleSubmitGoogle(useCustom: boolean = false) {
    setSubmittingGoogle(true);
    setGoogleResult(null);

    try {
      const payload: { urls?: string[] } = {};
      if (useCustom && customUrls.trim()) {
        payload.urls = customUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/admin/seo/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setGoogleResult(data);
      fetchQuota();
    } catch (err: any) {
      setGoogleResult({ ok: false, error: err.message || "Submission failed" });
    } finally {
      setSubmittingGoogle(false);
    }
  }

  async function handleSubmitIndexNow(useCustom: boolean = false) {
    setSubmittingIndexNow(true);
    setIndexNowResult(null);

    try {
      const payload: { urls?: string[] } = {};
      if (useCustom && customUrls.trim()) {
        payload.urls = customUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/admin/pseo/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIndexNowResult(data);
    } catch (err: any) {
      setIndexNowResult({ ok: false, error: err.message || "IndexNow broadcast failed" });
    } finally {
      setSubmittingIndexNow(false);
    }
  }

  async function handleInspect(targetUrlToInspect?: string) {
    const url = (targetUrlToInspect || inspectUrl).trim();
    if (!url) return;

    setInspecting(true);
    setInspectionResult(null);

    try {
      const res = await fetch("/api/admin/seo/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setInspectionResult(data);
    } catch (err: any) {
      setInspectionResult({ ok: false, error: err.message || "Inspection request failed" });
    } finally {
      setInspecting(false);
    }
  }

  const quotaPercent = Math.round((googleQuota.used / googleQuota.limit) * 100);

  return (
    <div className="space-y-6">
      {/* Top Quota and Engine Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Google Indexing API Quota */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple/10 text-purple font-bold">
                <Gauge className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-navy">Google Indexing API Quota</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      googleQuota.hasAuth ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-[10px] text-slate-500">
                    {googleQuota.hasAuth ? "Service Account Connected" : "Service Account Pending"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchQuota}
              className="rounded-lg p-1.5 text-slate-400 hover:text-purple transition"
              title="Refresh quota"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingQuota ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <span className="text-2xl font-extrabold text-navy">
              {googleQuota.remaining}{" "}
              <span className="text-xs font-medium text-slate-400">/ {googleQuota.limit} left</span>
            </span>
            <span className="text-xs font-bold text-purple">{googleQuota.used} used today</span>
          </div>

          {/* Meter bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-purple transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">Quota resets automatically every 24 hours (UTC).</div>
        </div>

        {/* IndexNow Engine Card */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-navy">IndexNow Multi-Engine Broadcast</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500">Bing, Yandex, Seznam, Naver</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            Instantly notify participating search engines whenever pages are published or updated, bypassing traditional crawl delays.
          </p>

          <button
            onClick={() => handleSubmitIndexNow(false)}
            disabled={submittingIndexNow}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-600 transition disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {submittingIndexNow ? "Broadcasting..." : "Broadcast Entire Sitemap to IndexNow"}
          </button>
        </div>

        {/* 1-Click Google Batch Submission */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple/10 text-purple font-bold">
              <Send className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-navy">Google Sitemap Ingestion</h4>
              <p className="text-[10px] text-slate-500">Direct Googlebot crawl prioritization</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            Batch-submits XML sitemap URLs directly to Google's real-time indexing endpoint up to your daily remaining quota.
          </p>

          <button
            onClick={() => handleSubmitGoogle(false)}
            disabled={submittingGoogle || !googleQuota.hasAuth || googleQuota.remaining <= 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {submittingGoogle ? "Submitting to Google..." : "Submit Sitemap to Google API"}
          </button>
        </div>
      </div>

      {/* Results Banners */}
      {googleResult && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold ${
            googleResult.ok
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {googleResult.ok
            ? `Google Indexing Success: Submitted ${googleResult.submitted} pages (Failed: ${googleResult.failed})!`
            : `Google Indexing Notice: ${googleResult.error || "Submission encountered an error"}`}
        </div>
      )}

      {indexNowResult && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold ${
            indexNowResult.ok
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {indexNowResult.ok
            ? `IndexNow Broadcast Success: ${indexNowResult.message}`
            : `IndexNow Notice: ${indexNowResult.error || "Broadcast error"}`}
        </div>
      )}

      {/* URL Inspector & Custom Submission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live URL Inspector (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-navy flex items-center gap-2">
              <SearchCheck className="h-4 w-4 text-purple" />
              Live Google Search Console URL Inspector
            </h4>
            <p className="text-xs text-slate-500">
              Inspect any URL on digitaldude.co.uk to retrieve live Google indexing verdicts and crawl data.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://www.digitaldude.co.uk/locations/birmingham/crm-development"
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
            />
            <button
              onClick={() => handleInspect()}
              disabled={inspecting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
            >
              <SearchCheck className="h-4 w-4" />
              {inspecting ? "Inspecting..." : "Inspect"}
            </button>
          </div>

          {/* Inspection Verdict Display */}
          {inspectionResult && (
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
                  Google Index Status
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    inspectionResult.ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inspectionResult.ok ? "Queried Successfully" : "Inspection Notice"}
                </span>
              </div>

              {inspectionResult.ok && inspectionResult.inspectionResult ? (
                <div className="space-y-2 text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white p-3 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Coverage Verdict</div>
                      <div className="font-bold text-navy mt-1">
                        {inspectionResult.inspectionResult.indexStatusResult?.verdict || "NEUTRAL"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Last Crawl Date</div>
                      <div className="font-bold text-navy mt-1">
                        {inspectionResult.inspectionResult.indexStatusResult?.lastCrawlTime
                          ? new Date(
                              inspectionResult.inspectionResult.indexStatusResult.lastCrawlTime
                            ).toLocaleDateString()
                          : "Pending Crawl"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Crawled As</div>
                    <div className="font-mono text-[11px] text-slate-800">
                      {inspectionResult.inspectionResult.indexStatusResult?.crawledAs ||
                        "Googlebot Mobile (Smartphone)"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">User Canonical</div>
                    <div className="font-mono text-[11px] text-slate-800 truncate">
                      {inspectionResult.inspectionResult.indexStatusResult?.userCanonical || inspectUrl}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600">
                  {inspectionResult.error ||
                    "URL Inspection returned status. Verify Search Console property permission for service account."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom URLs Bulk Ingest (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-navy flex items-center gap-2">
              <Send className="h-4 w-4 text-purple" />
              Targeted URL Submission
            </h4>
            <p className="text-xs text-slate-500">Submit a specific list of updated URLs (one per line).</p>
          </div>

          <textarea
            rows={5}
            placeholder={`https://www.digitaldude.co.uk/blog/off-the-shelf-crm-vs-custom-crm\nhttps://www.digitaldude.co.uk/locations/birmingham/crm-development\nhttps://www.digitaldude.co.uk/solutions/logistics/crm-development`}
            value={customUrls}
            onChange={(e) => setCustomUrls(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              onClick={() => handleSubmitGoogle(true)}
              disabled={submittingGoogle || !customUrls.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple/90 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Submit to Google
            </button>
            <button
              onClick={() => handleSubmitIndexNow(true)}
              disabled={submittingIndexNow || !customUrls.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-600 transition disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              Ping IndexNow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
