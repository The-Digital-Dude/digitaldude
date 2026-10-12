import { listReplies } from "@/lib/acquisition/queries";
import { Badge, Card, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/acquisition/ui";
import { ReplyControls, SuggestReply } from "@/components/acquisition/forms";

export default async function InboxPage() {
  const replies = await listReplies();
  return (
    <>
      <PageHeader title="Inbox" subtitle="Any reply stops automation for that contact. Opt-outs are applied immediately. Nothing is sent automatically after a reply." />
      {replies.length === 0 ? <Card><Empty>No replies yet.</Empty></Card> : (
        <div className="space-y-4">
          {replies.map((r: { id: string; classification: string; confidence: number | null; classified_by: string; human_review_status: string; body: string | null; received_at: string; acq_contacts: { id: string; name: string | null; email: string; role: string | null; acq_companies: { name: string } | null } }) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy">{r.acq_contacts.name || r.acq_contacts.email} <span className="font-normal text-navy/50">· {r.acq_contacts.acq_companies?.name} · {fmtDate(r.received_at)}</span></p>
                <div className="flex items-center gap-2">
                  {r.human_review_status === "pending" && <Badge tone="amber">needs your review</Badge>}
                  <StatusBadge status={r.classification} />
                  <span className="text-xs text-navy/40">{r.classified_by}{r.confidence !== null ? ` ${Math.round(Number(r.confidence) * 100)}%` : ""}</span>
                </div>
              </div>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-navy/80">{r.body || "(empty)"}</pre>
              <div className="mt-3"><ReplyControls replyId={r.id} classification={r.classification} contactId={r.acq_contacts.id} canBook={r.classification === "interested"} /></div>
              <SuggestReply replyId={r.id} classification={r.classification} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
