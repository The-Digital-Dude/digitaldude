import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { marketPatch } from "@/lib/acquisition/validation";
import { UNIQUE_VIOLATION } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

export const PATCH = adminRoute<{ id: string }>("update market", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, marketPatch);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return jsonError("Nothing to update", 422);
  const { data, error } = await db.from("acq_markets").update({ ...body.data, updated_at: new Date().toISOString() }).eq("id", params.id).select("id").maybeSingle();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return jsonError("A market with this name already exists", 409);
    throw new Error(error.message);
  }
  if (!data) return jsonError("Market not found", 404);
  await logAudit(db, "market.updated", "market", params.id, { fields: Object.keys(body.data) });
  return NextResponse.json({ ok: true });
});
