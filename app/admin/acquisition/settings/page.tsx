import { settingsOverview } from "@/lib/acquisition/queries";
import { Badge, Card, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/acquisition/ui";
import { AiSettingsCard, AutoResearchToggle, SecretKeyCard, SenderIdentityCard, Checklist, PauseToggle, SuppressionForm } from "@/components/acquisition/forms";

export default async function SettingsPage() {
  const s = await settingsOverview();
  return (
    <>
      <PageHeader title="Safety & settings" subtitle="Global pause, suppression list, configuration status and the pilot launch checklist." />

      <Card title="Emergency pause" className="mb-6">
        <p className="mb-3 text-sm text-navy/70">Sending is currently <strong>{s.sendingPaused ? "PAUSED" : "ENABLED"}</strong>. The pause is checked inside the database transaction of every send, so it takes effect on the very next attempt. Daily limit ceiling: {s.maxDailyLimit} (ACQ_MAX_DAILY_LIMIT).</p>
        <PauseToggle paused={s.sendingPaused} />
      </Card>

      <Card title="Sender identity (rep email footer)" className="mb-6"><SenderIdentityCard business={s.identity.business} postalAddress={s.identity.postalAddress} /></Card>

      <Card title="AI provider (API key)" className="mb-6"><AiSettingsCard status={s.ai} /></Card>

      <Card title="Contact finder & web search keys" className="mb-6">
        <div className="space-y-4">
          <SecretKeyCard name="hunter" title="Hunter.io (contact finder)" help="Finds published business email addresses for a company's domain. Results are only suggestions that a person must accept and justify. The free plan allows a limited number of searches a month; lookups are cached for 30 days and capped daily." status={s.secrets.hunter} />
          <SecretKeyCard name="brave" title="Brave Search (company discovery)" help="Used by the daily discovery run to find new companies for your markets." status={s.secrets.brave} />
        </div>
      </Card>

      <Card title="Automatic discovery & research" className="mb-6">
        <p className="mb-3 text-sm text-navy/70">Auto research is currently <strong>{s.autoResearchEnabled ? "ON" : "OFF"}</strong>. When on, each day the system searches for Australian property managers, adds new companies, researches them, and suggests published business addresses for you to review. It never emails anyone. Needs the AI and search keys below.</p>
        <AutoResearchToggle enabled={s.autoResearchEnabled} />
      </Card>

      <Card title="Configuration (values are never shown)" className="mb-6">
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(s.config).map(([k, ok]) => <li key={k} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"><span>{k}</span><Badge tone={ok ? "green" : "amber"}>{ok ? "configured" : "not set"}</Badge></li>)}
        </ul>
        <p className="mt-3 text-xs text-navy/50">Acting as: <code>{s.operator}</code> (recorded in the audit log). Sending uses Brevo for initial emails only (follow-ups are not built). With an allowlist set, only listed recipients can receive email.</p>
      </Card>

      <Card title="Pilot launch checklist" className="mb-6"><Checklist /></Card>

      <Card title={`Suppression list (${s.suppressions.length})`} className="mb-6">
        <p className="mb-3 text-sm text-navy/70">Permanent. Suppressions can be added here but never removed from the app, so a deleted or re-imported lead is never contacted again.</p>
        <SuppressionForm />
        {s.suppressions.length === 0 ? <div className="mt-4"><Empty>No suppressions.</Empty></div> : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Target</th><th className="pr-4">Reason</th><th className="pr-4">Source</th><th>Added</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {s.suppressions.map((x: { id: string; normalized_email: string | null; company_domain: string | null; reason: string; source: string | null; created_at: string }) => (
                <tr key={x.id}><td className="py-2 pr-4 font-medium">{x.normalized_email ?? `@${x.company_domain}`}</td><td className="pr-4">{x.reason.replace(/_/g, " ")}</td><td className="pr-4 text-navy/60">{x.source}</td><td className="text-navy/60">{fmtDate(x.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Open jobs">
          {s.jobs.length === 0 ? <Empty>No pending or failed jobs.</Empty> : (
            <ul className="space-y-2 text-sm">{s.jobs.map((j: { id: string; type: string; status: string; attempts: number; last_error: string | null }) => <li key={j.id}><StatusBadge status={j.status} /> <strong>{j.type}</strong> · attempt {j.attempts}{j.last_error && <span className="block text-xs text-red-700">{j.last_error}</span>}</li>)}</ul>
          )}
        </Card>
        <Card title="Recent audit log">
          {s.audit.length === 0 ? <Empty>Nothing yet.</Empty> : (
            <ul className="space-y-1 text-xs text-navy/70">{s.audit.map((a: { id: string; action: string; actor_id: string; created_at: string; entity_type: string }) => <li key={a.id}><span className="text-navy/40">{fmtDate(a.created_at)}</span> · <strong>{a.action}</strong> · {a.entity_type} · {a.actor_id}</li>)}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
