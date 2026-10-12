import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { addLeadsBody } from "@/lib/acquisition/validation";
import { buildLeadDraft } from "@/lib/acquisition/drafting/build";

export const dynamic = "force-dynamic";

/**
 * Adds eligible contacts to a draft campaign and creates a personalised draft for
 * each. The database refuses any contact that isn't eligible, and any campaign
 * that isn't a draft. Per-contact failures are reported, not hidden.
 */
export const POST = adminRoute<{ id: string }>("add leads", async (request, { db, params }) => {
  if (!z.string().uuid().safeParse(params.id).success) return jsonError("Invalid id", 400);
  const body = await parseBody(request, addLeadsBody);
  if ("error" in body) return body.error;

  const { data: campaign } = await db.from("acq_campaigns").select("*").eq("id", params.id).maybeSingle();
  if (!campaign) return jsonError("Campaign not found", 404);
  if (campaign.status !== "draft") return jsonError(`Campaign is ${campaign.status}; revoke approval to add recipients`, 409);

  const results: { contactId: string; ok: boolean; error?: string }[] = [];
  for (const contactId of body.data.contactIds) {
    try {
      await buildLeadDraft(db, campaign, contactId);
      results.push({ contactId, ok: true });
    } catch (e) {
      results.push({ contactId, ok: false, error: e instanceof Error ? e.message.replace(/^[^:]+: /, "") : "failed" });
    }
  }
  return NextResponse.json({ ok: results.every((r) => r.ok), results }, { status: results.some((r) => r.ok) ? 201 : 422 });
});
