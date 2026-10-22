import { NextResponse } from "next/server";
import { repRoute } from "@/lib/repPool";
import { loadChecks } from "@/lib/acquisition/verify/bulk";

export const dynamic = "force-dynamic";

/** Every contact at this rep's companies that still needs a lawful basis (so they can be drafted and confirmed together). */
export const GET = repRoute("contacts needing a basis", async (_request, { rep, db }) => {
  const { data, error } = await db
    .from("acq_contacts")
    .select("id,name,role,email,source_url,created_at, acq_companies!inner(id,name,country,owner_employee_id,status)")
    .eq("status", "needs_review")
    .eq("acq_companies.owner_employee_id", rep.id)
    .neq("acq_companies.status", "archived")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const checks = await loadChecks(db, ((data ?? []) as unknown as { email: string }[]).map((c) => c.email)).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);
  const contacts = ((data ?? []) as unknown as { id: string; name: string | null; role: string | null; email: string; source_url: string | null; acq_companies: { id: string; name: string; country: string | null } }[]).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    email: c.email,
    sourceUrl: c.source_url,
    companyId: c.acq_companies.id,
    companyName: c.acq_companies.name,
    country: c.acq_companies.country,
    emailCheck: checks[c.email.trim().toLowerCase()] ?? null,
  }));
  return NextResponse.json({ ok: true, contacts });
});
