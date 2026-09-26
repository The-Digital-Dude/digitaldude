import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, admin_notes, meet_url } = body;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (meet_url !== undefined) updateData.meet_url = meet_url;

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log("error", { message: "Failed to update booking", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Booking updated successfully", context: { id, updateData } });
    return NextResponse.json({ ok: true, booking: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
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
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      log("error", { message: "Failed to delete booking", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Booking deleted", context: { id } });
    return NextResponse.json({ ok: true, message: "Booking deleted successfully" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
