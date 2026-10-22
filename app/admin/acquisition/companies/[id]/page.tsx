import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/acquisition/queries";
import { evaluateEligibility, type ConsentRecord } from "@/lib/acquisition/compliance/eligibility";
import { Card, Empty, PageHeader, StatusBadge, Badge, EmailCheckBadge, fmtDate } from "@/components/acquisition/ui";
import { getDb } from "@/lib/acquisition/db";
import { loadChecks } from "@/lib/acquisition/verify/bulk";
import { ConsentForm, ContactForm, FindContactsButton, MultiContactToggle, ResearchControls, VerifyContactsButton, ResearchNoteForm, SuggestionControls } from "@/components/acquisition/forms";

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getCompany(id);
  if (!data) notFound();
  const { company, research, contacts, suggestions, finderEnabled } = data;
  const missing = (company.missing_evidence ?? []) as string[];
  const checks = await loadChecks(getDb(), (contacts as { email: string }[]).map((c) => c.email)).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);

  return (
    <>
      <p className="mb-2 text-sm"><Link className="text-purple hover:underline" href="/admin/acquisition/companies">← Companies</Link></p>
      <PageHeader title={company.name} subtitle={[company.website, [company.region || company.suburb || company.state, company.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")} action={<div className="flex flex-wrap items-start gap-3"><ResearchControls companyId={company.id} hasWebsite={!!company.website} /><FindContactsButton companyId={company.id} enabled={finderEnabled && !!company.website} /></div>} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Qualification" className="lg:col-span-1">
          <div className="text-4xl font-extrabold text-navy">{company.fit_score ?? "—"}<span className="text-base font-medium text-navy/40"> / 100</span></div>
          <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={company.status} />{company.fit_band && <Badge tone="purple">{String(company.fit_band).replace(/_/g, " ")}</Badge>}</div>
          {company.summary && <p className="mt-4 text-sm text-navy/80">{company.summary}</p>}
          {company.potential_opportunity && <p className="mt-2 text-sm"><strong>Opportunity:</strong> {company.potential_opportunity}</p>}
          {company.decision_maker_role && <p className="mt-2 text-sm"><strong>Likely decision-maker:</strong> {company.decision_maker_role}</p>}
          {company.research_confidence !== null && <p className="mt-2 text-xs text-navy/50">Model confidence {Math.round(Number(company.research_confidence) * 100)}% · last researched {fmtDate(company.last_researched_at)}</p>}
          {missing.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-bold">Missing / unverified</p>
              <ul className="list-disc pl-4">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
          <p className="mt-4 text-xs text-navy/50">Scoring: identity 25 · portfolio 20 · opportunity 20 · technology 15 · decision-maker 10 · source quality 10. Weights are hypotheses to test.</p>
        </Card>

        <Card title={`Evidence (${research.length})`} className="lg:col-span-2">
          {research.length === 0 ? <Empty>No verified evidence yet. Run research or add a note.</Empty> : (
            <ul className="space-y-3">
              {research.map((r: { id: string; category: string | null; strength: number | null; observed_fact: string; evidence_excerpt: string; source_url: string; model_version: string | null; research_date: string }) => (
                <li key={r.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="purple">{r.category ?? "note"}</Badge><span className="text-xs text-navy/50">strength {r.strength ?? "—"} · {r.model_version === "manual" ? "manual" : "AI, verified against source"} · {fmtDate(r.research_date)}</span></div>
                  <p className="mt-1 font-medium text-navy">{r.observed_fact}</p>
                  <blockquote className="mt-1 border-l-2 border-slate-300 pl-3 text-navy/70">“{r.evidence_excerpt}”</blockquote>
                  <a className="mt-1 inline-block break-all text-xs text-purple hover:underline" href={r.source_url} target="_blank" rel="noopener noreferrer">{r.source_url}</a>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-purple">Add a research note manually</summary><div className="mt-3"><ResearchNoteForm companyId={company.id} /></div></details>
        </Card>
      </div>

      {suggestions.length > 0 && (
        <Card title={`Suggested addresses (${suggestions.length})`} className="mt-6">
          <p className="mb-3 text-xs text-navy/60">Found automatically on this company&apos;s own website. These are <strong>not contacts</strong> and cannot be emailed. Check the source, then add the ones you have a lawful basis to contact; each still needs a consent review.</p>
          <ul className="space-y-3">
            {suggestions.map((x: { id: string; email: string; source_url: string; evidence_excerpt: string; origin: string; confidence: number | null }) => (
              <li key={x.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-navy">{x.email} <span className="text-xs font-normal text-navy/50">· {x.origin === "hunter" ? `Hunter${x.confidence !== null ? ` (${x.confidence}% confidence)` : ""}` : "company website"}</span></p>
                <blockquote className="mt-1 border-l-2 border-slate-300 pl-3 text-navy/70">“{x.evidence_excerpt}”</blockquote>
                <a className="mt-1 inline-block break-all text-xs text-purple hover:underline" href={x.source_url} target="_blank" rel="noopener noreferrer">{x.source_url}</a>
                <div className="mt-2"><SuggestionControls suggestionId={x.id} /></div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Several contacts at this company" className="mt-6">
        <MultiContactToggle companyId={company.id} allowed={!!company.allow_multiple_contacts} />
      </Card>

      <Card title={`Contacts (${contacts.length})`} className="mt-6" action={<VerifyContactsButton contactIds={(contacts as { id: string }[]).map((c) => c.id)} />}>
        {contacts.length === 0 && <Empty>No contacts yet.</Empty>}
        <div className="space-y-4">
          {contacts.map((c: { id: string; name: string | null; role: string | null; email: string; source_url: string | null; source_type: string; status: string; acq_consent_records: ConsentRecord[] }) => {
            const evalResult = evaluateEligibility({ email: c.email, consents: c.acq_consent_records ?? [], suppressed: c.status === "suppressed" });
            const history = [...(c.acq_consent_records ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{c.name || c.email} {c.role && <span className="font-normal text-navy/50">· {c.role}</span>}</p>
                    <p className="text-sm text-navy/60">{c.email} <EmailCheckBadge check={checks[c.email.trim().toLowerCase()]} /> · {c.source_type.replace(/_/g, " ")}{c.source_url && <> · <a className="text-purple hover:underline" href={c.source_url} target="_blank" rel="noopener noreferrer">source</a></>}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                {!evalResult.eligible && evalResult.reasons.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">{evalResult.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                {history.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-navy/60">
                    {history.map((h, i) => <li key={i}>{fmtDate(String(h.created_at))} — <strong>{h.consent_type.replace(/_/g, " ")}</strong> reviewed by {h.reviewed_by ?? "nobody"}{h.evidence_url && <> · <a className="text-purple hover:underline" href={h.evidence_url} target="_blank" rel="noopener noreferrer">evidence</a></>}</li>)}
                  </ul>
                )}
                {c.status !== "suppressed" && (
                  <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-purple">Record consent review</summary><div className="mt-3"><ConsentForm contactId={c.id} /></div></details>
                )}
              </div>
            );
          })}
        </div>
        <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-purple">Add a contact</summary><div className="mt-3"><ContactForm companyId={company.id} /></div></details>
      </Card>
    </>
  );
}
