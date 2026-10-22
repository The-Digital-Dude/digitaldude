import { getDb } from "@/lib/acquisition/db";
import { PageHeader } from "@/components/acquisition/ui";
import { CrmAdmin } from "@/components/acquisition/CrmAdmin";
import { loadCrmReport } from "@/lib/crm/report";
import { loadCrmSettings } from "@/lib/crm/settings";

export const dynamic = "force-dynamic";

export default async function RepCrmPage() {
  const db = getDb();
  const [report, settings, { data: reps }] = await Promise.all([
    loadCrmReport(db),
    loadCrmSettings(db),
    db.from("employees").select("id,full_name").neq("status", "offboarded").order("full_name"),
  ]);
  return (
    <>
      <PageHeader title="Rep CRM" subtitle="Every rep's leads in one place: how the pipeline looks, which leads have gone quiet, and tools to search, reassign and merge. Rules for alerts, forecasts and data retention are set here." />
      <CrmAdmin report={report} reps={(reps ?? []) as { id: string; full_name: string }[]} settings={settings} />
    </>
  );
}
