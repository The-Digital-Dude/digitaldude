"use client";

import { useMemo, useState } from "react";
import { Card, btnCls, btnGhostCls, inputCls, labelCls } from "@/components/acquisition/ui";
import { Feedback, api, type ApiResult } from "@/components/acquisition/client";
import { LandingView, type ProofCard } from "./LandingView";
import { sectionFor, type LandingContent, type LandingSection, type ProofItem } from "@/lib/landing";
import { INDUSTRY_NAMES } from "@/lib/industryTemplates";

type StudyOption = { slug: string; title: string; summary: string; stat: string | null };

const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);

/** Admin editor for the booking page: one scope at a time (the default, or one industry), with a live preview of the real page. */
export function LandingEditor({ initial, studies }: { initial: LandingContent; studies: StudyOption[] }) {
  const [content, setContent] = useState<LandingContent>(initial);
  const [scope, setScope] = useState<string>("default");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<ApiResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const effective: LandingSection = useMemo(() => (scope === "default" ? content.default : sectionFor(content, scope)), [content, scope]);
  const overridden = scope !== "default" && !!content.industries[scope];

  function update<K extends keyof LandingSection>(key: K, value: LandingSection[K]) {
    setContent((c) =>
      scope === "default"
        ? { ...c, default: { ...c.default, [key]: value } }
        : { ...c, industries: { ...c.industries, [scope]: { ...c.industries[scope], [key]: value } } }
    );
  }

  async function save() {
    setBusy(true);
    setSaved(null);
    // Each industry override is saved in full so the page never depends on a half-filled one.
    const industries: LandingContent["industries"] = {};
    for (const [name] of Object.entries(content.industries)) industries[name] = sectionFor(content, name);
    const r = await api("/api/acquisition/landing", "PUT", { default: content.default, industries });
    setBusy(false);
    setSaved(r);
  }
  function resetIndustry() {
    if (!window.confirm(`Go back to the built-in text for ${scope}?`)) return;
    setContent((c) => {
      const next = { ...c.industries };
      delete next[scope];
      return { ...c, industries: next };
    });
  }
  async function resetAll() {
    if (!window.confirm("Reset ALL booking page text to the built-in version?")) return;
    setBusy(true);
    const r = await api("/api/acquisition/landing", "DELETE");
    if (r.ok) {
      const g = await api("/api/acquisition/landing", "GET");
      if (g.ok) setContent(g.content as LandingContent);
    }
    setBusy(false);
    setSaved(r);
  }
  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const j = await (await fetch("/api/admin/upload", { method: "POST", body: fd })).json();
      if (j.ok && j.url) update("imageUrl", String(j.url));
      else setSaved({ ok: false, error: j.error ?? "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  const proofItems = effective.proof;
  const setProof = (next: ProofItem[]) => update("proof", next.slice(0, 6));
  const previewProof: ProofCard[] = proofItems.map((p) => {
    if (p.type === "custom") return { title: p.title || "(untitled)", metric: p.metric || undefined, detail: p.detail || undefined };
    const s = studies.find((x) => x.slug === p.slug);
    return { title: s?.title ?? p.slug, metric: s?.stat ?? undefined, detail: s?.summary };
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card title="What are you editing?">
          <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="default">Default (used when an industry has no text of its own)</option>
            {INDUSTRY_NAMES.map((n) => <option key={n} value={n}>{n}{content.industries[n] ? " · customised" : ""}</option>)}
          </select>
          <p className="mt-2 text-xs text-navy/55">{scope === "default" ? "Changes here apply to every industry that has not been customised." : overridden ? `Showing ${scope} text. Leave a field empty to use the default for it.` : `${scope} uses the built-in text. Edit a field to customise it.`}</p>
          {overridden && <button className={`${btnGhostCls} mt-3`} onClick={resetIndustry}>Use built-in text for {scope}</button>}
        </Card>

        <Card title="Headline and intro">
          <p className="mb-3 text-xs text-navy/55">You can use <code>{"{{first_name}}"}</code>, <code>{"{{company}}"}</code> and <code>{"{{rep_name}}"}</code>: they are filled in for each visitor.</p>
          <label className={labelCls}>Headline</label>
          <textarea className={inputCls} rows={2} maxLength={160} value={effective.headline} onChange={(e) => update("headline", e.target.value)} />
          <label className={`${labelCls} mt-3`}>Sub-headline</label>
          <textarea className={inputCls} rows={3} maxLength={300} value={effective.subheadline} onChange={(e) => update("subheadline", e.target.value)} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>Button text</label><input className={inputCls} maxLength={40} value={effective.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} /></div>
            <div><label className={labelCls}>Booking form title</label><input className={inputCls} maxLength={80} value={effective.formTitle} onChange={(e) => update("formTitle", e.target.value)} /></div>
          </div>
        </Card>

        <Card title="Pain points and what we build">
          <label className={labelCls}>Section title</label>
          <input className={inputCls} maxLength={80} value={effective.painTitle} onChange={(e) => update("painTitle", e.target.value)} />
          <label className={`${labelCls} mt-3`}>One per line (up to 6)</label>
          <textarea className={inputCls} rows={5} value={effective.painPoints.join("\n")} onChange={(e) => update("painPoints", lines(e.target.value))} />
          <label className={`${labelCls} mt-4`}>What-we-build title</label>
          <input className={inputCls} maxLength={80} value={effective.buildTitle} onChange={(e) => update("buildTitle", e.target.value)} />
          <label className={`${labelCls} mt-3`}>One per line (up to 6)</label>
          <textarea className={inputCls} rows={5} value={effective.builds.join("\n")} onChange={(e) => update("builds", lines(e.target.value))} />
          <p className="mt-2 text-xs text-navy/50">Describe what you do for businesses like theirs. Do not state facts about a specific visitor&apos;s company.</p>
        </Card>

        <Card title="Proof (only what you approve)">
          <label className={labelCls}>Section title</label>
          <input className={inputCls} maxLength={80} value={effective.proofTitle} onChange={(e) => update("proofTitle", e.target.value)} />
          <div className="mt-3 space-y-3">
            {proofItems.map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                {p.type === "case_study" ? (
                  <select className={inputCls} value={p.slug} onChange={(e) => setProof(proofItems.map((x, j) => (j === i ? { type: "case_study", slug: e.target.value } : x)))}>
                    {studies.map((s) => <option key={s.slug} value={s.slug}>Case study: {s.title}</option>)}
                  </select>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Title" maxLength={100} value={p.title} onChange={(e) => setProof(proofItems.map((x, j) => (j === i && x.type === "custom" ? { ...x, title: e.target.value } : x)))} />
                    <input className={inputCls} placeholder="Number (optional), e.g. 3x" maxLength={40} value={p.metric ?? ""} onChange={(e) => setProof(proofItems.map((x, j) => (j === i && x.type === "custom" ? { ...x, metric: e.target.value } : x)))} />
                    <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Detail: only a real, approved result" maxLength={300} value={p.detail ?? ""} onChange={(e) => setProof(proofItems.map((x, j) => (j === i && x.type === "custom" ? { ...x, detail: e.target.value } : x)))} />
                  </div>
                )}
                <button className={`${btnGhostCls} mt-2`} onClick={() => setProof(proofItems.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {studies.length > 0 && <button className={btnGhostCls} disabled={proofItems.length >= 6} onClick={() => setProof([...proofItems, { type: "case_study", slug: studies[0].slug }])}>Add a case study</button>}
            <button className={btnGhostCls} disabled={proofItems.length >= 6} onClick={() => setProof([...proofItems, { type: "custom", title: "", metric: "", detail: "" }])}>Add a result</button>
          </div>
          <p className="mt-2 text-xs text-navy/50">The proof section only shows when you add something. Nothing is made up or added automatically.</p>
        </Card>

        <Card title="Look">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>Accent colour</label>
              <div className="flex items-center gap-2"><input type="color" value={/^#[0-9a-f]{6}$/i.test(effective.accent) ? effective.accent : "#7b61ff"} onChange={(e) => update("accent", e.target.value)} className="h-9 w-12 rounded border border-slate-300 bg-white p-0.5" aria-label="Accent colour" /><input className={inputCls} maxLength={7} value={effective.accent} onChange={(e) => update("accent", e.target.value)} /></div></div>
            <div><label className={labelCls}>Hero image (https)</label>
              <div className="flex gap-2"><input className={inputCls} value={effective.imageUrl} placeholder="https://…" onChange={(e) => update("imageUrl", e.target.value)} />
                <label className={`${btnGhostCls} cursor-pointer whitespace-nowrap`}>{uploading ? "…" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); e.target.value = ""; }} /></label></div></div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <button className={btnCls} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save booking page"}</button>
          <button className={btnGhostCls} disabled={busy} onClick={() => void resetAll()}>Reset everything</button>
          {saved?.ok && <span className="text-sm font-medium text-emerald-700">Saved. New visitors see it straight away.</span>}
          <Feedback result={saved && !saved.ok ? saved : null} />
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-bold uppercase text-navy/50">Live preview ({scope === "default" ? "default" : scope}) as visitor &ldquo;Dan at Plum Property&rdquo; from rep &ldquo;Farhad&rdquo;</p>
        <div className="max-h-[85vh] overflow-auto rounded-2xl border border-slate-200 [zoom:0.6]">
          <LandingView
            section={effective}
            person={{ firstName: "Dan", company: "Plum Property", repName: "Farhad" }}
            rep={{ name: "Farhad", role: "Founder", photoUrl: null }}
            proof={previewProof}
            form={<div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-slate-400">The booking form appears here</div>}
          />
        </div>
      </div>
    </div>
  );
}
