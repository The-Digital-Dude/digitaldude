import { getDb, must } from "@/lib/acquisition/db";
import { Card, Empty, PageHeader } from "@/components/acquisition/ui";
import { BulkSuggestions, type SuggestionRow } from "@/components/acquisition/BulkSuggestions";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const db = getDb();
  const rows = must(
    await db
      .from("acq_contact_suggestions")
      .select("id,email,name,role,source_url,evidence_excerpt,origin,confidence,company_id, acq_companies(name,owner_employee_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(300),
    "suggestions"
  ) as unknown as (Omit<SuggestionRow, "company_name" | "owner_name"> & { acq_companies: { name: string; owner_employee_id: string | null } | null })[];

  const ownerIds = [...new Set(rows.map((r) => r.acq_companies?.owner_employee_id).filter((x): x is string => !!x))];
  const owners = new Map<string, string>();
  if (ownerIds.length) {
    const { data } = await db.from("employees").select("id,full_name").in("id", ownerIds);
    for (const e of (data ?? []) as { id: string; full_name: string }[]) owners.set(e.id, e.full_name);
  }
  const list: SuggestionRow[] = rows.map((r) => ({
    id: r.id, email: r.email, name: r.name, role: r.role, source_url: r.source_url, evidence_excerpt: r.evidence_excerpt, origin: r.origin, confidence: r.confidence,
    company_id: r.company_id, company_name: r.acq_companies?.name ?? "Unknown company", owner_name: r.acq_companies?.owner_employee_id ? (owners.get(r.acq_companies.owner_employee_id) ?? null) : null,
  }));

  return (
    <>
      <PageHeader title="Suggested addresses" subtitle="Addresses found on company websites or by the contact finder. They are only suggestions: accepting one creates a contact that still needs a lawful basis before anyone can email it. If a rep owns the company, it also appears in their Leads CRM." />
      <Card title={`Pending (${list.length})`}>
        {list.length === 0 ? <Empty>No suggestions waiting. Use “Find contacts” in the Companies list to look for some.</Empty> : <BulkSuggestions rows={list} />}
      </Card>
    </>
  );
}
