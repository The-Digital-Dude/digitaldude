import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { importCompaniesBody } from "@/lib/acquisition/validation";
import { normalizeDomain } from "@/lib/acquisition/normalize";
import { must, UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list companies", async (_req, { db }) => {
  const companies = must(await db.from("acq_companies").select("*").order("created_at", { ascending: false }).limit(500), "list companies");
  return NextResponse.json({ ok: true, companies });
});

/** Manual import (single or bulk). De-duplicates on website domain, else on name. */
export const POST = adminRoute("import companies", async (request, { db }) => {
  const body = await parseBody(request, importCompaniesBody);
  if ("error" in body) return body.error;

  const result = { created: 0, duplicates: [] as string[], errors: [] as { name: string; error: string }[] };
  for (const c of body.data.companies) {
    const domain = normalizeDomain(c.website);
    if (c.website && !domain) {
      result.errors.push({ name: c.name, error: "Website is not a valid domain" });
      continue;
    }
    if (!domain) {
      const { data: byName } = await db.from("acq_companies").select("id").ilike("name", c.name.replace(/[%_]/g, "\\$&")).limit(1);
      if (byName?.length) {
        result.duplicates.push(c.name);
        continue;
      }
    }
    const { data, error } = await db
      .from("acq_companies")
      .insert({ name: c.name, website: c.website ?? null, domain, state: c.state ?? null, suburb: c.suburb ?? null, property_portfolio_evidence: c.property_portfolio_evidence ?? null })
      .select("id")
      .single();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) result.duplicates.push(c.name);
      else result.errors.push({ name: c.name, error: error.message });
      continue;
    }
    result.created++;
    await logAudit(db, "company.imported", "company", data.id, { name: c.name });
  }
  return NextResponse.json({ ok: true, ...result }, { status: result.created ? 201 : 200 });
});
