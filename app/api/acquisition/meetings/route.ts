import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { meetingBody } from "@/lib/acquisition/validation";
import { getBookingUrl } from "@/lib/acquisition/providers/calendar";
import { isSuppressed } from "@/lib/acquisition/compliance/suppression";
import { must } from "@/lib/acquisition/db";
import { logAudit } from "@/lib/acquisition/audit";

export const dynamic = "force-dynamic";

/** Records that the booking link is being offered. Nothing is sent; you share it yourself. */
export const POST = adminRoute("create meeting", async (request, { db }) => {
  const body = await parseBody(request, meetingBody);
  if ("error" in body) return body.error;

  const { data: contact } = await db.from("acq_contacts").select("id,email").eq("id", body.data.contactId).maybeSingle();
  if (!contact) return jsonError("Contact not found", 404);
  // Booking never overrides an opt-out.
  if (await isSuppressed(db, contact.email)) return jsonError("This contact has opted out or is suppressed; do not offer a meeting", 409);
  const { data: optOut } = await db.from("acq_replies").select("id").eq("contact_id", contact.id).eq("classification", "opt_out").limit(1);
  if (optOut?.length) return jsonError("This contact asked not to be contacted", 409);

  const url = getBookingUrl();
  if (!url) return jsonError("Set ACQ_BOOKING_URL (or NEXT_PUBLIC_GOOGLE_APPOINTMENT_URL) first", 422);
  const row = must(await db.from("acq_meetings").insert({ contact_id: contact.id, booking_url: url }).select("id").single(), "create meeting");
  await logAudit(db, "meeting.link_offered", "contact", contact.id, { meetingId: row.id });
  return NextResponse.json({ ok: true, id: row.id, bookingUrl: url }, { status: 201 });
});
