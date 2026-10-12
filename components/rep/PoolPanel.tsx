"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Search, ShieldCheck, Sparkles, Undo2 } from "lucide-react";
import { btn, btnGhost, call, card, input, Msg, type BasisDraft } from "./poolShared";
import { NeedsBasisPanel } from "./NeedsBasis";

interface Summary { held: number; cap: number; markets: { id: string; name: string; country: string; claimCap: number }[] }
interface Company {
  id: string; name: string; domain: string | null; website: string | null; country: string | null; region: string | null; industry: string | null;
  pool_status: string; fit_score: number | null; contact_count: number; linkedin_url: string | null; possible_duplicate_of: string | null; acq_markets: { name: string } | null;
}
interface Detail {
  company: { id: string; name: string; domain: string | null; country: string | null; industry: string | null; summary: string | null; potential_opportunity: string | null; decision_maker_role: string | null; fit_score: number | null; pool_status: string; linkedin_url: string | null };
  research: { id: string; observed_fact: string; evidence_excerpt: string; source_url: string }[];
  contacts: { id: string; name: string | null; role: string | null; email: string; status: string }[];
  suggestions: { id: string; email: string; source_url: string; evidence_excerpt: string }[];
  notes: { id: string; author: string; note: string; created_at: string }[];
  countryRule: { email_allowed: boolean; requires_postal_address: boolean; notes: string; name: string } | null;
  helpLinks: { label: string; url: string }[];
  finderEnabled: boolean;
}

const STATUSES = ["assigned", "needs_contact", "contacted", "replied", "meeting", "won", "lost", "dead"];
const label = (s: string) => s.replace(/_/g, " ");
/** "Lead pool" tab: claim companies from your markets, find and record contacts, then email through the normal tools. */
export function RepPoolPanel() {
  const [view, setView] = useState<"mine" | "available" | "basis">("mine");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ error?: string; note?: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call(`/api/rep/pool?view=${view}`, "GET");
    if (r.ok) { setCompanies(r.companies as Company[]); setSummary(r.summary as Summary); setMsg(null); }
    else setMsg({ error: r.error ?? "Could not load the lead pool" });
    setLoading(false);
  }, [view]);
  useEffect(() => { if (view !== "basis") void load(); }, [load, view]);

  const toggleSel = (id: string) => setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  async function bulk(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBulkBusy(true);
    const r = await call("/api/rep/pool/bulk", "POST", { ...body, companyIds: [...selected] });
    setBulkBusy(false);
    if (!r.ok) { setMsg({ error: r.error ?? "Bulk action failed" }); return; }
    const note = body.action === "find_contacts"
      ? `Searched ${r.searched as number} compan${r.searched === 1 ? "y" : "ies"}, ${r.suggestions as number} new suggestion${r.suggestions === 1 ? "" : "s"}${(r.skipped as number) > 0 ? `, ${r.skipped as number} skipped (already searched or no website)` : ""}.${r.stopped ? ` Stopped: ${r.stopped as string}` : ""}`
      : `${r.changed as number} updated.`;
    setMsg({ note });
    setSelected(new Set());
    void load();
  }

  async function claim(id: string) {
    setBusyId(id);
    const r = await call("/api/rep/pool/claim", "POST", { companyId: id });
    setBusyId(null);
    if (r.ok) { setMsg({ note: "Claimed. It is now in My companies." }); void load(); } else setMsg({ error: r.error ?? "Could not claim" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["mine", "available", "basis"] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setOpenId(null); setSelected(new Set()); setMsg(null); }} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${view === v ? "bg-purple text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              {v === "mine" ? "My companies" : v === "available" ? "Available to claim" : "Needs lawful basis"}
            </button>
          ))}
        </div>
        {summary && view !== "basis" && <p className="text-[11px] text-slate-400">Open companies: <strong className="text-white">{summary.held}</strong> / {summary.cap || 0}{summary.markets.length > 0 && <> · Markets: {summary.markets.map((m) => m.name).join(", ")}</>}</p>}
      </div>
      <Msg error={msg?.error} note={msg?.note} />

      {view === "basis" ? <NeedsBasisPanel onChanged={load} /> : null}

      {view === "mine" && companies.length > 0 && (
        <div className={`${card} flex flex-wrap items-center gap-2`}>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={selected.size === companies.length} onChange={(e) => setSelected(e.target.checked ? new Set(companies.map((c) => c.id)) : new Set())} /> {selected.size > 0 ? `${selected.size} selected` : "Select all"}</label>
          {selected.size > 0 && (
            <>
              <button className={btn} disabled={bulkBusy || selected.size > 10} title={selected.size > 10 ? "Select 10 or fewer for a contact search" : undefined} onClick={() => void bulk({ action: "find_contacts" })}>{bulkBusy ? "Working…" : "Find contacts (max 10)"}</button>
              <select className="rounded-xl bg-[#0B1120] border border-white/[0.08] px-2 py-2 text-xs text-white" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                <option value="">Set status…</option>
                {STATUSES.map((st) => <option key={st} value={st}>{label(st)}</option>)}
              </select>
              <button className={btnGhost} disabled={bulkBusy || !bulkStatus} onClick={() => void bulk({ action: "set_status", poolStatus: bulkStatus })}>Apply</button>
              <button className={btnGhost} disabled={bulkBusy} onClick={() => void bulk({ action: "release" }, `Return ${selected.size} compan${selected.size === 1 ? "y" : "ies"} to the pool? Someone else may claim them.`)}><Undo2 size={12} className="mr-1 inline" />Release</button>
            </>
          )}
        </div>
      )}

      {view === "basis" ? null : loading ? <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div> : companies.length === 0 ? (
        <div className={`${card} text-center text-xs text-slate-400`}>
          {view === "mine" ? "You don't own any companies yet. Claim some from “Available to claim”, or ask the admin to assign you some." : summary && summary.markets.length === 0 ? "You haven't been given access to any markets yet. Ask the admin." : "Nothing is available to claim in your markets right now."}
        </div>
      ) : (
        <ul className="space-y-3">
          {companies.map((c) => (
            <li key={c.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                {view === "mine" && <input type="checkbox" className="mt-1" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} aria-label={`Select ${c.name}`} />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{c.name}{c.possible_duplicate_of && <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">possible duplicate</span>}</p>
                  <p className="text-[11px] text-slate-400">{c.domain ?? "no website"} · {[c.acq_markets?.name, c.region, c.country].filter(Boolean).join(" · ")}{c.fit_score !== null && <> · fit {c.fit_score}</>}</p>
                </div>
                {view === "available" ? (
                  <button className={btn} disabled={busyId === c.id} onClick={() => void claim(c.id)}>{busyId === c.id ? "Claiming…" : "Claim"}</button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300">{label(c.pool_status)}</span>
                    {c.contact_count === 0 && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">needs contact</span>}
                    <button className={btnGhost} onClick={() => setOpenId(openId === c.id ? null : c.id)}>{openId === c.id ? "Close" : "Work this company"}</button>
                  </div>
                )}
              </div>
              {view === "mine" && openId === c.id && <CompanyWorkspace id={c.id} onChanged={load} onReleased={() => { setOpenId(null); void load(); }} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompanyWorkspace({ id, onChanged, onReleased }: { id: string; onChanged: () => void; onReleased: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<{ error?: string; note?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkedin, setLinkedin] = useState("");
  const [note, setNote] = useState("");
  const emptyForm = { name: "", role: "", email: "", sourceUrl: "", consentType: "inferred_publication", legalBasis: "", evidenceUrl: "", evidenceNotes: "" };
  const [form, setForm] = useState(emptyForm);
  const [consentFor, setConsentFor] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<{ verified: boolean; text: string } | null>(null);
  const [drafting, setDrafting] = useState(false);

  const reload = useCallback(async () => {
    const r = await call(`/api/rep/pool/${id}`, "GET");
    if (r.ok) { setD(r as unknown as Detail); setLinkedin((r as unknown as Detail).company.linkedin_url ?? ""); setErr(null); } else setErr(r.error ?? "Could not load");
  }, [id]);
  useEffect(() => { void reload(); }, [reload]);

  async function act(fn: () => Promise<{ ok: boolean; error?: string; issues?: { message: string }[]; [k: string]: unknown }>, success: string) {
    setBusy(true);
    setRes(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) { setRes({ note: (r.blocked as string | null) ? `${success} ${r.blocked}` : success }); await reload(); onChanged(); }
    else setRes({ error: [r.error, ...(r.issues ?? []).map((i) => i.message)].filter(Boolean).join(" · ") });
    return r;
  }

  async function draftFor(contactId: string) {
    setDrafting(true);
    setAiNote(null);
    const r = await call("/api/rep/pool/basis/draft", "POST", { contactIds: [contactId] });
    setDrafting(false);
    const d = (r.drafts as BasisDraft[] | undefined)?.[0];
    if (!r.ok || !d) { setAiNote({ verified: false, text: r.error ?? "Could not draft." }); return; }
    if (d.verified) {
      setForm((f) => ({ ...f, consentType: d.consentType, legalBasis: d.legalBasis, evidenceUrl: d.evidenceUrl ?? "", evidenceNotes: d.evidenceNotes }));
      setAiNote({ verified: true, text: "Address found on the page below. This is a draft: read it, then click Record basis." });
    } else setAiNote({ verified: false, text: d.warning ?? "Nothing could be verified." });
  }

  const basisFields = (f: typeof form, set: (v: typeof form) => void) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Lawful basis</label>
        <select className={input} value={f.consentType} onChange={(e) => set({ ...f, consentType: e.target.value })}>
          <option value="inferred_publication">Address publicly published for business contact (relevant to their role)</option>
          <option value="existing_relationship">Existing relationship</option>
          <option value="express">They asked / agreed to be contacted</option>
        </select></div>
      <div className="sm:col-span-2"><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Why you may contact them (a sentence or two)</label><textarea className={input} rows={2} value={f.legalBasis} onChange={(e) => set({ ...f, legalBasis: e.target.value })} placeholder="e.g. Listed on their contact page as the property management enquiries address; our service is relevant to their role." /></div>
      <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Evidence link</label><input className={input} value={f.evidenceUrl} onChange={(e) => set({ ...f, evidenceUrl: e.target.value })} placeholder="https://…" /></div>
      <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Notes</label><input className={input} value={f.evidenceNotes} onChange={(e) => set({ ...f, evidenceNotes: e.target.value })} /></div>
    </div>
  );

  if (err) return <Msg error={err} />;
  if (!d) return <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  const blockedCountry = d.countryRule && !d.countryRule.email_allowed;

  return (
    <div className="mt-4 space-y-5 border-t border-white/[0.06] pt-4 text-xs">
      {(!d.countryRule || blockedCountry) && <p className="rounded-lg bg-amber-500/10 p-2.5 text-amber-300">Email outreach to {d.company.country ?? "this country"} is not enabled yet, so contacts here can be recorded but not emailed until the admin enables it.</p>}
      {d.countryRule?.requires_postal_address && <p className="text-slate-400">Note: {d.countryRule.name} requires a postal address in the email footer (set by the admin).</p>}

      {d.company.summary && <p className="text-slate-300">{d.company.summary}{d.company.potential_opportunity && <> <strong className="text-white">Opportunity:</strong> {d.company.potential_opportunity}</>}{d.company.decision_maker_role && <> <strong className="text-white">Likely decision-maker:</strong> {d.company.decision_maker_role}</>}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
        <select className={`${input} max-w-[10rem]`} value={d.company.pool_status} disabled={busy} onChange={(e) => void act(() => call(`/api/rep/pool/${id}`, "PATCH", { poolStatus: e.target.value }), "Status updated.")}>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <button className={btnGhost} disabled={busy} onClick={() => { if (window.confirm("Return this company to the pool? Someone else may claim it.")) void act(async () => { const r = await call(`/api/rep/pool/${id}`, "PATCH", { release: true }); if (r.ok) onReleased(); return r; }, "Released."); }}><Undo2 size={12} className="mr-1 inline" />Release</button>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500"><Search size={11} /> Find contacts (opens in your own browser)</p>
        <div className="flex flex-wrap gap-2">
          {d.helpLinks.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className={btnGhost}>{l.label} <ExternalLink size={10} className="ml-1 inline" /></a>)}
        </div>
        {d.finderEnabled && (
          <div className="mt-3">
            <button className={btn} disabled={busy} onClick={() => void act(() => call(`/api/rep/pool/${id}/find-contacts`, "POST", {}), "Search finished.").then((r) => { if (r.ok && r.message) setRes({ note: String(r.message) }); })}>Find contacts with Hunter</button>
            <span className="ml-2 text-slate-500">Results appear below as suggestions you review.</span>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <input className={input} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="Paste the company's LinkedIn page address" />
          <button className={btnGhost} disabled={busy} onClick={() => void act(() => call(`/api/rep/pool/${id}`, "PATCH", { linkedinUrl: linkedin }), "Saved.")}>Save</button>
        </div>
      </div>

      {d.research.length > 0 && (
        <details><summary className="cursor-pointer font-bold text-slate-300">Research evidence ({d.research.length})</summary>
          <ul className="mt-2 space-y-2">{d.research.map((r) => <li key={r.id} className="rounded-lg bg-white/[0.03] p-2.5 text-slate-300">{r.observed_fact}<span className="block text-slate-500">“{r.evidence_excerpt}” <a className="text-purple-300 hover:underline" href={r.source_url} target="_blank" rel="noopener noreferrer">source</a></span></li>)}</ul>
        </details>
      )}

      {d.suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Addresses found on their website</p>
          <ul className="space-y-2">{d.suggestions.map((s) => (
            <li key={s.id} className="rounded-lg bg-white/[0.03] p-2.5">
              <p className="font-semibold text-white">{s.email}</p>
              <p className="text-slate-500">“{s.evidence_excerpt}” <a className="text-purple-300 hover:underline" href={s.source_url} target="_blank" rel="noopener noreferrer">source</a></p>
              <div className="mt-2 flex gap-2">
                <button className={btn} disabled={busy} onClick={() => void act(() => call(`/api/rep/pool/suggestions/${s.id}`, "PATCH", { action: "accept" }), "Added as a contact. Record the lawful basis below before emailing.")}>Add as contact</button>
                <button className={btnGhost} disabled={busy} onClick={() => void act(() => call(`/api/rep/pool/suggestions/${s.id}`, "PATCH", { action: "dismiss" }), "Dismissed.")}>Dismiss</button>
              </div>
            </li>))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Contacts ({d.contacts.length})</p>
        {d.contacts.length === 0 && <p className="text-slate-500">No contacts yet. Find one with the search links above, then add it below.</p>}
        <ul className="space-y-2">{d.contacts.map((c) => (
          <li key={c.id} className="rounded-lg bg-white/[0.03] p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span><strong className="text-white">{c.name || c.email}</strong>{c.role && <span className="text-slate-500"> · {c.role}</span>}<span className="block text-slate-500">{c.email}</span></span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${c.status === "eligible" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{c.status === "eligible" ? <><ShieldCheck size={10} className="mr-1 inline" />cleared to email</> : "needs lawful basis"}</span>
            </div>
            {c.status !== "eligible" && c.status !== "suppressed" && (
              consentFor === c.id ? (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} disabled={busy || drafting} onClick={() => void draftFor(c.id)}><Sparkles size={12} className="mr-1 inline" />{drafting ? "Checking their website…" : "Draft with AI"}</button>
                    {aiNote && <span className={`text-[11px] ${aiNote.verified ? "text-emerald-300" : "text-amber-300"}`}>{aiNote.text}</span>}
                  </div>
                  {basisFields(form, setForm)}
                  <div className="flex gap-2">
                    <button className={btn} disabled={busy} onClick={() => void act(() => call(`/api/rep/pool/contacts/${c.id}/consent`, "POST", { consentType: form.consentType, legalBasis: form.legalBasis, evidenceUrl: form.evidenceUrl, evidenceNotes: form.evidenceNotes }), "Basis recorded.").then((r) => { if (r.ok) { setConsentFor(null); setForm(emptyForm); } })}>Record basis</button>
                    <button className={btnGhost} onClick={() => setConsentFor(null)}>Cancel</button>
                  </div>
                </div>
              ) : <button className={`${btnGhost} mt-2`} onClick={() => { setConsentFor(c.id); setForm(emptyForm); setAiNote(null); }}>Record lawful basis</button>
            )}
            {c.status === "eligible" && <p className="mt-2 text-slate-500">Find them in your Leads CRM (source “Lead pool”) to send an email or enrol them in a campaign.</p>}
          </li>))}
        </ul>

        <details className="mt-3"><summary className="cursor-pointer font-bold text-purple-300">Add a contact</summary>
          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Email</label><input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Name</label><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Role</label><input className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Principal, Head of Property" /></div>
              <div><label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Where you found it (link)</label><input className={input} value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://…" /></div>
            </div>
            {basisFields(form, setForm)}
            <button className={btn} disabled={busy || !form.email} onClick={() => void act(() => call(`/api/rep/pool/${id}/contacts`, "POST", { name: form.name, role: form.role, email: form.email, sourceUrl: form.sourceUrl, sourceType: "company_website", basis: { consentType: form.consentType, legalBasis: form.legalBasis, evidenceUrl: form.evidenceUrl, evidenceNotes: form.evidenceNotes } }), "Contact added.").then((r) => { if (r.ok) setForm(emptyForm); })}>Add contact &amp; record basis</button>
          </div>
        </details>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Notes</p>
        <div className="flex gap-2">
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called reception, asked to email the owner next week…" />
          <button className={btnGhost} disabled={busy || !note.trim()} onClick={() => void act(() => call(`/api/rep/pool/${id}/notes`, "POST", { note }), "Note added.").then((r) => { if (r.ok) setNote(""); })}>Add</button>
        </div>
        <ul className="mt-2 space-y-1.5">{d.notes.map((n) => <li key={n.id} className="text-slate-400"><span className="text-slate-500">{new Date(n.created_at).toLocaleDateString()} · {n.author}:</span> {n.note}</li>)}</ul>
      </div>

      <Msg error={res?.error} note={res?.note} />
    </div>
  );
}
