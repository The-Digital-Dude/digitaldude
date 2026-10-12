import Link from "next/link";
import { listCompanies, listMarkets } from "@/lib/acquisition/queries";
import { Card, Empty, PageHeader, StatusBadge, Badge } from "@/components/acquisition/ui";
import { CompanyImportForm, DuplicateControls } from "@/components/acquisition/forms";

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
      <Card title={`Companies (${companies.length})`}>
        {companies.length === 0 ? <Empty>No companies yet. Import some above.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Company</th><th className="pr-4">Location</th><th className="pr-4">Fit</th><th className="pr-4">Status</th><th>Contacts</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c: { id: string; name: string; domain: string | null; state: string | null; suburb: string | null; fit_score: number | null; fit_band: string | null; status: string; source: string; country: string | null; region: string | null; possible_duplicate_of: string | null; acq_markets: { name: string } | null; acq_contacts: { count: number }[] }) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-4"><Link className="font-semibold text-purple hover:underline" href={`/admin/acquisition/companies/${c.id}`}>{c.name}</Link><div className="text-xs text-navy/50">{c.domain ?? "no website"}{c.source === "ai_discovery" && <> · <Badge tone="purple">AI discovered</Badge></>}{c.possible_duplicate_of && <> · <Badge tone="amber">possible duplicate</Badge></>}</div></td>
                    <td className="pr-4 text-navy/70">{[c.suburb, c.region ?? c.state, c.country].filter(Boolean).join(", ") || "—"}{c.acq_markets?.name && <div className="text-xs text-navy/50">{c.acq_markets.name}</div>}</td>
                    <td className="pr-4">{c.fit_score === null ? <span className="text-navy/40">not scored</span> : <span className="flex items-center gap-2"><strong>{c.fit_score}</strong>{c.fit_band && <Badge tone={BAND[c.fit_band].tone}>{BAND[c.fit_band].label}</Badge>}</span>}</td>
                    <td className="pr-4"><StatusBadge status={c.status} /></td>
                    <td>{c.acq_contacts?.[0]?.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
