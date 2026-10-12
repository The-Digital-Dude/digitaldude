import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { marketInput } from "@/lib/acquisition/validation";
import { must, UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

export const GET = adminRoute("list markets", async (_req, { db }) => {
  const markets = must(await db.from("acq_markets").select("*").order("created_at", { ascending: true }), "list markets");
  return NextResponse.json({ ok: true, markets });
});

/** Create a Market: an industry in a country with its own search phrases, places and AI qualification text. */
export const POST = adminRoute("create market", async (request, { db }) => {
  const body = await parseBody(request, marketInput);
  if ("error" in body) return body.error;
  const { data, error } = await db.from("acq_markets").insert(body.data).select("id").single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return jsonError("A market with this name already exists", 409);
    throw new Error(error.message);
  }
  await logAudit(db, "market.created", "market", data.id, { name: body.data.name, country: body.data.country });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
});
