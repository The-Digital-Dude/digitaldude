"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Empty, btnCls, btnGhostCls, fmtDate, inputCls, labelCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";
import type { AutomationState, RunResult, TopicState } from "@/lib/blog/automation";

interface Loaded {
  state: AutomationState;
  ai: { configured: boolean; model: string | null };
  nextRun: { due: boolean; reason: string };
}

const tone = (s: string) => (s === "published" ? "green" : s === "failed" ? "red" : s === "skipped" ? "slate" : "purple");

export function BlogAutomation() {
  const [data, setData] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<ApiResult | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ slug: "", title: "", keyword: "", category: "Custom Software", author: "Farhad Hossain", angle: "" });

  const load = useCallback(async () => {
    const r = await api("/api/acquisition/blog", "GET");
    if (r.ok) setData({ state: r.state as AutomationState, ai: r.ai as Loaded["ai"], nextRun: r.nextRun as Loaded["nextRun"] });
    else setMsg(r);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(patch: Partial<Pick<AutomationState, "enabled" | "paused" | "weekdaysOnly" | "hourUtc">>) {
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-navy/50"><th className="py-1">#</th><th>Topic</th><th>Author</th><th>Status</th><th /></tr></thead>
              <tbody>
                {state.topics.map((t: TopicState, i: number) => (
                  <tr key={t.slug} className="border-t border-slate-100 align-top">
                    <td className="py-2 pr-2 text-navy/40">{i + 1}</td>
                    <td className="py-2 pr-3"><div className="font-semibold text-navy">{t.title}</div><div className="text-xs text-navy/50">{t.keyword}</div>{t.lastError && <div className="mt-1 text-xs text-red-700">{t.lastError.slice(0, 220)}</div>}</td>
                    <td className="py-2 pr-3 text-xs">{t.author}</td>
                    <td className="py-2 pr-3"><Badge tone={tone(t.status)}>{t.status}</Badge>{t.attempts > 0 && t.status !== "published" && <div className="text-xs text-navy/40">{t.attempts} attempt{t.attempts === 1 ? "" : "s"}</div>}{t.publishedAt && <div className="text-xs text-navy/40">{fmtDate(t.publishedAt)}</div>}</td>
                    <td className="py-2 text-right">
                      {t.status === "queued" && <><button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("up", t.slug)}>↑</button><button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("down", t.slug)}>↓</button><button className="px-1 text-xs font-semibold text-red-600 hover:underline" onClick={() => void topic("skip", t.slug)}>Skip</button></>}
                      {(t.status === "failed" || t.status === "skipped") && <button className="px-1 text-xs font-semibold text-purple hover:underline" onClick={() => void topic("requeue", t.slug)}>Requeue</button>}
                      {t.status === "published" && <a className="px-1 text-xs font-semibold text-purple hover:underline" href={`/blog/${t.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent activity">
        {state.log.length === 0 ? <Empty>Nothing yet.</Empty> : (
          <ul className="space-y-1.5 text-sm">
            {[...state.log].reverse().slice(0, 25).map((l, i) => (
              <li key={`${l.at}-${i}`} className="flex flex-wrap gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-xs text-navy/40">{fmtDate(l.at)}</span><Badge tone={l.result === "published" ? "green" : "red"}>{l.result}</Badge><span className="font-semibold text-navy">{l.slug}</span><span className="text-navy/60">{l.detail.slice(0, 200)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
