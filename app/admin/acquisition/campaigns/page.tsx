import Link from "next/link";
import { listCampaigns } from "@/lib/acquisition/queries";
import { Card, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/acquisition/ui";
import { btnCls } from "@/components/acquisition/ui";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  return (
    <>
      <PageHeader title="Campaigns" subtitle="Pilot: one approved initial message, at most one follow-up, a small daily cap." action={<Link className={btnCls} href="/admin/acquisition/campaigns/new">New campaign</Link>} />
      <Card>
        {campaigns.length === 0 ? <Empty>No campaigns yet.</Empty> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Name</th><th className="pr-4">Status</th><th className="pr-4">Recipients</th><th className="pr-4">Daily cap</th><th>Created</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c: { id: string; name: string; status: string; daily_limit: number; created_at: string; acq_campaign_leads: { count: number }[] }) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4"><Link className="font-semibold text-purple hover:underline" href={`/admin/acquisition/campaigns/${c.id}`}>{c.name}</Link></td>
                  <td className="pr-4"><StatusBadge status={c.status} /></td>
                  <td className="pr-4">{c.acq_campaign_leads?.[0]?.count ?? 0}</td>
                  <td className="pr-4">{c.daily_limit}</td>
                  <td className="text-navy/60">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
