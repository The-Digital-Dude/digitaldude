import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { parseBody } from "@/lib/acquisition/http";
import { acqEnv } from "@/lib/acquisition/env";
import { reviewSuggestions } from "@/lib/acquisition/contacts/review";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ ids: z.array(z.string().uuid()).min(1).max(100), action: z.enum(["accept", "dismiss"]) });

/** Accept or dismiss many suggested addresses at once. Accepted ones still need a lawful basis before anyone can email them. */
export const POST = adminRoute("bulk review suggestions", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const results = await reviewSuggestions(db, [...new Set(parsed.data.ids)], parsed.data.action, acqEnv().operatorName);
  const count = (s: string) => results.filter((r) => r.status === s).length;
  return NextResponse.json({ ok: true, accepted: count("accepted"), dismissed: count("dismissed"), skipped: count("skipped"), results });
});
