import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** Marks all of the admin's notifications as read. */
export const POST = adminRoute("mark notifications read", async (_request, { db }) => {
  must(await db.from("acq_notifications").update({ read_at: new Date().toISOString() }).is("recipient_employee_id", null).is("read_at", null).select("id"), "mark read");
  return NextResponse.json({ ok: true });
});
