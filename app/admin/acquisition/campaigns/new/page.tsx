import { acqEnv } from "@/lib/acquisition/env";
import { Card, PageHeader } from "@/components/acquisition/ui";
import { CampaignForm } from "@/components/acquisition/forms";

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader title="New campaign" subtitle="Starter wording is provided; replace anything that isn't true for you. You approve the final text before anything can send." />
      <Card><CampaignForm maxDailyLimit={acqEnv().maxDailyLimit} /></Card>
    </>
  );
}
