import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { queryPool } from "@/lib/acquisition/pool";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** The global lead pool: filterable, server-paginated list of every company plus the reps that can own them. */
export const GET = adminRoute("list pool", async (request, { db }) => {
  const result = await queryPool(db, new URL(request.url).searchParams);
  const reps = must(await db.from("employees").select("id,full_name,email,status,onboarding_completed").neq("status", "offboarded").order("full_name"), "list reps");
  return NextResponse.json({ ok: true, ...result, reps });
});
