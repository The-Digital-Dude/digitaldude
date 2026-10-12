import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { researchBody } from "@/lib/acquisition/validation";
import { enqueueJob } from "@/lib/acquisition/queue/enqueue";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/** Validate the request and enqueue a durable research job (one per company per day). */
export const POST = adminRoute("research enqueue", async (request, { db }) => {
  const body = await parseBody(request, researchBody);
  if ("error" in body) return body.error;

  const { data: company } = await db.from("acq_companies").select("id,website").eq("id", body.data.companyId).maybeSingle();
  if (!company) return jsonError("Company not found", 404);
  if (!company.website) return jsonError("Add the company's website first, or enter research notes manually", 422);

  const day = new Date().toISOString().slice(0, 10);
  const job = await enqueueJob(db, { type: "research", payload: { companyId: company.id }, idempotencyKey: `research:${company.id}:${day}` });
  if (job.created) await logAudit(db, "research.enqueued", "company", company.id, { jobId: job.id });
  return NextResponse.json({ ok: true, jobId: job.id, alreadyQueued: !job.created }, { status: 202 });
});
