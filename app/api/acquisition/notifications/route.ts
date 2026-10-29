import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/acquisition/route";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** The admin's latest in-app notifications and how many are unread (drives the bell on every admin page). */
export const GET = adminRoute("load notifications", async (_request, { db }) => {
  const [recent, unread] = await Promise.all([
    db.from("acq_notifications").select("id,kind,title,body,link,created_at,read_at").is("recipient_employee_id", null).order("created_at", { ascending: false }).limit(30),
    db.from("acq_notifications").select("id", { count: "exact", head: true }).is("recipient_employee_id", null).is("read_at", null),
  ]);
  return NextResponse.json({ ok: true, items: must(recent, "load notifications"), unread: unread.count ?? 0 });
});
