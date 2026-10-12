import { NextResponse } from "next/server";
import { z } from "zod";
import { ownedCompany, repJsonError, repRoute } from "@/lib/repPool";
import { must } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

const body = z.object({ note: z.string().trim().min(1).max(4000) });

export const POST = repRoute<{ id: string }>("add company note", async (request, { rep, db, params }) => {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return repJsonError("Write a note (up to 4000 characters)", 422);
  const company = await ownedCompany(db, rep.id, params.id);
  if (!company) return repJsonError("Company not found", 404);
  must(await db.from("acq_company_notes").insert({ company_id: company.id, employee_id: rep.id, author: rep.full_name, note: parsed.data.note }).select("id"), "add note");
  return NextResponse.json({ ok: true }, { status: 201 });
});
