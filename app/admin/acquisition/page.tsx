import Link from "next/link";
import { attentionItems, dashboardStats } from "@/lib/acquisition/queries";
import { Card, PageHeader, Stat } from "@/components/acquisition/ui";
import { RunWorkerButton } from "@/components/acquisition/forms";
import { ActionButton } from "@/components/acquisition/client";

const pct = (n: number, d: number) => (d === 0 ? "—" : `${Math.round((n / d) * 100)}%`);

export default async function AcquisitionDashboard() {
  const [s, a] = await Promise.all([dashboardStats(), attentionItems()]);
  const todo: { label: string; n: number; href: string; hint: string }[] = [
    { label: "Contacts needing a lawful basis", n: a.needsReview, href: "/admin/acquisition/companies", hint: "Cannot be emailed until reviewed" },
    { label: "Replies to review", n: a.repliesPending, href: "/admin/acquisition/inbox", hint: "Interested or unclear replies" },
    { label: "Unassigned companies", n: a.unassigned, href: "/admin/acquisition/companies", hint: "Waiting in the pool for a rep" },
    { label: "Companies needing a contact", n: a.noContact, href: "/admin/acquisition/companies", hint: "Reps are finding contacts" },
    { label: "Failed jobs (24h)", n: a.failedJobs, href: "/admin/acquisition/settings", hint: "Check the AI key and sources" },
  ].filter((t) => t.n > 0);
  const workerStale = a.workerAgeMin !== null && a.workerAgeMin > 30;
  return (
    <>
      <PageHeader title="Client acquisition" subtitle="Markets, companies and contacts · research, review, approve. Nothing sends without an approved campaign, a reviewed consent basis and a clean suppression check." action={<RunWorkerButton />} />

      {s.sendingPaused ? (
        <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-900">Sending is <strong>paused</strong> (the default). <Link className="underline" href="/admin/acquisition/settings">Safety & settings</Link></p>
      ) : (
        <p className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900">Sending is <strong>enabled</strong> for approved, active campaigns. <Link className="underline" href="/admin/acquisition/settings">Pause</Link></p>
      )}
      {s.failedJobs > 0 && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">{s.failedJobs} background job(s) failed permanently. <Link className="underline" href="/admin/acquisition/settings">Review</Link></p>}

      {workerStale && <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">The background worker has not run for {a.workerAgeMin} minutes (it should run every 10). Check the Supabase cron job and that CRON_SECRET matches Vercel.</p>}

      <Card title="Needs your attention" className="mb-6" action={a.unread > 0 ? <ActionButton url="/api/acquisition/notifications/read" variant="ghost">Mark {a.unread} read</ActionButton> : undefined}>
        {todo.length === 0 && a.recent.length === 0 ? (
          <p className="text-sm text-navy/60">Nothing needs you right now.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="space-y-2 text-sm">
              {todo.length === 0 && <li className="text-navy/60">No open to-dos.</li>}
              {todo.map((t) => (
                <li key={t.label}><Link className="font-semibold text-purple underline" href={t.href}>{t.n} · {t.label}</Link> <span className="text-navy/50">— {t.hint}</span></li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm">
              {a.recent.length === 0 && <li className="text-navy/60">No notifications yet.</li>}
              {a.recent.map((n) => (
                <li key={n.id} className={n.read_at ? "text-navy/50" : "text-navy"}>
                  {n.link ? <Link className="font-semibold underline" href={n.link}>{n.title}</Link> : <span className="font-semibold">{n.title}</span>}
                  <span className="ml-2 text-xs text-navy/40">{new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Companies researched" value={s.researched} hint={`${s.companies} total`} href="/admin/acquisition/companies" />
        <Stat label="Eligible contacts" value={s.eligible} hint={`${s.contacts} total`} href="/admin/acquisition/companies" />
        <Stat label="Awaiting approval" value={s.pendingApprovalCampaigns} hint={`${s.draftMessages} draft emails`} href="/admin/acquisition/approvals" />
        <Stat label="Replies to review" value={s.repliesToReview} hint={`${s.positive} positive`} href="/admin/acquisition/inbox" />
        <Stat label="Meetings offered" value={s.meetings} hint={`${s.scheduled} booked`} href="/admin/acquisition/meetings" />
        <Stat label="Queued jobs" value={s.pendingJobs} />
        <Stat label="Emails sent" value={s.sent} />
        <Stat label="Failed jobs" value={s.failedJobs} />
      </div>

      <Card title="30-day pilot scorecard" className="mt-6">
        <p className="mb-4 text-sm text-navy/60">The goal of the first month is a reliable, evidence-based process — not a closed deal.</p>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Research quality", pct(s.goodFit, s.researched), "researched companies scoring 50+"],
            ["Eligibility quality", pct(s.eligible, s.contacts), "contacts with reviewed, documented evidence"],
            ["Deliverability", s.sent ? pct(s.bounced, s.sent) : "—", "bounce rate (lower is better)"],
            ["Conversation quality", pct(s.positive, s.replies), "replies that are positive"],
            ["Sales outcomes", String(s.scheduled), "discovery calls booked / attended"],
            ["Efficiency", "—", "track research time per lead manually for now"],
          ].map(([k, v, hint]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-navy/50">{k}</dt>
              <dd className="text-xl font-extrabold text-navy">{v}</dd>
              <dd className="text-xs text-navy/50">{hint}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Suggested order of work" className="mt-6">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-navy/80">
          <li><Link className="text-purple underline" href="/admin/acquisition/companies">Import companies</Link>, then run research (or add notes by hand).</li>
          <li>Add a contact for each and record your <strong>consent review</strong>. Unverified contacts are blocked from every campaign.</li>
          <li><Link className="text-purple underline" href="/admin/acquisition/campaigns/new">Create a campaign</Link>, add eligible contacts, edit the drafts.</li>
          <li>Submit, then <Link className="text-purple underline" href="/admin/acquisition/approvals">approve</Link> to freeze the exact content you reviewed.</li>
        </ol>
      </Card>
    </>
  );
}
