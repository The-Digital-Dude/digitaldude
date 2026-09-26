import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { DEMO_PROPOSAL } from "@/lib/content/proposals";
import { log } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(id);
      const query = isUUID
        ? supabase.from("proposals").select("*").eq("id", id).single()
        : supabase.from("proposals").select("*").eq("slug", id).single();

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ ok: true, proposal: data });
      }
    } catch (err) {
      log("warn", { message: "Supabase proposal get notice", error: err });
    }
  }

  if (id === DEMO_PROPOSAL.id || id === DEMO_PROPOSAL.slug) {
    return NextResponse.json({ ok: true, proposal: DEMO_PROPOSAL });
  }

  return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(id);
      const updatePayload = {
        ...body,
        updated_at: new Date().toISOString(),
      };

      const query = isUUID
        ? supabase.from("proposals").update(updatePayload).eq("id", id).select().single()
        : supabase.from("proposals").update(updatePayload).eq("slug", id).select().single();

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ ok: true, proposal: data });
      } else if (error) {
        log("error", { message: "Supabase update error on proposal", error });
      }
    } catch (err) {
      log("error", { message: "Failed updating proposal", error: err });
    }
  }

  return NextResponse.json({
    ok: true,
    proposal: {
      ...DEMO_PROPOSAL,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(id);
      const query = isUUID
        ? supabase.from("proposals").delete().eq("id", id)
        : supabase.from("proposals").delete().eq("slug", id);

      const { error } = await query;
      if (!error) {
        return NextResponse.json({ ok: true });
      }
    } catch (err) {
      log("error", { message: "Failed deleting proposal", error: err });
    }
  }

  return NextResponse.json({ ok: true });
}
