import Link from "next/link";
import { listCompanies, listMarkets } from "@/lib/acquisition/queries";
import { Card, Empty, PageHeader, StatusBadge, Badge } from "@/components/acquisition/ui";
import { CompanyImportForm, DuplicateControls } from "@/components/acquisition/forms";
import { PoolTable } from "@/components/acquisition/pool";

const BAND: Record<string, { label: string; tone: "green" | "amber" | "slate" }> = {
  prioritize_review: { label: "Prioritise for review", tone: "green" },
  gather_evidence: { label: "Gather evidence", tone: "amber" },
  deprioritize: { label: "Deprioritise", tone: "slate" },
};

export default async function CompaniesPage() {
  const [all, markets] = await Promise.all([listCompanies(), listMarkets()]);
  const companies = all.filter((c: { status: string }) => c.status !== "archived");
  const byId = new Map<string, { id: string; name: string; domain: string | null }>(all.map((c: { id: string; name: string; domain: string | null }) => [c.id, c]));
  const dupes = companies.filter((c: { possible_duplicate_of: string | null }) => !!c.possible_duplicate_of) as { id: string; name: string; domain: string | null; possible_duplicate_of: string | null }[];
  return (
    <>
      <PageHeader title="Companies & contacts" subtitle="Scores come only from evidence that was verified against the source page. A high score never makes a contact eligible." />
      <Card title="Import" className="mb-6"><CompanyImportForm markets={markets as { id: string; name: string; country: string; industry: string }[]} /></Card>
      {dupes.length > 0 && (
        <Card title={`Possible duplicates (${dupes.length})`} className="mb-6">
          <p className="mb-3 text-xs text-navy/60">Same name and country as an older company, but a different website. Review each: merge it into the original, or confirm it is a different business.</p>
          <ul className="space-y-3">
            {dupes.map((d) => {
              const keeper = byId.get(d.possible_duplicate_of!);
              return (
                <li key={d.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm">
                  <p><Link className="font-semibold text-purple hover:underline" href={`/admin/acquisition/companies/${d.id}`}>{d.name}</Link> <span className="text-navy/50">({d.domain ?? "no website"})</span> looks like <strong>{keeper?.name ?? "an older company"}</strong> <span className="text-navy/50">({keeper?.domain ?? "no website"})</span></p>
                  <div className="mt-2"><DuplicateControls companyId={d.id} keeperId={d.possible_duplicate_of!} keeperName={keeper?.name ?? "the original"} /></div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <Card title="Lead pool">
        <p className="mb-3 text-xs text-navy/60">Every company, discovered or imported, in one place. Filter, select several and assign them to reps, change market, run research, export or archive. Scores come only from evidence verified against the source page, and a high score never makes a contact eligible.</p>
        <PoolTable markets={markets as { id: string; name: string; country: string }[]} />
      </Card>
    </>
  );
}
