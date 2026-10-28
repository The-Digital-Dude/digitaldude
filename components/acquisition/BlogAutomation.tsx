"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Empty, btnCls, btnGhostCls, fmtDate, inputCls, labelCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";
import { Pagination } from "@/components/admin/Pagination";
import type { AutomationState, RunResult, TopicState } from "@/lib/blog/automation";
import type { InsightsReport } from "@/lib/blog/insights";

interface Loaded {
  state: AutomationState;
  ai: { configured: boolean; model: string | null };
  nextRun: { due: boolean; reason: string };
}

const tone = (s: string) => (s === "published" ? "green" : s === "failed" ? "red" : s === "skipped" ? "slate" : s === "draft" ? "amber" : "purple");

export function BlogAutomation() {
  const [data, setData] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<ApiResult | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", keyword: "", category: "Custom Software", author: "Farhad Hossain", angle: "" });

  const [report, setReport] = useState<InsightsReport | null>(null);
  const [qStatus, setQStatus] = useState("all");
  const [qSearch, setQSearch] = useState("");
  const [qPage, setQPage] = useState(1);
  const [qSize, setQSize] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logSize, setLogSize] = useState(10);

  const loadReport = useCallback(async () => {
    const r = await api("/api/acquisition/blog/insights", "GET");
    if (r.ok) setReport((r.report as InsightsReport | null) ?? null);
  }, []);

  const load = useCallback(async () => {
    const r = await api("/api/acquisition/blog", "GET");
    if (r.ok) setData({ state: r.state as AutomationState, ai: r.ai as Loaded["ai"], nextRun: r.nextRun as Loaded["nextRun"] });
    else setMsg(r);
  }, []);
  useEffect(() => { void load(); void loadReport(); }, [load, loadReport]);

  async function runWeekly() {
    setBusy("insights");
    const r = await api("/api/acquisition/blog/insights", "POST");
    setBusy(null);
    setMsg(r.ok ? null : r);
    if (r.ok) setReport(r.report as InsightsReport);
    void load();
  }

  async function save(patch: Partial<Pick<AutomationState, "enabled" | "paused" | "weekdaysOnly" | "hourUtc" | "autopilot">>) {
    setBusy("save");
    const r = await api("/api/acquisition/blog", "PUT", patch);
    setBusy(null);
    setMsg(r);
    if (r.ok) void load();
  }

  async function run(mode: "preview" | "publish") {
    if (mode === "publish" && !window.confirm("Write and publish the next post right now? It goes live on the site immediately.")) return;
    setBusy(mode);
    setResult(null);
    const r = await api("/api/acquisition/blog/run", "POST", { mode });
    setBusy(null);
    setMsg(r.ok ? null : r);
    if (r.result) setResult(r.result as RunResult);
    void load();
  }

  async function saveAsDraft() {
    if (!result?.post || !result.slug) return;
    setBusy("draft");
    const r = await api("/api/acquisition/blog/draft", "POST", { slug: result.slug, post: result.post, problems: result.problems ?? [] });
    setBusy(null);
    setMsg(r);
    if (r.ok) {
      setResult(null);
      void load();
    }
  }

  async function topic(action: "skip" | "requeue" | "up" | "down", slug: string) {
    const r = await api("/api/acquisition/blog/topics", "POST", { action, slug });
    setMsg(r.ok ? null : r);
    if (r.ok) void load();
  }

  async function addTopic() {
    const r = await api("/api/acquisition/blog/topics", "POST", { action: "add", ...form, angle: form.angle.split("\n").map((l) => l.trim()).filter(Boolean) });
    setMsg(r);
    if (r.ok) {
      setShowAdd(false);
      setForm({ slug: "", title: "", keyword: "", category: "Custom Software", author: "Farhad Hossain", angle: "" });
      void load();
    }
  }

  if (!data) return <p className="text-sm text-navy/50">{msg?.error ?? "Loading…"}</p>;
  const { state, ai, nextRun } = data;

  const needle = qSearch.trim().toLowerCase();
  const counts = state.topics.reduce<Record<string, number>>((m, t) => ({ ...m, [t.status]: (m[t.status] ?? 0) + 1 }), {});
  // Keep each topic's real position in the queue so the # column stays meaningful when filtered.
  const visible = state.topics
    .map((t, position) => ({ t, position }))
    .filter(({ t }) => (qStatus === "all" || t.status === qStatus) && (!needle || `${t.title} ${t.keyword} ${t.slug}`.toLowerCase().includes(needle)));
  const qPages = Math.max(1, Math.ceil(visible.length / qSize));
  const qCurrent = Math.min(qPage, qPages);
  const pageRows = visible.slice((qCurrent - 1) * qSize, qCurrent * qSize);
  const logAll = [...state.log].reverse();
  const logPages = Math.max(1, Math.ceil(logAll.length / logSize));
  const logCurrent = Math.min(logPage, logPages);
  const logRows = logAll.slice((logCurrent - 1) * logSize, logCurrent * logSize);
  const queued = state.topics.filter((t) => t.status === "queued").length;
  const published = state.topics.filter((t) => t.status === "published").length;

  return (
    <div className="space-y-6">
      <Card title="Status">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={state.enabled && !state.paused ? "green" : "amber"}>{!state.enabled ? "Switched off" : state.paused ? "Paused" : "Running"}</Badge>
          <Badge tone={ai.configured ? "green" : "red"}>{ai.configured ? `AI ready (${ai.model})` : "AI not configured"}</Badge>
          <span className="text-sm text-navy/60">{published} published · {queued} queued · {nextRun.due ? "a post is due now" : `next: ${nextRun.reason}`}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" checked={state.enabled} disabled={busy === "save"} onChange={(e) => void save({ enabled: e.target.checked })} /> Automation on</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" checked={state.paused} disabled={busy === "save"} onChange={(e) => void save({ paused: e.target.checked })} /> Pause</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-navy"><input type="checkbox" checked={state.weekdaysOnly} disabled={busy === "save"} onChange={(e) => void save({ weekdaysOnly: e.target.checked })} /> Weekdays only</label>
          <div><label className={labelCls}>Earliest hour (UTC)</label><select className={inputCls} value={state.hourUtc} onChange={(e) => void save({ hourUtc: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></div>
        </div>
        <p className="mt-3 text-xs text-navy/50">When on, one post is written and published each weekday after that hour. Every post must pass an automatic quality check (length, structure, FAQ, internal links, no invented figures or claims) or it is not published and is retried.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btnGhostCls} disabled={!!busy || !ai.configured} onClick={() => run("preview")}>{busy === "preview" ? "Writing (up to a minute)…" : "Preview next post (not published)"}</button>
          <button className={btnCls} disabled={!!busy || !ai.configured} onClick={() => run("publish")}>{busy === "publish" ? "Publishing…" : "Publish next post now"}</button>
        </div>
        <Feedback result={msg} />
      </Card>

      {result && (
        <Card title={`Result: ${result.status}${result.slug ? ` · ${result.slug}` : ""}`}>
          <p className="text-sm text-navy/70">{result.detail}</p>
          {result.problems && result.problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>
          )}
          {result.post && result.status !== "published" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className={btnCls} disabled={!!busy} onClick={saveAsDraft}>{busy === "draft" ? "Saving…" : "Save as draft to fix later"}</button>
              <span className="text-xs text-navy/50">Keeps this text and the problems listed above. Fix it in the blog editor, publish it there, and the queue marks the topic done.</span>
            </div>
          )}
          {result.post && (
            <div className="mt-4 space-y-2">
              <p className="text-sm"><span className="font-semibold">Title:</span> {result.post.title}</p>
              <p className="text-sm"><span className="font-semibold">Meta title:</span> {result.post.metaTitle} <span className="text-navy/40">({result.post.metaTitle.length})</span></p>
              <p className="text-sm"><span className="font-semibold">Meta description:</span> {result.post.metaDescription} <span className="text-navy/40">({result.post.metaDescription.length})</span></p>
              <p className="text-sm"><span className="font-semibold">Words:</span> {result.words}</p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-navy/80">{result.post.content}</pre>
            </div>
          )}
        </Card>
      )}

      {state.pausedReason && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p className="font-semibold">Publishing was paused by the safety brake</p>
          <p className="mt-1">{state.pausedReason}</p>
          <p className="mt-1 text-xs">Review the posts under the weekly report. Untick “Pause” above to resume.</p>
        </div>
      )}

      <Card title="Autopilot (runs every Monday)" action={<button className={btnGhostCls} disabled={!!busy} onClick={runWeekly}>{busy === "insights" ? "Checking (up to a minute)…" : "Run the weekly check now"}</button>}>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-start gap-2 text-sm font-semibold text-navy"><input type="checkbox" className="mt-1" checked={state.autopilot.discover} disabled={busy === "save"} onChange={(e) => void save({ autopilot: { ...state.autopilot, discover: e.target.checked } })} /><span>Find new topics automatically<span className="block text-xs font-normal text-navy/50">From Search Console and search suggestions; added to the queue.</span></span></label>
          <label className="flex items-start gap-2 text-sm font-semibold text-navy"><input type="checkbox" className="mt-1" checked={state.autopilot.brake} disabled={busy === "save"} onChange={(e) => void save({ autopilot: { ...state.autopilot, brake: e.target.checked } })} /><span>Safety brake<span className="block text-xs font-normal text-navy/50">Pause publishing if Google is not indexing the posts.</span></span></label>
          <div><label className={labelCls}>Most new topics per week</label><select className={inputCls} value={state.autopilot.maxNewPerWeek} onChange={(e) => void save({ autopilot: { ...state.autopilot, maxNewPerWeek: Number(e.target.value) } })}>{[0, 3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        <p className="mt-3 text-xs text-navy/50">Each week it reads Search Console, finds phrases people already search for that you do not cover, writes briefs for the best ones, checks how Google is indexing your posts, and asks Google to re-read the sitemap when it is out of date. {state.lastInsightsAt ? `Last run: ${fmtDate(state.lastInsightsAt)}.` : "It has not run yet."}</p>
      </Card>

      {report && <InsightsView report={report} />}

      <Card title="Topic queue" action={<button className={btnGhostCls} onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Close" : "Add a topic"}</button>}>
        {showAdd && (
          <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
            <div><label className={labelCls}>Web address (lower-case words and hyphens)</label><input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><label className={labelCls}>Working title</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className={labelCls}>Target search phrase</label><input className={inputCls} value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} /></div>
            <div><label className={labelCls}>Category</label><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className={labelCls}>Author</label><select className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}><option>Farhad Hossain</option><option>Tanvir Ahmed Shuvo</option></select></div>
            <div className="md:col-span-2"><label className={labelCls}>What it must cover (one point per line, at least two)</label><textarea className={inputCls} rows={4} value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} /></div>
            <div className="md:col-span-2"><button className={btnCls} onClick={addTopic}>Add to the end of the queue</button></div>
          </div>
        )}
        {state.topics.length === 0 ? <Empty>No topics.</Empty> : (
          <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(["all", "queued", "draft", "published", "failed", "skipped"] as const).map((k) => (
              <button key={k} type="button" onClick={() => { setQStatus(k); setQPage(1); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${qStatus === k ? "border-purple bg-purple text-white" : "border-slate-200 bg-white text-navy/70 hover:bg-slate-50"}`}>{k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)} <span className="opacity-70">{k === "all" ? state.topics.length : counts[k] ?? 0}</span></button>
            ))}
            <input className={`${inputCls} ml-auto max-w-xs`} placeholder="Search title, phrase or address" value={qSearch} onChange={(e) => { setQSearch(e.target.value); setQPage(1); }} />
          </div>
          {visible.length === 0 ? <Empty>No topics match.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">#</th><th>Topic</th><th>Author</th><th>Status</th><th /></tr></thead>
              <tbody>
                {pageRows.map(({ t, position }: { t: TopicState; position: number }) => (
                  <tr key={t.slug} className="border-t border-slate-100 align-top">
                    <td className="py-2 pr-2 text-navy/40">{position + 1}</td>
                    <td className="py-2 pr-3"><div className="font-semibold text-navy">{t.title}</div><div className="text-xs text-navy/50">{t.keyword}{t.source && t.source !== "built-in" && t.source !== "manual" ? ` · ${t.source === "search-console" ? "from Search Console" : "from search suggestions"}` : ""}</div>{t.evidence && <div className="text-xs text-navy/40">{t.evidence}</div>}{t.status === "draft" && t.lastProblems && t.lastProblems.length > 0 ? (<ul className="mt-1 list-disc pl-4 text-xs text-red-700">{t.lastProblems.slice(0, 6).map((p) => <li key={p}>{p.slice(0, 200)}</li>)}</ul>) : t.lastError ? <div className="mt-1 text-xs text-red-700">{t.lastError.slice(0, 220)}</div> : null}</td>
                    <td className="py-2 pr-3 text-xs">{t.author}</td>
                    <td className="py-2 pr-3"><Badge tone={tone(t.status)}>{t.status}</Badge>{t.attempts > 0 && t.status !== "published" && <div className="text-xs text-navy/40">{t.attempts} attempt{t.attempts === 1 ? "" : "s"}</div>}{t.publishedAt && <div className="text-xs text-navy/40">{fmtDate(t.publishedAt)}</div>}</td>
                    <td className="py-2 text-right">
                      {t.status === "queued" && <><button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("up", t.slug)}>↑</button><button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("down", t.slug)}>↓</button><button className="px-1 text-xs font-semibold text-red-600 hover:underline" onClick={() => void topic("skip", t.slug)}>Skip</button></>}
                      {t.status === "draft" && t.draftId && <a className="px-1 text-xs font-semibold text-purple hover:underline" href={`/admin/blogs/${t.draftId}/edit`}>Open draft</a>}
                      {(t.status === "failed" || t.status === "skipped" || t.status === "draft") && <button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("requeue", t.slug)}>{t.status === "draft" ? "Rewrite" : "Requeue"}</button>}
                      {t.status === "published" && <a className="px-1 text-xs font-semibold text-purple hover:underline" href={`/blog/${t.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <Pagination page={qCurrent} pageSize={qSize} totalCount={visible.length} pageSizeOptions={[10, 25, 50]} onPageChange={setQPage} onPageSizeChange={(n) => { setQSize(n); setQPage(1); }} />
          </>
        )}
      </Card>

      <Card title="Recent activity">
        {state.log.length === 0 ? <Empty>Nothing yet.</Empty> : (
          <ul className="space-y-1.5 text-sm">
            {logRows.map((l, i) => (
              <li key={`${l.at}-${i}`} className="flex flex-wrap gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-xs text-navy/40">{fmtDate(l.at)}</span><Badge tone={l.result === "published" ? "green" : l.result === "info" ? "slate" : "red"}>{l.result}</Badge><span className="font-semibold text-navy">{l.slug}</span><span className="text-navy/60">{l.detail.slice(0, 200)}</span>
              </li>
            ))}
          </ul>
        )}
        {logAll.length > 0 && <Pagination page={logCurrent} pageSize={logSize} totalCount={logAll.length} pageSizeOptions={[10, 25, 50]} onPageChange={setLogPage} onPageSizeChange={(n) => { setLogSize(n); setLogPage(1); }} />}
      </Card>
    </div>
  );
}


const delta = (cur: number, prev: number) => {
  if (!prev) return cur ? "new" : "–";
  const d = Math.round(((cur - prev) / prev) * 100);
  return `${d > 0 ? "+" : ""}${d}%`;
};

function InsightsView({ report }: { report: InsightsReport }) {
  const t = report.totals;
  return (
    <Card title={`Weekly report · ${fmtDate(report.at)}`}>
      {report.warnings.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 rounded-lg bg-amber-50 p-3 pl-7 text-sm text-amber-900">{report.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
      )}
      {t ? (
        <div className="grid gap-3 md:grid-cols-3">
          {([["Clicks", t.current.clicks, t.previous.clicks], ["Impressions", t.current.impressions, t.previous.impressions]] as const).map(([label, cur, prev]) => (
            <div key={label} className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase text-navy/50">{label} (28 days)</div><div className="text-xl font-extrabold text-navy">{cur.toLocaleString()}</div><div className="text-xs text-navy/50">{delta(cur, prev)} vs the 28 days before</div></div>
          ))}
          <div className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-semibold uppercase text-navy/50">Average position</div><div className="text-xl font-extrabold text-navy">{t.current.position ? t.current.position.toFixed(1) : "–"}</div><div className="text-xs text-navy/50">before: {t.previous.position ? t.previous.position.toFixed(1) : "–"} (lower is better)</div></div>
        </div>
      ) : <p className="text-sm text-navy/60">No search data this week ({report.gsc === "not_connected" ? "Search Console is not connected" : "it could not be read"}).</p>}

      <h3 className="mb-2 mt-5 text-sm font-bold text-navy">Are the automated posts being indexed?</h3>
      {report.posts.length === 0 ? <Empty>No automated posts are old enough to check yet (they are checked two days after publishing).</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">Post</th><th>Age</th><th>Google says</th><th>Last crawled</th></tr></thead><tbody>
          {report.posts.map((p) => (
            <tr key={p.slug} className="border-t border-slate-100"><td className="py-1.5 pr-3"><a className="font-semibold text-purple hover:underline" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">{p.title}</a></td><td className="pr-3 text-xs">{p.ageDays}d</td><td className="pr-3"><Badge tone={p.indexed ? "green" : "amber"}>{p.coverage}</Badge></td><td className="text-xs text-navy/50">{p.lastCrawl ? p.lastCrawl.slice(0, 10) : "never"}</td></tr>
          ))}
        </tbody></table></div>
      )}
      <p className="mt-2 text-xs text-navy/50">{report.brake.indexedShare === null ? `Safety brake: needs at least 6 posts older than 21 days (has ${report.brake.sample}).` : `Safety brake: ${Math.round(report.brake.indexedShare * 100)}% of ${report.brake.sample} posts over 21 days old are indexed.`} {report.sitemapResubmitted ? "The sitemap was resubmitted to Google." : ""}</p>

      <h3 className="mb-2 mt-5 text-sm font-bold text-navy">Topics added this week</h3>
      {report.discovery.added.length === 0 ? <p className="text-sm text-navy/60">{report.discovery.note ?? "None."}</p> : (
        <ul className="space-y-1 text-sm">{report.discovery.added.map((a) => <li key={a.slug}><span className="font-semibold text-navy">{a.title}</span> <span className="text-xs text-navy/50">· {a.evidence}</span></li>)}</ul>
      )}

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div><h3 className="mb-2 text-sm font-bold text-navy">Top search queries</h3><ul className="space-y-1 text-xs">{report.topQueries.slice(0, 10).map((q) => <li key={q.key} className="flex justify-between gap-2"><span className="truncate">{q.key}</span><span className="text-navy/50">{q.impressions} impr · pos {q.position.toFixed(0)}</span></li>)}</ul></div>
        <div><h3 className="mb-2 text-sm font-bold text-navy">Top pages</h3><ul className="space-y-1 text-xs">{report.topPages.slice(0, 10).map((q) => <li key={q.key} className="flex justify-between gap-2"><span className="truncate">{q.key}</span><span className="text-navy/50">{q.impressions} impr · {q.clicks} clicks</span></li>)}</ul></div>
      </div>
    </Card>
  );
}
