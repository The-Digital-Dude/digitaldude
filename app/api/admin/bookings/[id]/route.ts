import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: Request,
  params: Promise<{ id: string }>
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { stage, deal_value, lead_score, lead_notes, assigned_to, meet_url, status, admin_notes } = body;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (stage !== undefined) updateData.stage = stage;
      if (deal_value !== undefined) updateData.deal_value = Number(deal_value);
      if (lead_score !== undefined) updateData.lead_score = lead_score;
      if (lead_notes !== undefined) updateData.lead_notes = lead_notes;
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
      if (meet_url !== undefined) updateData.meet_url = meet_url;
      if (status !== undefined) updateData.status = status;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        log("info", { message: "Booking CRM record updated", context: { id, updateData } });
        return NextResponse.json({ ok: true, booking: data });
      }
    } catch (error) {
      log("warn", { message: "Supabase update fallback notice", error });
    }
  }

  return NextResponse.json({
    ok: true,
    booking: {
      id,
      ...body,
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
      await supabase.from("bookings").delete().eq("id", id);
    } catch (err) {
      log("warn", { message: "Delete fallback notice", error: err });
    }
  }

  return NextResponse.json({ ok: true });
}
