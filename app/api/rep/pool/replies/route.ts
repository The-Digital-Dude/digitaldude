import { NextResponse } from "next/server";
import { repRoute } from "@/lib/repPool";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string | null;
  email: string;
  acq_companies: { name: string };
  acq_replies: { id: string; classification: string; body: string | null; received_at: string }[];
}

/** Recent replies from contacts at THIS rep's companies (out-of-office and bounce notices are left out). */
export const GET = repRoute("list replies", async (_request, { rep, db }) => {
  const { data, error } = await db
    .from("acq_contacts")
    .select("id,name,email, acq_companies!inner(name,owner_employee_id,status), acq_replies!inner(id,classification,body,received_at)")
    .eq("acq_companies.owner_employee_id", rep.id)
    .neq("acq_companies.status", "archived")
    .limit(200);
  if (error) throw new Error(error.message);
  const replies = ((data ?? []) as unknown as Row[])
    .flatMap((c) => c.acq_replies.map((r) => ({ id: r.id, classification: r.classification, body: (r.body ?? "").slice(0, 2000), receivedAt: r.received_at, contactName: c.name, contactEmail: c.email, companyName: c.acq_companies.name })))
    .filter((r) => r.classification !== "out_of_office" && r.classification !== "bounce")
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
    .slice(0, 30);
  return NextResponse.json({ ok: true, replies });
});
