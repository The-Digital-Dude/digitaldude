import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { suppressionBody } from "@/lib/acquisition/validation";
import { suppressDomain, suppressEmail } from "@/lib/acquisition/compliance/suppression";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list suppressions", async (_req, { db }) => {
  const rows = must(await db.from("acq_suppressions").select("*").order("created_at", { ascending: false }).limit(500), "list suppressions");
  return NextResponse.json({ ok: true, suppressions: rows });
});

/** Add only. There is intentionally no endpoint (or code path) that removes a suppression. */
export const POST = adminRoute("add suppression", async (request, { db }) => {
  const body = await parseBody(request, suppressionBody);
  if ("error" in body) return body.error;
  if (body.data.email) await suppressEmail(db, body.data.email, body.data.reason, "admin");
  if (body.data.domain) await suppressDomain(db, body.data.domain, body.data.reason, "admin");
  return NextResponse.json({ ok: true }, { status: 201 });
});
