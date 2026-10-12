import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign } from "@/lib/acquisition/queries";
import { acqEnv } from "@/lib/acquisition/env";
import { checkCampaignCompliance } from "@/lib/acquisition/compliance/templates";
import { Card, Empty, PageHeader, StatusBadge } from "@/components/acquisition/ui";
import { AddLeadsForm, CampaignActions, CampaignForm, DraftEditor } from "@/components/acquisition/forms";

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const data = await getCampaign(id);
  if (!data) notFound();
  const { campaign: c, leads, availableContacts } = data;
  const editable = c.status === "draft" || c.status === "rejected";
  const issues = checkCampaignCompliance(c);

  return (
    <>
      <p className="mb-2 text-sm"><Link className="text-purple hover:underline" href="/admin/acquisition/campaigns">← Campaigns</Link></p>
      <PageHeader title={c.name} subtitle={`Daily cap ${c.daily_limit} · ${c.followup_enabled ? `one follow-up after ${c.followup_delay_business_days} business days` : "no follow-up"}`} action={<StatusBadge status={c.status} />} />
      {c.rejection_reason && c.status === "rejected" && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"><strong>Rejected:</strong> {c.rejection_reason}</p>}
      {!["draft", "rejected"].includes(c.status) && <p className="mb-4 rounded-xl bg-lavender p-3 text-sm text-navy/80">Content is <strong>frozen</strong>. To change anything, revoke approval below; that re-opens the draft and requires a fresh approval.</p>}

      <Card title="Workflow" className="mb-6">
        <CampaignActions campaignId={c.id} status={c.status} />
        {c.status === "draft" && issues.length > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Fix before submitting:</p>
            <ul className="list-disc pl-5">{issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul>
          </div>
        )}
      </Card>

      {editable && <Card title="Campaign content" className="mb-6"><CampaignForm campaignId={c.id} maxDailyLimit={acqEnv().maxDailyLimit} initial={{ name: c.name, daily_limit: c.daily_limit, sender_name: c.sender_name, sender_business: c.sender_business, sender_postal_address: c.sender_postal_address, sender_email: c.sender_email, subject_template: c.subject_template, body_template: c.body_template, followup_enabled: c.followup_enabled, followup_delay_business_days: c.followup_delay_business_days, followup_body_template: c.followup_body_template, ai_compose: c.ai_compose }} /></Card>}

      {c.status === "draft" && (
        <Card title="Add recipients" className="mb-6">
          <p className="mb-3 text-sm text-navy/60">Only contacts with a reviewed consent basis appear here. Drafts use verified research only.</p>
          <AddLeadsForm campaignId={c.id} contacts={availableContacts} />
        </Card>
      )}

      <Card title={`Recipients & drafts (${leads.length})`}>
        {leads.length === 0 ? <Empty>No recipients yet.</Empty> : (
          <div className="space-y-5">
            {leads.map((l: { id: string; status: string; stop_reason: string | null; acq_contacts: { name: string | null; email: string; acq_companies: { name: string } | null }; acq_email_messages: { id: string; kind: string; direction: string; subject: string; body: string; status: string }[] }) => (
              <div key={l.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{l.acq_contacts.name || l.acq_contacts.email} <span className="font-normal text-navy/50">· {l.acq_contacts.acq_companies?.name} · {l.acq_contacts.email}</span></p>
                  <StatusBadge status={l.status} />
                </div>
                {l.stop_reason && <p className="mb-2 text-xs text-red-700">Stopped: {l.stop_reason}</p>}
                {l.acq_email_messages.filter((m) => m.direction === "outbound").map((m) => (
                  <DraftEditor key={m.id} messageId={m.id} subject={m.subject} body={m.body} editable={c.status === "draft" && m.status === "draft"} />
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
