import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  findInMemoryProposal,
  updateInMemoryProposal,
  deleteInMemoryProposal,
  addInMemoryProposal,
} from "@/lib/content/proposals";
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
        addInMemoryProposal(data);
        return NextResponse.json({ ok: true, proposal: data });
      }
    } catch (err) {
      log("warn", { message: "Supabase proposal get notice", error: err });
    }
  }

  const local = findInMemoryProposal(id);
  if (local) {
    return NextResponse.json({ ok: true, proposal: local });
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
      if (error) {
        log("error", { message: "Supabase proposal update error", error });
        return NextResponse.json({ ok: false, error: error.message || "Failed to update proposal in database." }, { status: 500 });
      }

      if (data) {
        addInMemoryProposal(data);
        return NextResponse.json({ ok: true, proposal: data });
      }

      return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
    } catch (err) {
      log("error", { message: "Failed updating proposal in Supabase", error: err });
      return NextResponse.json({ ok: false, error: "Database exception while updating proposal." }, { status: 500 });
    }
  }

  const updatedLocal = updateInMemoryProposal(id, body);
  if (!updatedLocal) {
    return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    proposal: updatedLocal,
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
      if (error) {
        log("error", { message: "Supabase proposal delete error", error });
        return NextResponse.json({ ok: false, error: error.message || "Failed to delete proposal in database." }, { status: 500 });
      }

      deleteInMemoryProposal(id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      log("error", { message: "Supabase proposal delete exception", error: err });
      return NextResponse.json({ ok: false, error: "Database exception while deleting proposal." }, { status: 500 });
    }
  }

  deleteInMemoryProposal(id);
  return NextResponse.json({ ok: true });
}

