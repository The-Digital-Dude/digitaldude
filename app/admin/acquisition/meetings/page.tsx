import { listMeetings } from "@/lib/acquisition/queries";
import { Card, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/acquisition/ui";

export default async function MeetingsPage() {
  const meetings = await listMeetings();
  return (
    <>
      <PageHeader title="Meetings" subtitle="Booking links you've offered to interested prospects. Booking never overrides an opt-out." />
      <Card>
        {meetings.length === 0 ? <Empty>No meetings yet. Offer a booking link from the inbox.</Empty> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Contact</th><th className="pr-4">Status</th><th className="pr-4">Offered</th><th>Scheduled</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {meetings.map((m: { id: string; status: string; created_at: string; scheduled_at: string | null; acq_contacts: { name: string | null; email: string; acq_companies: { name: string } | null } }) => (
                <tr key={m.id}><td className="py-2 pr-4 font-semibold text-navy">{m.acq_contacts.name || m.acq_contacts.email} <span className="font-normal text-navy/50">· {m.acq_contacts.acq_companies?.name}</span></td><td className="pr-4"><StatusBadge status={m.status} /></td><td className="pr-4 text-navy/60">{fmtDate(m.created_at)}</td><td className="text-navy/60">{fmtDate(m.scheduled_at)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
