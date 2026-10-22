"use client";

import { useEffect, useRef, useState } from "react";
import { Card, btnCls, btnGhostCls, inputCls, labelCls } from "./ui";
import { Feedback, api, type ApiResult } from "./client";
import { DESIGNS, DESIGN_LABELS, type Brand, type DesignId } from "@/lib/emailDesign";
import { INDUSTRY_NAMES } from "@/lib/industryTemplates";

const FONT_OPTIONS: { value: Brand["font"]; label: string }[] = [
  { value: "system", label: "System (modern, default)" },
  { value: "arial", label: "Arial" },
  { value: "georgia", label: "Georgia (serif)" },
  { value: "verdana", label: "Verdana" },
  { value: "trebuchet", label: "Trebuchet" },
];

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5" aria-label={label} />
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} />
      </div>
    </div>
  );
}

/** Admin "Look and feel" editor for outreach emails, with a live preview of the chosen design. */
export function DesignEditor({ initial }: { initial: Brand }) {
  const [brand, setBrand] = useState<Brand>(initial);
  const [design, setDesign] = useState<DesignId>("minimal");
  const [industry, setIndustry] = useState<string>("Property management");
  const [html, setHtml] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<ApiResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const tick = useRef(0);

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand((b) => ({ ...b, [k]: v }));

  // Live preview: debounce, and ignore answers that arrive out of order.
  useEffect(() => {
    const mine = ++tick.current;
    const t = setTimeout(async () => {
      const r = await api("/api/acquisition/design/preview", "POST", { brand, design, industry });
      if (mine !== tick.current) return;
      if (r.ok) {
        setHtml(String(r.html));
        setPreviewError(null);
      } else setPreviewError(r.error ?? "Check the highlighted values (colours must be like #7b61ff, the logo must be an https link).");
    }, 350);
    return () => clearTimeout(t);
  }, [brand, design, industry]);

  async function save() {
    setBusy(true);
    setSaved(null);
    const r = await api("/api/acquisition/design", "PUT", brand);
    setBusy(false);
    setSaved(r);
  }
  async function reset() {
    if (!window.confirm("Reset the email look and feel to the defaults?")) return;
    setBusy(true);
    const r = await api("/api/acquisition/design", "DELETE");
    if (r.ok) {
      const g = await api("/api/acquisition/design", "GET");
      if (g.ok) setBrand(g.brand as Brand);
    }
    setBusy(false);
    setSaved(r);
  }
  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (j.ok && j.url) set("logoUrl", String(j.url));
      else setSaved({ ok: false, error: j.error ?? "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  const themed = brand.industryLines;
  const setTheme = (name: string, patch: { accent?: string; line?: string }) =>
    set("industryLines", { ...themed, [name]: { ...themed[name], ...patch, line: patch.line ?? themed[name]?.line ?? "" } });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card title="Colours">
          <div className="grid gap-4 sm:grid-cols-2">
            <Color label="Accent" value={brand.accent} onChange={(v) => set("accent", v)} />
            <Color label="Header background" value={brand.headerBg} onChange={(v) => set("headerBg", v)} />
            <Color label="Button" value={brand.buttonBg} onChange={(v) => set("buttonBg", v)} />
            <Color label="Button text" value={brand.buttonText} onChange={(v) => set("buttonText", v)} />
            <Color label="Body text" value={brand.textColor} onChange={(v) => set("textColor", v)} />
          </div>
        </Card>

        <Card title="Button">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Button text</label><input className={inputCls} value={brand.buttonLabel} maxLength={40} onChange={(e) => set("buttonLabel", e.target.value)} /></div>
            <div><label className={labelCls}>Shape</label>
              <select className={inputCls} value={brand.buttonShape} onChange={(e) => set("buttonShape", e.target.value as Brand["buttonShape"])}>
                <option value="square">Square</option><option value="rounded">Rounded</option><option value="pill">Pill</option>
              </select></div>
          </div>
        </Card>

        <Card title="Text, logo and footer">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Font (email-safe only)</label>
              <select className={inputCls} value={brand.font} onChange={(e) => set("font", e.target.value as Brand["font"])}>{FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
            <div><label className={labelCls}>Text size: {brand.fontSize}px</label><input type="range" min={13} max={18} value={brand.fontSize} onChange={(e) => set("fontSize", Number(e.target.value))} className="w-full" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Logo (https address, used in the card designs)</label>
              <div className="flex gap-2"><input className={inputCls} value={brand.logoUrl} placeholder="https://…/logo.png" onChange={(e) => set("logoUrl", e.target.value)} />
                <label className={`${btnGhostCls} cursor-pointer whitespace-nowrap`}>{uploading ? "Uploading…" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); e.target.value = ""; }} /></label></div></div>
            <div><label className={labelCls}>Header text (when there is no logo)</label><input className={inputCls} value={brand.headerText} maxLength={60} placeholder="The Digital Dude" onChange={(e) => set("headerText", e.target.value)} /></div>
            <div><label className={labelCls}>Extra footer note</label><input className={inputCls} value={brand.footerNote} maxLength={200} onChange={(e) => set("footerNote", e.target.value)} /></div>
          </div>
          <p className="mt-3 text-xs text-navy/50">The sender identity (business name, postal address) and the unsubscribe link are added to every design automatically and cannot be removed.</p>
        </Card>

        <Card title="Industry themes (industry-themed card)">
          <div className="space-y-3">
            {INDUSTRY_NAMES.map((name) => (
              <div key={name} className="grid items-end gap-2 sm:grid-cols-[10rem_8rem_1fr]">
                <p className="text-sm font-semibold text-navy">{name}</p>
                <div><label className={labelCls}>Accent</label><input className={inputCls} value={themed[name]?.accent ?? ""} placeholder="#0f766e" maxLength={7} onChange={(e) => setTheme(name, { accent: e.target.value || undefined })} /></div>
                <div><label className={labelCls}>Short line</label><input className={inputCls} value={themed[name]?.line ?? ""} placeholder="Built for property teams" maxLength={120} onChange={(e) => setTheme(name, { line: e.target.value })} /></div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <button className={btnCls} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save look and feel"}</button>
          <button className={btnGhostCls} disabled={busy} onClick={() => void reset()}>Reset to defaults</button>
          {saved?.ok && <span className="text-sm font-medium text-emerald-700">Saved. New emails use it straight away.</span>}
          <Feedback result={saved && !saved.ok ? saved : null} />
        </div>
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <Card title="Live preview">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {DESIGNS.map((d) => (
              <button key={d} onClick={() => setDesign(d)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${design === d ? "bg-navy text-white" : "bg-slate-100 text-navy/70 hover:bg-slate-200"}`} title={DESIGN_LABELS[d].hint}>{DESIGN_LABELS[d].name}</button>
            ))}
          </div>
          {design === "industry_card" && (
            <select className={`${inputCls} mb-3 max-w-xs`} value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Preview industry">
              {INDUSTRY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <p className="mb-2 text-xs text-navy/60">{DESIGN_LABELS[design].hint}</p>
          {previewError && <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-800" role="alert">{previewError}</p>}
          <iframe title="Email preview" sandbox="" srcDoc={html} className="h-[640px] w-full rounded-xl border border-slate-200 bg-white" />
        </Card>
      </div>
    </div>
  );
}
