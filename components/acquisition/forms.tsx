"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton, Feedback, api, useAction } from "./client";
import { btnCls, btnDangerCls, btnGhostCls, inputCls, labelCls } from "./ui";
import { STARTER_TEMPLATE } from "@/lib/acquisition/compliance/templates";

/* ---------- Companies ---------- */

const STATES = ["", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function CompanyImportForm({ markets = [] }: { markets?: { id: string; name: string; country: string; industry: string }[] }) {
  const { run, busy, result } = useAction();
  const [text, setText] = useState("");
  const [marketId, setMarketId] = useState("");
  const [country, setCountry] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  function parse() {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l, i) => !(i === 0 && /^name\b/i.test(l)))
      .map((l) => {
        const [name, website, region, suburb] = l.split(/\t|,/).map((x) => x.trim());
        const m = markets.find((x) => x.id === marketId);
        return { name, website: website || null, region: region || null, suburb: suburb || null, market_id: marketId || null, country: m?.country ?? (country.trim().toUpperCase() || null), industry: m?.industry ?? null };
      });
  }

  return (
    <div>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Market (sets country and industry)</label>
          <select className={inputCls} value={marketId} onChange={(e) => setMarketId(e.target.value)}>
            <option value="">No market</option>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Country code (when no market)</label>
          <input className={inputCls} maxLength={2} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="AU, GB, US…" disabled={!!marketId} />
        </div>
      </div>
      <label className={labelCls} htmlFor="import">Paste one company per line: <code>name, website, region, suburb</code></label>
      <textarea id="import" className={inputCls} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Acme Property Management, https://acme.com.au, QLD, Brisbane\nHarbour Realty, harbourrealty.com.au, NSW, Sydney"} />
      <div className="mt-3 flex items-center gap-3">
        <button
          className={btnCls}
          disabled={busy || !text.trim()}
          onClick={async () => {
            setSummary(null);
            const r = await run("/api/acquisition/companies", "POST", { companies: parse() }, (res) => {
              setSummary(`${res.created} added, ${(res.duplicates as string[]).length} duplicates skipped, ${(res.errors as unknown[]).length} errors.`);
              setText("");
            });
            if (!r.ok && r.error === "Validation failed") setSummary(null);
          }}
        >
          {busy ? "Importing…" : "Import companies"}
        </button>
        {summary && <span className="text-sm text-navy/70">{summary}</span>}
      </div>
      <Feedback result={result && !result.ok ? result : null} />
    </div>
  );
}

export function ResearchControls({ companyId, hasWebsite }: { companyId: string; hasWebsite: boolean }) {
  const { run, busy, result } = useAction();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button
        className={btnCls}
        disabled={busy || !hasWebsite}
        title={hasWebsite ? "" : "Add a website first"}
        onClick={async () => {
          setMsg("Queued…");
          const q = await run("/api/acquisition/research", "POST", { companyId });
          if (!q.ok) return setMsg(null);
          const w = await api("/api/acquisition/jobs/run", "POST");
          setMsg(w.ok ? `Worker ran: ${w.succeeded} succeeded, ${w.retried} will retry, ${w.failed} failed.` : `Worker error: ${w.error}`);
        }}
      >
        {busy ? "Researching…" : "Run AI research"}
      </button>
      {msg && <p className="mt-2 text-sm text-navy/70">{msg}</p>}
      <Feedback result={result && !result.ok ? result : null} />
    </div>
  );
}

export function ResearchNoteForm({ companyId }: { companyId: string }) {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ category: "identity", strength: "0.8", source_url: "", observed_fact: "", evidence_excerpt: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(`/api/acquisition/companies/${companyId}/research-notes`, "POST", { ...f, strength: Number(f.strength) }, () => setF({ ...f, observed_fact: "", evidence_excerpt: "" }));
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Signal</label>
          <select className={inputCls} value={f.category} onChange={set("category")}>
            <option value="identity">Is a property manager</option>
            <option value="portfolio">Portfolio size</option>
            <option value="opportunity">Workflow opportunity</option>
            <option value="technology">Technology investment</option>
            <option value="decision_maker">Decision-maker</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Strength (0–1)</label>
          <input className={inputCls} type="number" min="0" max="1" step="0.1" value={f.strength} onChange={set("strength")} />
        </div>
        <div>
          <label className={labelCls}>Source URL</label>
          <input className={inputCls} type="url" required value={f.source_url} onChange={set("source_url")} placeholder="https://…" />
        </div>
      </div>
      <div>
        <label className={labelCls}>What you observed</label>
        <input className={inputCls} required value={f.observed_fact} onChange={set("observed_fact")} />
      </div>
      <div>
        <label className={labelCls}>Evidence excerpt (copied from the source)</label>
        <textarea className={inputCls} rows={2} required value={f.evidence_excerpt} onChange={set("evidence_excerpt")} />
      </div>
      <button className={btnGhostCls} disabled={busy}>{busy ? "Saving…" : "Add research note"}</button>
      <Feedback result={result} />
    </form>
  );
}

/* ---------- Contacts & consent ---------- */

export function ContactForm({ companyId }: { companyId: string }) {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ name: "", role: "", email: "", source_url: "", source_type: "company_website" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run("/api/acquisition/contacts", "POST", { company_id: companyId, ...f }, () => setF({ ...f, name: "", role: "", email: "", source_url: "" }));
      }}
    >
      <div><label className={labelCls}>Name</label><input className={inputCls} value={f.name} onChange={set("name")} /></div>
      <div><label className={labelCls}>Role</label><input className={inputCls} value={f.role} onChange={set("role")} placeholder="e.g. Principal, Head of Property Management" /></div>
      <div><label className={labelCls}>Email</label><input className={inputCls} type="email" required value={f.email} onChange={set("email")} /></div>
      <div><label className={labelCls}>Where you found it (URL)</label><input className={inputCls} type="url" value={f.source_url} onChange={set("source_url")} /></div>
      <div>
        <label className={labelCls}>Source type</label>
        <select className={inputCls} value={f.source_type} onChange={set("source_type")}>
          <option value="company_website">Company website</option>
          <option value="public_directory">Public directory</option>
          <option value="referral">Referral</option>
          <option value="inbound_enquiry">Inbound enquiry</option>
          <option value="existing_client">Existing client</option>
          <option value="manual_import">Manual import</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex items-end"><button className={btnGhostCls} disabled={busy}>{busy ? "Adding…" : "Add contact (needs consent review)"}</button></div>
      <div className="sm:col-span-2"><Feedback result={result} /></div>
    </form>
  );
}

export function ConsentForm({ contactId }: { contactId: string }) {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ consent_type: "inferred_publication", legal_basis: "", evidence_url: "", evidence_notes: "", expires_at: "" });
  const [checks, setChecks] = useState({ conspicuously_published: false, no_no_spam_notice: false, relevant_to_role: false });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const inferred = f.consent_type === "inferred_publication";
  const needsEvidence = f.consent_type !== "unverified" && f.consent_type !== "withdrawn";
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(`/api/acquisition/contacts/${contactId}/consent`, "POST", {
          ...f,
          expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
          inferred_checklist: inferred ? checks : undefined,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Basis for outreach</label>
          <select className={inputCls} value={f.consent_type} onChange={set("consent_type")}>
            <option value="inferred_publication">Inferred — address conspicuously published</option>
            <option value="express">Express consent given</option>
            <option value="existing_relationship">Existing relationship</option>
            <option value="unverified">Unverified (blocks outreach)</option>
            <option value="withdrawn">Withdrawn (blocks outreach)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Review expires (optional)</label>
          <input className={inputCls} type="date" value={f.expires_at} onChange={set("expires_at")} />
        </div>
      </div>
      {needsEvidence && (
        <>
          <div><label className={labelCls}>Why this is a valid basis</label><textarea className={inputCls} rows={2} value={f.legal_basis} onChange={set("legal_basis")} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>Evidence URL{inferred ? " (page where the address is published)" : ""}</label><input className={inputCls} type="url" value={f.evidence_url} onChange={set("evidence_url")} /></div>
            <div><label className={labelCls}>Evidence notes</label><input className={inputCls} value={f.evidence_notes} onChange={set("evidence_notes")} /></div>
          </div>
        </>
      )}
      {inferred && (
        <fieldset className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <legend className="px-1 text-xs font-bold">Confirm all three. If any is false, record &ldquo;Unverified&rdquo; instead</legend>
          {([
            ["conspicuously_published", "The address is conspicuously published (not buried, scraped from a leak or purchased list)"],
            ["no_no_spam_notice", "Nothing near it says the owner doesn't want unsolicited commercial messages"],
            ["relevant_to_role", "This message is relevant to the role/business the address is published for"],
          ] as const).map(([k, label]) => (
            <label key={k} className="mt-1 flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      )}
      <button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Record my review"}</button>
      <Feedback result={result} />
    </form>
  );
}

/* ---------- Campaigns ---------- */

interface CampaignValues {
  name: string; daily_limit: number; sender_name: string; sender_business: string; sender_postal_address: string; sender_email: string;
  subject_template: string; body_template: string; followup_enabled: boolean; followup_delay_business_days: number; followup_body_template: string | null;
}

export function CampaignForm({ campaignId, initial, maxDailyLimit }: { campaignId?: string; initial?: CampaignValues; maxDailyLimit: number }) {
  const router = useRouter();
  const { run, busy, result } = useAction();
  const [f, setF] = useState<CampaignValues>(
    initial ?? {
      name: "", daily_limit: Math.min(5, maxDailyLimit), sender_name: "", sender_business: "The Digital Dude", sender_postal_address: "", sender_email: "",
      subject_template: STARTER_TEMPLATE.subject, body_template: STARTER_TEMPLATE.body, followup_enabled: true, followup_delay_business_days: 7, followup_body_template: STARTER_TEMPLATE.followup,
    }
  );
  const set = <K extends keyof CampaignValues>(k: K, v: CampaignValues[K]) => setF({ ...f, [k]: v });
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(campaignId ? `/api/acquisition/campaigns/${campaignId}` : "/api/acquisition/campaigns", campaignId ? "PATCH" : "POST", f);
        if (r.ok && !campaignId) router.push(`/admin/acquisition/campaigns/${r.id}`);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><label className={labelCls}>Campaign name</label><input className={inputCls} required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label className={labelCls}>Daily send limit (max {maxDailyLimit})</label><input className={inputCls} type="number" min={1} max={maxDailyLimit} value={f.daily_limit} onChange={(e) => set("daily_limit", Number(e.target.value))} /></div>
      </div>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-xs font-bold text-navy/70">Sender identity (shown in every email footer)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>Your name</label><input className={inputCls} value={f.sender_name} onChange={(e) => set("sender_name", e.target.value)} /></div>
          <div><label className={labelCls}>Business name</label><input className={inputCls} value={f.sender_business} onChange={(e) => set("sender_business", e.target.value)} /></div>
          <div><label className={labelCls}>Postal address</label><input className={inputCls} value={f.sender_postal_address} onChange={(e) => set("sender_postal_address", e.target.value)} /></div>
          <div><label className={labelCls}>Sender / reply-to email</label><input className={inputCls} type="email" value={f.sender_email} onChange={(e) => set("sender_email", e.target.value)} /></div>
        </div>
      </fieldset>
      <div><label className={labelCls}>Subject</label><input className={inputCls} value={f.subject_template} onChange={(e) => set("subject_template", e.target.value)} /></div>
      <div>
        <label className={labelCls}>Initial email body</label>
        <textarea className={`${inputCls} font-mono`} rows={12} value={f.body_template} onChange={(e) => set("body_template", e.target.value)} />
        <p className="mt-1 text-xs text-navy/50">Merge tags: {"{{first_name}} {{company_name}} {{observation}} {{sender_name}} {{booking_url}}"}. The sender-identity and unsubscribe footer is added automatically. <code>{"{{observation}}"}</code> is filled only from verified research and is omitted when there is none.</p>
      </div>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-xs font-bold text-navy/70">Follow-up (at most one, only if still eligible and no reply)</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.followup_enabled} onChange={(e) => set("followup_enabled", e.target.checked)} /> Send one follow-up</label>
        {f.followup_enabled && (
          <div className="mt-3 space-y-3">
            <div className="max-w-xs"><label className={labelCls}>Business days after the first email</label><input className={inputCls} type="number" min={1} max={30} value={f.followup_delay_business_days} onChange={(e) => set("followup_delay_business_days", Number(e.target.value))} /></div>
            <div><label className={labelCls}>Follow-up body</label><textarea className={`${inputCls} font-mono`} rows={6} value={f.followup_body_template ?? ""} onChange={(e) => set("followup_body_template", e.target.value)} /></div>
          </div>
        )}
      </fieldset>
      <button className={btnCls} disabled={busy}>{busy ? "Saving…" : campaignId ? "Save changes" : "Create draft campaign"}</button>
      <Feedback result={result} />
    </form>
  );
}

export function AddLeadsForm({ campaignId, contacts }: { campaignId: string; contacts: { id: string; name: string | null; email: string; role: string | null; acq_companies: { name: string } | null }[] }) {
  const { run, busy, result } = useAction();
  const [sel, setSel] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<{ contactId: string; ok: boolean; error?: string }[]>([]);
  if (contacts.length === 0) return <p className="text-sm text-navy/60">No eligible contacts are available. Record a reviewed consent basis on a contact first.</p>;
  return (
    <div>
      <ul className="max-h-64 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200">
        {contacts.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
              <input type="checkbox" checked={sel.includes(c.id)} onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} />
              <span className="font-medium text-navy">{c.name || c.email}</span>
              <span className="text-navy/50">{c.acq_companies?.name} · {c.email}</span>
            </label>
          </li>
        ))}
      </ul>
      <button className={`${btnCls} mt-3`} disabled={busy || sel.length === 0} onClick={() => void run(`/api/acquisition/campaigns/${campaignId}/leads`, "POST", { contactIds: sel }, (r) => { setOutcome(r.results as typeof outcome); setSel([]); })}>
        {busy ? "Drafting…" : `Create drafts for ${sel.length} contact${sel.length === 1 ? "" : "s"}`}
      </button>
      {outcome.filter((o) => !o.ok).map((o) => <p key={o.contactId} className="mt-2 text-sm text-red-700">{contacts.find((c) => c.id === o.contactId)?.email}: {o.error}</p>)}
      <Feedback result={result && !result.ok && !result.results ? result : null} />
    </div>
  );
}

export function DraftEditor({ messageId, subject, body, editable }: { messageId: string; subject: string; body: string; editable: boolean }) {
  const { run, busy, result } = useAction();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(subject);
  const [b, setB] = useState(body);
  if (!open) {
    return (
      <div>
        <p className="text-sm font-semibold text-navy">{subject}</p>
        <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-navy/80">{body}</pre>
        {editable && <button className={`${btnGhostCls} mt-2 !px-3 !py-1 text-xs`} onClick={() => setOpen(true)}>Edit draft</button>}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <input className={inputCls} value={s} onChange={(e) => setS(e.target.value)} />
      <textarea className={`${inputCls} font-mono`} rows={14} value={b} onChange={(e) => setB(e.target.value)} />
      <div className="flex gap-2">
        <button className={btnCls} disabled={busy} onClick={() => void run(`/api/acquisition/messages/${messageId}`, "PATCH", { subject: s, body: b }, () => setOpen(false))}>{busy ? "Saving…" : "Save draft"}</button>
        <button className={btnGhostCls} onClick={() => { setOpen(false); setS(subject); setB(body); }}>Cancel</button>
      </div>
      <Feedback result={result} />
    </div>
  );
}

const TRANSITIONS: Record<string, { action: string; label: string; variant?: "primary" | "ghost" | "danger"; confirm?: string }[]> = {
  draft: [{ action: "submit", label: "Submit for approval" }],
  rejected: [{ action: "revoke", label: "Reopen as draft", variant: "ghost" }],
  pending_approval: [{ action: "revoke", label: "Withdraw to edit", variant: "ghost" }],
  approved: [
    { action: "launch", label: "Launch campaign", confirm: "Launch this campaign? Approved emails become eligible to send (subject to the global pause, daily cap and per-send checks)." },
    { action: "revoke", label: "Revoke approval to edit", variant: "ghost" },
  ],
  active: [{ action: "pause", label: "Pause campaign", variant: "danger" }, { action: "complete", label: "Mark complete", variant: "ghost" }],
  paused: [{ action: "resume", label: "Resume", variant: "ghost" }, { action: "complete", label: "Mark complete", variant: "ghost" }],
};

export function CampaignActions({ campaignId, status }: { campaignId: string; status: string }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {(TRANSITIONS[status] ?? []).map((t) => (
        <ActionButton key={t.action} url={`/api/acquisition/campaigns/${campaignId}/status`} body={{ action: t.action }} variant={t.variant} confirm={t.confirm}>{t.label}</ActionButton>
      ))}
    </div>
  );
}

export function ApprovalControls({ campaignId, contentHash }: { campaignId: string; contentHash: string }) {
  const { run, busy, result } = useAction();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  return (
    <div className="space-y-3">
      {!rejecting ? (
        <div className="flex flex-wrap gap-3">
          <button className={btnCls} disabled={busy} onClick={() => { if (window.confirm("Approve and freeze exactly this content?")) void run("/api/acquisition/approvals", "POST", { decision: "approve", campaignId, contentHash }); }}>
            {busy ? "Approving…" : "Approve & freeze this version"}
          </button>
          <button className={btnGhostCls} onClick={() => setRejecting(true)}>Reject…</button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea className={inputCls} rows={2} placeholder="Why is this being rejected?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <button className={btnDangerCls} disabled={busy || !reason.trim()} onClick={() => void run("/api/acquisition/approvals", "POST", { decision: "reject", campaignId, reason })}>Confirm rejection</button>
            <button className={btnGhostCls} onClick={() => setRejecting(false)}>Cancel</button>
          </div>
        </div>
      )}
      <p className="text-xs text-navy/50">Approval is bound to content hash <code>{contentHash.slice(0, 12)}…</code>. If any draft changes before you click, approval is refused.</p>
      <Feedback result={result} />
    </div>
  );
}

/* ---------- Inbox, settings ---------- */

export function ReplyControls({ replyId, classification, contactId, canBook }: { replyId: string; classification: string; contactId: string; canBook: boolean }) {
  const { run, busy, result } = useAction();
  const [val, setVal] = useState(classification);
  const [link, setLink] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={`${inputCls} !w-auto`} value={val} onChange={(e) => setVal(e.target.value)}>
        {["interested", "not_interested", "opt_out", "out_of_office", "bounce", "uncertain"].map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
      </select>
      <button className={btnGhostCls} disabled={busy || val === classification} onClick={() => void run(`/api/acquisition/replies/${replyId}`, "PATCH", { classification: val })}>Save</button>
      {canBook && (
        <button className={btnCls} disabled={busy} onClick={() => void run("/api/acquisition/meetings", "POST", { contactId }, (r) => setLink(String(r.bookingUrl)))}>Offer booking link</button>
      )}
      {link && <span className="text-sm">Share: <a className="font-semibold text-purple underline" href={link} target="_blank" rel="noreferrer">{link}</a></span>}
      <Feedback result={result} />
    </div>
  );
}

export function SuppressionForm() {
  const { run, busy, result } = useAction();
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run("/api/acquisition/suppressions", "POST", { ...(email ? { email } : {}), ...(domain ? { domain } : {}), reason: "manual" }, () => { setEmail(""); setDomain(""); });
      }}
    >
      <div><label className={labelCls}>Email</label><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@agency.com.au" /></div>
      <div><label className={labelCls}>or whole company domain</label><input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="agency.com.au" /></div>
      <div className="flex items-end"><button className={btnDangerCls} disabled={busy || (!email && !domain)}>Suppress permanently</button></div>
      <div className="sm:col-span-3"><Feedback result={result} /></div>
    </form>
  );
}

export function PauseToggle({ paused }: { paused: boolean }) {
  return (
    <ActionButton
      url="/api/acquisition/settings"
      body={{ sendingPaused: !paused }}
      variant={paused ? "primary" : "danger"}
      confirm={paused ? "Resume sending? Only approved, active campaigns can send, and every email is still checked individually." : undefined}
    >
      {paused ? "Resume sending" : "EMERGENCY PAUSE"}
    </ActionButton>
  );
}

export function RunWorkerButton() {
  const { run, busy, result } = useAction();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div>
      <button className={btnGhostCls} disabled={busy} onClick={() => void run("/api/acquisition/jobs/run", "POST", undefined, (r) => setMsg(`${r.claimed} claimed · ${r.succeeded} ok · ${r.retried} retry · ${r.failed} failed`))}>
        {busy ? "Running…" : "Run worker now"}
      </button>
      {msg && <p className="mt-1 text-xs text-navy/60">{msg}</p>}
      <Feedback result={result && !result.ok ? result : null} />
    </div>
  );
}

const CHECKLIST: Record<string, string[]> = {
  Security: ["Authentication and server-side authorization work", "RLS prevents unauthorized access (anon key returns nothing)", "Secrets are never exposed to the browser", "Campaign approvals and changes are audited"],
  "Data and eligibility": ["Contacts have recorded source and consent evidence", "Unverified contacts are blocked", "Duplicate contacts and companies are detected", "Suppression is checked immediately before sending"],
  "Email and automation": ["Sending domain SPF / DKIM / DMARC pass", "Sender identity and unsubscribe mechanism work end-to-end", "Webhook signatures and duplicate events are tested", "Replies, bounces and opt-outs stop sequences correctly", "Scheduled jobs survive restarts and retry safely"],
  "Pilot readiness": ["Campaign content and follow-up rules are approved", "Daily sending caps and emergency pause work", "Test emails and unsubscribe flow pass end-to-end", "Privacy notice, retention and provider terms are reviewed"],
};

export function Checklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("acq-checklist") ?? "{}")); } catch { /* storage unavailable */ }
  }, []);
  const total = Object.values(CHECKLIST).flat().length;
  const count = Object.values(done).filter(Boolean).length;
  function toggle(item: string) {
    const next = { ...done, [item]: !done[item] };
    setDone(next);
    try { localStorage.setItem("acq-checklist", JSON.stringify(next)); } catch { /* ignore */ }
  }
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-navy">{count}/{total} complete <span className="font-normal text-navy/50">(saved in this browser only)</span></p>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(CHECKLIST).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-navy/50">{group}</h3>
            {items.map((item) => (
              <label key={item} className="flex items-start gap-2 py-0.5 text-sm text-navy/80">
                <input type="checkbox" className="mt-1" checked={!!done[item]} onChange={() => toggle(item)} />
                {item}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestionControls({ suggestionId }: { suggestionId: string }) {
  return (
    <div className="flex gap-2">
      <ActionButton url={`/api/acquisition/suggestions/${suggestionId}`} method="PATCH" body={{ action: "accept" }} confirm="Add this address as a contact? It still cannot be emailed until you record a consent review.">Add as contact</ActionButton>
      <ActionButton url={`/api/acquisition/suggestions/${suggestionId}`} method="PATCH" body={{ action: "dismiss" }} variant="ghost">Dismiss</ActionButton>
    </div>
  );
}

export function AutoResearchToggle({ enabled }: { enabled: boolean }) {
  return (
    <ActionButton
      url="/api/acquisition/settings"
      body={{ autoResearchEnabled: !enabled }}
      variant={enabled ? "danger" : "primary"}
      confirm={enabled ? undefined : "Turn on daily automatic discovery and research? It only finds and researches companies and suggests addresses; it never emails anyone."}
    >
      {enabled ? "Turn off auto research" : "Turn on auto research"}
    </ActionButton>
  );
}

const AI_PRESETS: Record<string, { baseUrl: string; model: string }> = {
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
};

export function AiSettingsCard({ status }: { status: { configured: boolean; source: string; baseUrl: string | null; model: string | null; keyHint: string | null } }) {
  const { run, busy, result } = useAction();
  const [baseUrl, setBaseUrl] = useState(status.baseUrl ?? AI_PRESETS.gemini.baseUrl);
  const [model, setModel] = useState(status.model ?? AI_PRESETS.gemini.model);
  const [apiKey, setApiKey] = useState("");
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function runTest() {
    setTesting(true);
    setTest(null);
    const r = await api("/api/acquisition/settings/ai", "POST", { action: "test", baseUrl, model, apiKey });
    setTest({ ok: r.ok, text: String(r.ok ? r.message : r.error ?? "Test failed") });
    setTesting(false);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-navy/70">
        Status: {status.configured ? <strong className="text-emerald-700">configured</strong> : <strong className="text-amber-700">not configured</strong>}
        {status.configured && <> via {status.source === "saved" ? "saved settings" : "environment variables"} · <code>{status.model}</code> · key {status.keyHint}</>}.
        {" "}A key saved here is encrypted, never shown again, and takes priority over the environment variables.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run("/api/acquisition/settings/ai", "POST", { action: "save", baseUrl, model, apiKey: apiKey || undefined }, () => setApiKey(""));
        }}
      >
        <div className="sm:col-span-2">
          <label className={labelCls}>Provider preset</label>
          <select className={inputCls} defaultValue="" onChange={(e) => { const p = AI_PRESETS[e.target.value]; if (p) { setBaseUrl(p.baseUrl); setModel(p.model); } }}>
            <option value="">Choose to fill the fields…</option>
            <option value="gemini">Google Gemini (AI Studio, free tier)</option>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
          </select>
        </div>
        <div><label className={labelCls}>Base URL (https, OpenAI-compatible)</label><input className={inputCls} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required /></div>
        <div><label className={labelCls}>Model</label><input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} required /></div>
        <div className="sm:col-span-2">
          <label className={labelCls}>API key {status.source === "saved" && "(leave blank to keep the saved key)"}</label>
          <input className={inputCls} type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={status.source === "saved" ? status.keyHint ?? "" : "Paste your key"} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button className={btnCls} disabled={busy || testing}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" className={btnGhostCls} disabled={busy || testing} onClick={() => void runTest()}>{testing ? "Testing…" : "Test connection"}</button>
          {status.source === "saved" && <button type="button" className={btnDangerCls} disabled={busy || testing} onClick={() => { if (window.confirm("Remove the saved AI settings? The environment variables (if any) will be used instead.")) void run("/api/acquisition/settings/ai", "POST", { action: "clear" }); }}>Remove saved key</button>}
        </div>
        {test && <p className={`sm:col-span-2 rounded-lg p-3 text-sm ${test.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`} role="status">{test.ok ? "OK: " : "Failed: "}{test.text}</p>}
        <div className="sm:col-span-2"><Feedback result={result} /></div>
      </form>
    </div>
  );
}

export function SenderIdentityCard({ business, postalAddress }: { business: string; postalAddress: string }) {
  const { run, busy, result } = useAction();
  const [b, setB] = useState(business);
  const [a, setA] = useState(postalAddress);
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void run("/api/acquisition/settings/identity", "POST", { business: b, postalAddress: a }); }}>
      <p className="text-sm text-navy/70 sm:col-span-2">Shown in the footer of every rep email, next to the unsubscribe link, so recipients know who is sending. Add a real postal address: US law (CAN-SPAM) requires one and the UK and Australia expect clear sender identification.</p>
      <div><label className={labelCls}>Business name</label><input className={inputCls} value={b} onChange={(e) => setB(e.target.value)} required /></div>
      <div><label className={labelCls}>Postal address</label><input className={inputCls} value={a} onChange={(e) => setA(e.target.value)} placeholder="Street, city, postcode, country" /></div>
      <div className="sm:col-span-2"><button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Save identity"}</button><Feedback result={result} /></div>
    </form>
  );
}

/* ---------- Markets, countries, duplicates ---------- */

export function MarketForm() {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ name: "", industry: "", country: "", search_phrases: "", places: "", domain_suffixes: "", qualification_text: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void run("/api/acquisition/markets", "POST", f, () => setF({ name: "", industry: "", country: "", search_phrases: "", places: "", domain_suffixes: "", qualification_text: "" })); }}>
      <div><label className={labelCls}>Market name</label><input className={inputCls} required value={f.name} onChange={set("name")} placeholder="Law firms - United Kingdom" /></div>
      <div><label className={labelCls}>Industry</label><input className={inputCls} required value={f.industry} onChange={set("industry")} placeholder="Law firms" /></div>
      <div><label className={labelCls}>Country code</label><input className={inputCls} required maxLength={2} value={f.country} onChange={set("country")} placeholder="GB" /></div>
      <div><label className={labelCls}>Allowed website endings (optional)</label><input className={inputCls} value={f.domain_suffixes} onChange={set("domain_suffixes")} placeholder=".uk, .co.uk (blank = any business site)" /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Search phrases (one per line or comma separated)</label><textarea className={inputCls} rows={3} value={f.search_phrases} onChange={set("search_phrases")} placeholder={"commercial law firm\nsmall business solicitors"} /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Places to search (cities/regions, optional)</label><textarea className={inputCls} rows={2} value={f.places} onChange={set("places")} placeholder="London, Manchester, Leeds" /></div>
      <div className="sm:col-span-2"><label className={labelCls}>What a good fit looks like (guides the AI)</label><textarea className={inputCls} rows={2} value={f.qualification_text} onChange={set("qualification_text")} placeholder="Small to mid-sized firms that could use case-management automation." /></div>
      <div className="sm:col-span-2"><button className={btnCls} disabled={busy}>{busy ? "Creating…" : "Create market"}</button><Feedback result={result} /></div>
    </form>
  );
}

export function MarketToggle({ id, enabled }: { id: string; enabled: boolean }) {
  return <ActionButton url={`/api/acquisition/markets/${id}`} method="PATCH" body={{ enabled: !enabled }} variant={enabled ? "ghost" : "primary"}>{enabled ? "Disable" : "Enable"}</ActionButton>;
}

export function CountryRuleForm() {
  const { run, busy, result } = useAction();
  const [f, setF] = useState({ country: "", name: "", requires_postal_address: false, notes: "" });
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!window.confirm("Enable email outreach to this country? Only do this after checking its rules for business email.")) return; void run("/api/acquisition/country-rules", "POST", { ...f, email_allowed: true }, () => setF({ country: "", name: "", requires_postal_address: false, notes: "" })); }}>
      <div><label className={labelCls}>Country code</label><input className={inputCls} required maxLength={2} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="DE" /></div>
      <div><label className={labelCls}>Country name</label><input className={inputCls} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Germany" /></div>
      <div className="sm:col-span-2"><label className={labelCls}>Notes (the rule you checked)</label><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.requires_postal_address} onChange={(e) => setF({ ...f, requires_postal_address: e.target.checked })} /> Requires a postal address in the footer</label>
      <div className="sm:col-span-2"><button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Enable country"}</button><Feedback result={result} /></div>
    </form>
  );
}

export function CountryToggle({ country, name, allowed, requiresPostal, notes }: { country: string; name: string; allowed: boolean; requiresPostal: boolean; notes: string }) {
  return (
    <ActionButton
      url="/api/acquisition/country-rules"
      body={{ country, name, email_allowed: !allowed, requires_postal_address: requiresPostal, notes }}
      variant={allowed ? "danger" : "primary"}
      confirm={allowed ? undefined : `Enable email outreach to ${name}? Check its rules for business email first.`}
    >
      {allowed ? "Block" : "Enable"}
    </ActionButton>
  );
}

export function DuplicateControls({ companyId, keeperId, keeperName }: { companyId: string; keeperId: string; keeperName: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton url={`/api/acquisition/companies/${companyId}/duplicate`} body={{ action: "merge", keeperId }} confirm={`Merge this company into "${keeperName}"? Its contacts, research and suggestions move across and this record is archived (not deleted).`}>Merge into {keeperName}</ActionButton>
      <ActionButton url={`/api/acquisition/companies/${companyId}/duplicate`} body={{ action: "dismiss" }} variant="ghost">Not a duplicate</ActionButton>
    </div>
  );
}
