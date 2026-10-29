import { Suspense } from "react";
import { PageHeader } from "@/components/acquisition/ui";
import { SendLimits } from "@/components/acquisition/SendLimits";

export const dynamic = "force-dynamic";

export default function SendingLimitsPage() {
  return (
    <>
      <PageHeader title="Sending limits" subtitle="How many cold emails and follow-ups each rep can send a day. Cold and follow-ups are limited separately so follow-ups never go overdue because of cold outreach, and limits can rise gradually as a rep ramps up." />
      <Suspense fallback={null}>
        <SendLimits />
      </Suspense>
    </>
  );
}
