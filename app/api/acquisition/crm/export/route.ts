import { adminRoute } from "@/lib/acquisition/route";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";
import { EXPORT_HEADERS, csvCell } from "@/lib/crm/csv";

export const dynamic = "force-dynamic";

const MAX_ROWS = 20_000;

/** Every rep's leads as one CSV, with the owner. Cells are guarded against spreadsheet formula injection. */
export const GET = adminRoute("export crm leads", async (_request, { db }) => {
  const rows = must(
    await db
      .from("rep_leads")
      .select("full_name,email,phone,company_name,job_title,country,stage,status,estimated_deal_value,currency,expected_close_date,probability,tags,fit_score,engagement_score,last_activity_at,created_at, employees(full_name)")
      .is("anonymized_at", null)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    "export leads"
  ) as unknown as (Record<string, unknown> & { employees: { full_name: string } | null })[];
  const lines = [["Owner", ...EXPORT_HEADERS].map(csvCell).join(",")];
  for (const l of rows) {
    lines.push([l.employees?.full_name, l.full_name, l.email, l.phone, l.company_name, l.job_title, l.country, l.stage, l.status, l.estimated_deal_value, l.currency, l.expected_close_date, l.probability, Array.isArray(l.tags) ? l.tags.join("; ") : "", l.fit_score, l.engagement_score, l.last_activity_at, l.created_at].map(csvCell).join(","));
  }
  await logAudit(db, "crm.exported", "rep_lead", null, { rows: rows.length });
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="all-leads-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
});
