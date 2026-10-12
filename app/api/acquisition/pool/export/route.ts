import { adminRoute } from "@/lib/acquisition/route";
import { CSV_HEADERS, applyPoolFilters, csvCell, parsePoolFilters } from "@/lib/acquisition/pool";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

/** CSV of everything matching the current filters (up to 5,000 rows). Cells are guarded against spreadsheet formula injection. */
export const GET = adminRoute("export pool", async (request, { db }) => {
  const f = parsePoolFilters(new URL(request.url).searchParams);
  const rows = must(
    await applyPoolFilters(
      db.from("acq_companies").select("name,website,country,region,industry,fit_score,pool_status,owner_employee_id,contact_count,source,linkedin_url,created_at, acq_markets(name)"),
      f
    )
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    "export pool"
  ) as unknown as Record<string, unknown>[];

  const owners = new Map<string, string>();
  const ownerIds = [...new Set(rows.map((r) => r.owner_employee_id as string | null).filter((x): x is string => !!x))];
  if (ownerIds.length) {
    const { data } = await db.from("employees").select("id,full_name").in("id", ownerIds);
    for (const e of data ?? []) owners.set(e.id as string, e.full_name as string);
  }

  const lines = [CSV_HEADERS.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name, r.website, r.country, r.region, r.industry, (r.acq_markets as { name: string } | null)?.name, r.fit_score, r.pool_status,
        r.owner_employee_id ? owners.get(r.owner_employee_id as string) ?? "" : "", r.contact_count, r.source, r.linkedin_url, String(r.created_at ?? "").slice(0, 10),
      ].map(csvCell).join(",")
    );
  }
  await logAudit(db, "pool.exported", "pool", null, { rows: rows.length });
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="lead-pool-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
});
