import { fail, repContext } from "@/lib/crm/api";
import { EXPORT_HEADERS, IMPORT_TEMPLATE, csvCell } from "@/lib/crm/csv";

export const dynamic = "force-dynamic";

/** The rep's own leads as a CSV (or, with ?template=1, an empty import template). */
export async function GET(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;

    const headers = { "Content-Type": "text/csv; charset=utf-8", "Cache-Control": "no-store" };
    if (new URL(request.url).searchParams.get("template")) {
      return new Response(IMPORT_TEMPLATE, { headers: { ...headers, "Content-Disposition": 'attachment; filename="lead-import-template.csv"' } });
    }

    const { data, error } = await db.from("rep_leads").select("full_name,email,phone,company_name,job_title,country,stage,status,estimated_deal_value,currency,expected_close_date,probability,tags,fit_score,engagement_score,last_activity_at,created_at").eq("employee_id", rep.id).is("anonymized_at", null).order("created_at", { ascending: false }).limit(10_000);
    if (error) return fail(error.message, 500);

    const lines = [EXPORT_HEADERS.map(csvCell).join(",")];
    for (const l of (data ?? []) as Record<string, unknown>[]) {
      lines.push([l.full_name, l.email, l.phone, l.company_name, l.job_title, l.country, l.stage, l.status, l.estimated_deal_value, l.currency, l.expected_close_date, l.probability, Array.isArray(l.tags) ? l.tags.join("; ") : "", l.fit_score, l.engagement_score, l.last_activity_at, l.created_at].map(csvCell).join(","));
    }
    return new Response(`﻿${lines.join("\r\n")}\r\n`, { headers: { ...headers, "Content-Disposition": 'attachment; filename="my-leads.csv"' } });
  } catch {
    return fail("Export failed", 500);
  }
}
