import { getDb } from "@/lib/acquisition/db";
import { loadReports, POOL_ORDER } from "@/lib/acquisition/reports";
import { Card, Empty, PageHeader, Stat } from "@/components/acquisition/ui";

export const dynamic = "force-dynamic";

const label = (s: string) => s.replace(/_/g, " ");

export default async function ReportsPage() {
  const r = await loadReports(getDb());
  return (
    <>
      <PageHeader title="Pool reports" subtitle="How the lead pool is moving: by market, by rep, discovery yield and tool usage. Counts exclude archived companies." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Companies in pool" value={r.totals.companies} hint={`${r.totals.unowned} unowned`} />
        <Stat label="Contact lookups today" value={r.usage.contactLookupsToday} hint={`${r.usage.contactLookups30d} in 30 days`} />
        <Stat label="AI research runs (30d)" value={r.usage.researchOk30d} hint={`${r.usage.researchFailed30d} failed`} />
        <Stat label="Discovery runs (30d)" value={r.usage.discoveryRuns30d} />
      </div>

      <Card title="Funnel by market" className="mt-6">
        {r.funnel.length === 0 ? <Empty>No companies yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Market</th><th className="pr-3">Total</th>{POOL_ORDER.map((s) => <th key={s} className="pr-3">{label(s)}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {r.funnel.map((f) => (
                  <tr key={f.market}><td className="py-2 pr-4 font-semibold">{f.market}</td><td className="pr-3 font-bold">{f.total}</td>{POOL_ORDER.map((s) => <td key={s} className="pr-3 text-navy/70">{f.byStatus[s] ?? 0}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="By rep" className="mt-6">
        {r.leaderboard.length === 0 ? <Empty>No reps yet.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Rep</th><th className="pr-3">Owned</th><th className="pr-3">Open</th><th className="pr-3">Needs contact</th><th className="pr-3">Contacted+</th><th className="pr-3">Meetings</th><th className="pr-3">Won</th><th className="pr-3">Cleared contacts</th><th className="pr-3">Emails (30d)</th><th>Bookings (90d)</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {r.leaderboard.map((x) => (
                  <tr key={x.id}>
                    <td className="py-2 pr-4 font-semibold">{x.name}{x.status === "offboarded" && <span className="ml-2 text-xs font-normal text-navy/40">offboarded</span>}</td>
                    <td className="pr-3">{x.owned}</td><td className="pr-3">{x.open}</td><td className="pr-3">{x.needsContact}</td><td className="pr-3">{x.contacted}</td>
                    <td className="pr-3">{x.meetings}</td><td className="pr-3">{x.won}</td><td className="pr-3">{x.eligibleContacts}</td><td className="pr-3">{x.emails30d}</td>
                    <td>{x.bookings}{x.poolBookings > 0 && <span className="text-xs text-navy/50"> ({x.poolBookings} via pool)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Discovery yield (last 30 days)" className="mt-6">
        {r.yield.length === 0 ? <Empty>No AI-discovered companies in the last 30 days.</Empty> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Market</th><th className="pr-3">Discovered</th><th className="pr-3">Researched</th><th className="pr-3">Good fit</th><th className="pr-3">With a contact</th><th>Shelved</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {r.yield.map((y) => <tr key={y.market}><td className="py-2 pr-4 font-semibold">{y.market}</td><td className="pr-3">{y.discovered}</td><td className="pr-3">{y.researched}</td><td className="pr-3">{y.goodFit}</td><td className="pr-3">{y.withContact}</td><td>{y.deprioritized}</td></tr>)}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
