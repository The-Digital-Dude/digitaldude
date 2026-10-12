import { NextResponse } from "next/server";
import { z } from "zod";
import { repJsonError, repRoute } from "@/lib/repPool";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

/** The rep's own notifications (replies, new assignments), newest first, plus the unread count. */
export const GET = repRoute("list notifications", async (_request, { rep, db }) => {
  const [list, unread] = await Promise.all([
    db.from("acq_notifications").select("id,kind,title,body,link,created_at,read_at").eq("recipient_employee_id", rep.id).order("created_at", { ascending: false }).limit(30),
    db.from("acq_notifications").select("id", { count: "exact", head: true }).eq("recipient_employee_id", rep.id).is("read_at", null),
  ]);
  if (list.error) throw new Error(list.error.message);
  return NextResponse.json({ ok: true, notifications: list.data ?? [], unread: unread.count ?? 0 });
});

const body = z.object({ ids: z.array(z.string().uuid()).max(100).optional() });

/** Marks the given notifications (or all of them) as read. Only ever touches the rep's own rows. */
export const POST = repRoute("mark notifications read", async (request, { rep, db }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Invalid request", 422);
  let q = db.from("acq_notifications").update({ read_at: new Date().toISOString() }).eq("recipient_employee_id", rep.id).is("read_at", null);
  if (parsed.data.ids?.length) q = q.in("id", parsed.data.ids);
  must(await q.select("id"), "mark read");
  return NextResponse.json({ ok: true });
});
