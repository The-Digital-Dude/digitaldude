import { listAssignmentRules, listCountryRules, listMarkets, listRepMarkets, listRepsForPool } from "@/lib/acquisition/queries";
import { RepAccessCard, RulesCard } from "@/components/acquisition/pool";
import { Badge, Card, Empty, PageHeader } from "@/components/acquisition/ui";
import { CountryRuleForm, CountryToggle, MarketForm, MarketToggle } from "@/components/acquisition/forms";

interface Market { id: string; name: string; industry: string; country: string; search_phrases: string[]; places: string[]; domain_suffixes: string[]; enabled: boolean; qualification_text: string }
interface Rule { country: string; name: string; email_allowed: boolean; requires_postal_address: boolean; notes: string }

export default async function MarketsPage() {
  const [markets, rules, reps, grants, assignRules] = await Promise.all([listMarkets() as Promise<Market[]>, listCountryRules() as Promise<Rule[]>, listRepsForPool(), listRepMarkets(), listAssignmentRules()]);
  const allowed = new Map(rules.map((r) => [r.country, r.email_allowed]));
  return (
    <>
      <PageHeader title="Markets & countries" subtitle="A market is an industry in a country. Daily discovery and AI research run for every enabled market. Each country has an email rule; countries without an enabled rule are blocked from outreach." />

      <Card title={`Markets (${markets.length})`} className="mb-6">
        {markets.length === 0 ? <Empty>No markets yet. Create one below.</Empty> : (
          <div className="space-y-3">
            {markets.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{m.name} <Badge tone={m.enabled ? "green" : "slate"}>{m.enabled ? "enabled" : "disabled"}</Badge> <Badge tone={allowed.get(m.country) ? "green" : "amber"}>{m.country}: {allowed.get(m.country) ? "email allowed" : "email blocked"}</Badge></p>
                    <p className="text-sm text-navy/60">{m.industry}{m.domain_suffixes.length > 0 && <> · sites ending {m.domain_suffixes.join(", ")}</>}</p>
                  </div>
                  <MarketToggle id={m.id} enabled={m.enabled} />
                </div>
                <p className="mt-2 text-xs text-navy/60"><strong>Searches:</strong> {m.search_phrases.join(" · ") || "none"}{m.places.length > 0 && <> in {m.places.slice(0, 6).join(", ")}{m.places.length > 6 && ` +${m.places.length - 6} more`}</>}</p>
                {m.qualification_text && <p className="mt-1 text-xs text-navy/60"><strong>Good fit:</strong> {m.qualification_text}</p>}
              </div>
            ))}
          </div>
        )}
        <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-purple">Add a market</summary><div className="mt-3"><MarketForm /></div></details>
      </Card>

      <Card title="Rep access to markets" className="mb-6">
        <RepAccessCard reps={reps as never} markets={markets} grants={grants as never} />
      </Card>

      <Card title="Auto-assignment rules" className="mb-6">
        <RulesCard reps={reps as never} markets={markets} rules={assignRules as never} />
      </Card>

      <Card title="Country email rules">
        <p className="mb-3 text-xs text-navy/60">Outreach to a country is allowed only when its rule is enabled. These notes are a starting point, not legal advice; confirm the rules for your situation before enabling a country.</p>
        {rules.length === 0 ? <Empty>No rules.</Empty> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-navy/50"><tr><th className="py-2 pr-4">Country</th><th className="pr-4">Status</th><th className="pr-4">Footer address</th><th className="pr-4">Rule notes</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.country}>
                  <td className="py-2 pr-4 font-semibold">{r.name} ({r.country})</td>
                  <td className="pr-4"><Badge tone={r.email_allowed ? "green" : "amber"}>{r.email_allowed ? "allowed" : "blocked"}</Badge></td>
                  <td className="pr-4">{r.requires_postal_address ? "required" : "—"}</td>
                  <td className="pr-4 text-xs text-navy/60">{r.notes}</td>
                  <td><CountryToggle country={r.country} name={r.name} allowed={r.email_allowed} requiresPostal={r.requires_postal_address} notes={r.notes} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-purple">Enable another country</summary><div className="mt-3"><CountryRuleForm /></div></details>
      </Card>
    </>
  );
}
