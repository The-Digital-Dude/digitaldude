import { pendingApprovals } from "@/lib/acquisition/queries";
import { checkCampaignCompliance } from "@/lib/acquisition/compliance/templates";
import { Badge, Card, Empty, EmailCheckBadge, PageHeader, StatusBadge } from "@/components/acquisition/ui";
import { getDb } from "@/lib/acquisition/db";
import { loadChecks } from "@/lib/acquisition/verify/bulk";
import { ApprovalControls } from "@/components/acquisition/forms";

export default async function ApprovalsPage() {
  const items = await pendingApprovals();
  const checks = await loadChecks(getDb(), items.flatMap((i) => i.leads.map((l: { acq_contacts: { email: string } }) => l.acq_contacts.email))).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);
  return (
    <>
      <PageHeader title="Campaign approvals" subtitle="Review the segment, the evidence, each message and the safeguards. Approving freezes this exact version." />
      {items.length === 0 && <Card><Empty>Nothing is waiting for approval.</Empty></Card>}
      <div className="space-y-8">
        {items.map(({ campaign: c, leads, contentHash, research, consent }) => {
          const issues = checkCampaignCompliance(c);
          return (
            <Card key={c.id} title={c.name} action={<StatusBadge status={c.status} />}>
              <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs font-bold uppercase text-navy/50">Recipients</p><p className="text-lg font-extrabold">{leads.length}</p></div>
                <div><p className="text-xs font-bold uppercase text-navy/50">Daily cap</p><p className="text-lg font-extrabold">{c.daily_limit}</p></div>
                <div><p className="text-xs font-bold uppercase text-navy/50">Follow-up</p><p className="font-semibold">{c.followup_enabled ? `One, after ${c.followup_delay_business_days} business days, only if still eligible and no reply` : "None"}</p></div>
                <div><p className="text-xs font-bold uppercase text-navy/50">Sender</p><p className="font-semibold">{c.sender_name}, {c.sender_business}</p><p className="text-xs text-navy/60">{c.sender_postal_address} · {c.sender_email}</p></div>
              </div>
              {issues.length > 0 && <ul className="mt-4 list-disc rounded-lg bg-red-50 p-3 pl-8 text-sm text-red-800">{issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul>}

              <h3 className="mb-2 mt-6 text-sm font-bold text-navy">Messages, evidence and basis for each recipient</h3>
              <div className="space-y-4">
                {leads.map((l: { id: string; contact_id: string; followup_body: string | null; followup_subject: string | null; acq_contacts: { name: string | null; email: string; acq_companies: { id: string; name: string } | null }; acq_email_messages: { id: string; kind: string; direction: string; subject: string; body: string }[] }) => {
                  const basis = consent.find((x: { contact_id: string }) => x.contact_id === l.contact_id);
                  const facts = research.filter((r: { company_id: string }) => r.company_id === l.acq_contacts.acq_companies?.id).slice(0, 3);
                  return (
                    <div key={l.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-navy">{l.acq_contacts.name || l.acq_contacts.email} <span className="font-normal text-navy/50">· {l.acq_contacts.acq_companies?.name} · {l.acq_contacts.email}</span> <EmailCheckBadge check={checks[l.acq_contacts.email.trim().toLowerCase()]} /></p>
                      {basis ? (
                        <p className="mt-1 text-xs text-navy/60"><Badge tone="green">{basis.consent_type.replace(/_/g, " ")}</Badge> reviewed by {basis.reviewed_by} · {basis.legal_basis}{basis.evidence_url && <> · <a className="text-purple hover:underline" href={basis.evidence_url} target="_blank" rel="noopener noreferrer">evidence</a></>}</p>
                      ) : <p className="mt-1 text-xs text-red-700">No consent record found!</p>}
                      {facts.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-xs text-navy/70">{facts.map((f: { observed_fact: string; source_url: string }, i: number) => <li key={i}>{f.observed_fact} — <a className="text-purple hover:underline" href={f.source_url} target="_blank" rel="noopener noreferrer">source</a></li>)}</ul>
                      )}
                      {l.acq_email_messages.filter((m) => m.kind === "initial" && m.direction === "outbound").map((m) => (
                        <div key={m.id} className="mt-3"><p className="text-sm font-semibold">{m.subject}</p><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-navy/80">{m.body}</pre></div>
                      ))}
                      {l.followup_body && (
                        <div className="mt-3"><p className="text-xs font-bold uppercase text-navy/50">Follow-up for this recipient (approved with the first email)</p><p className="mt-1 text-sm font-semibold">{l.followup_subject}</p><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-navy/80">{l.followup_body}</pre></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {c.followup_enabled && <div className="mt-5"><p className="text-sm font-bold text-navy">Follow-up template</p><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-navy/80">{c.followup_body_template}</pre></div>}

              <div className="mt-6 border-t border-slate-200 pt-5">
                {contentHash && issues.length === 0 ? <ApprovalControls campaignId={c.id} contentHash={contentHash} /> : <p className="text-sm text-red-700">Cannot approve until the issues above are fixed.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
