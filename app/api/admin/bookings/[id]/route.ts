import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { updateInMemoryLead, deleteInMemoryLead, findInMemoryLead } from "@/lib/crm";

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
  const {
    stage,
    deal_value,
    lead_score,
    lead_notes,
    assigned_to,
    sourced_by_employee_id,
    meeting_bonus_payout_status,
    deal_commission_payout_status,
    payout_notes,
    meet_url,
    status,
    admin_notes,
  } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (stage !== undefined) updateData.stage = stage;
  if (deal_value !== undefined) updateData.deal_value = Number(deal_value);
  if (lead_score !== undefined) updateData.lead_score = lead_score;
  if (lead_notes !== undefined) updateData.lead_notes = lead_notes;
  if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
  if (sourced_by_employee_id !== undefined) {
    updateData.sourced_by_employee_id = sourced_by_employee_id;
    updateData.employee_id = sourced_by_employee_id;
  }
  if (meeting_bonus_payout_status !== undefined) updateData.meeting_bonus_payout_status = meeting_bonus_payout_status;
  if (deal_commission_payout_status !== undefined) updateData.deal_commission_payout_status = deal_commission_payout_status;
  if (payout_notes !== undefined) updateData.payout_notes = payout_notes;
  if (meet_url !== undefined) updateData.meet_url = meet_url;
  if (status !== undefined) updateData.status = status;
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        log("error", { message: "Supabase update booking failed", error, context: { id } });
        return NextResponse.json({ ok: false, error: error.message || "Failed to update booking in database" }, { status: 500 });
      }

      if (data) {
        updateInMemoryLead(id, data);
        log("info", { message: "Booking CRM record updated", context: { id, updateData } });

        // Dispatch downstream Meta Conversions API (CAPI) offline event
        if (stage === "closed_won" || status === "completed") {
          import("@/lib/metaCapi").then(({ sendMetaCapiEvent }) => {
            sendMetaCapiEvent({
              eventName: "Purchase",
              eventId: `won_${id}_${Date.now()}`,
              eventSourceUrl: "https://www.digitaldude.co.uk/admin/bookings",
              user: {
                email: data.work_email || data.email,
                firstName: String(data.name || "").split(" ")[0],
                lastName: String(data.name || "").split(" ").slice(1).join(" ") || undefined,
                country: data.country,
                externalId: id,
              },
              customData: {
                content_name: data.company_name || "Enterprise Custom Software",
                content_category: "Closed Won Deal",
                value: Number(data.deal_value) || 5000,
                currency: "USD",
              },
            }).catch(() => {});
          }).catch(() => {});
        } else if (stage === "proposal_sent" || stage === "call_completed") {
          import("@/lib/metaCapi").then(({ sendMetaCapiEvent }) => {
            sendMetaCapiEvent({
              eventName: "Lead",
              eventId: `qual_${id}_${Date.now()}`,
              eventSourceUrl: "https://www.digitaldude.co.uk/admin/bookings",
              user: {
                email: data.work_email || data.email,
                firstName: String(data.name || "").split(" ")[0],
                lastName: String(data.name || "").split(" ").slice(1).join(" ") || undefined,
                country: data.country,
                externalId: id,
              },
              customData: {
                content_name: data.company_name || "Qualified Opportunity",
                content_category: "Qualified Lead",
                value: 500.00,
                currency: "USD",
              },
            }).catch(() => {});
          }).catch(() => {});
        }

        return NextResponse.json({ ok: true, booking: data });
      }
    } catch (error) {
      log("error", { message: "Supabase update exception", error });
      return NextResponse.json({ ok: false, error: "Database update error" }, { status: 500 });
    }
  }

  // If no Supabase connection is available (development fallback), check in-memory lead
  const existing = findInMemoryLead(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Booking lead not found" }, { status: 404 });
  }

  const updated = updateInMemoryLead(id, body);

  if (stage === "closed_won" || status === "completed") {
    import("@/lib/metaCapi").then(({ sendMetaCapiEvent }) => {
      sendMetaCapiEvent({
        eventName: "Purchase",
        eventId: `won_${id}_${Date.now()}`,
        eventSourceUrl: "https://www.digitaldude.co.uk/admin/bookings",
        user: {
          email: updated?.work_email,
          firstName: String(updated?.name || "").split(" ")[0],
          lastName: String(updated?.name || "").split(" ").slice(1).join(" ") || undefined,
          country: updated?.country,
          externalId: id,
        },
        customData: {
          content_name: updated?.company_name || "Enterprise Custom Software",
          content_category: "Closed Won Deal",
          value: Number(updated?.deal_value) || 5000,
          currency: "USD",
        },
      }).catch(() => {});
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    booking: updated,
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
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) {
        log("error", { message: "Failed to delete booking from database", error, context: { id } });
        return NextResponse.json({ ok: false, error: error.message || "Failed to delete booking" }, { status: 500 });
      }
    } catch (err) {
      log("error", { message: "Delete exception", error: err });
      return NextResponse.json({ ok: false, error: "Database error deleting booking" }, { status: 500 });
    }
  }

  deleteInMemoryLead(id);
  return NextResponse.json({ ok: true });
}
