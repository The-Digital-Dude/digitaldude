import { NextResponse } from "next/server";
import { viewInputSchema } from "@/lib/crm/model";
import { fail, repContext } from "@/lib/crm/api";

export const dynamic = "force-dynamic";

const MAX_VIEWS = 20;

export async function GET(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { data } = await ctx.db.from("rep_saved_views").select("id,name,filters").eq("employee_id", ctx.rep.id).order("created_at", { ascending: true });
    return NextResponse.json({ ok: true, views: data ?? [] });
  } catch {
    return fail("Failed to load views", 500);
  }
}

/** Saves a named filter combination ("UK leads gone quiet"). Saving the same name again replaces it. */
export async function POST(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;

    const parsed = viewInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid view");

    const { count } = await db.from("rep_saved_views").select("id", { count: "exact", head: true }).eq("employee_id", rep.id);
    const { data: same } = await db.from("rep_saved_views").select("id").eq("employee_id", rep.id).eq("name", parsed.data.name).maybeSingle();
    if (!same && (count ?? 0) >= MAX_VIEWS) return fail(`You can keep up to ${MAX_VIEWS} saved views. Delete one first.`, 409);

    const { data, error } = await db.from("rep_saved_views").upsert({ employee_id: rep.id, name: parsed.data.name, filters: parsed.data.filters }, { onConflict: "employee_id,name" }).select("id,name,filters").single();
    if (error) return fail(error.message, 500);
    return NextResponse.json({ ok: true, view: data });
  } catch {
    return fail("Failed to save view", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Invalid view");
    await ctx.db.from("rep_saved_views").delete().eq("id", id).eq("employee_id", ctx.rep.id);
    return NextResponse.json({ ok: true });
  } catch {
    return fail("Failed to delete view", 500);
  }
}
