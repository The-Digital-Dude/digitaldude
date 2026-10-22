import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

type Rep = NonNullable<Awaited<ReturnType<typeof getAuthenticatedRep>>>;

export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

/** The signed-in rep and the database, or the response to send instead (401 / 503). */
export async function repContext(request: Request): Promise<{ rep: Rep; db: SupabaseClient } | { response: NextResponse }> {
  const rep = await getAuthenticatedRep(request);
  if (!rep) return { response: fail("Unauthorized", 401) };
  const db = getSupabaseServerClient();
  if (!db) return { response: fail("Database unavailable", 503) };
  return { rep, db };
}

/** The lead if it belongs to this rep (and has not been erased), else null. */
export async function ownLead<T extends string = "*">(db: SupabaseClient, repId: string, leadId: string, columns: T | string = "*"): Promise<Record<string, unknown> | null> {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  const { data } = await db.from("rep_leads").select(columns).eq("id", leadId).eq("employee_id", repId).is("anonymized_at", null).maybeSingle();
  return (data as unknown as Record<string, unknown> | null) ?? null;
}
