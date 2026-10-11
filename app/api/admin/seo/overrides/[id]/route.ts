import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { deleteMemoryPageOverride } from "@/lib/seo/auditStore";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: Props) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  deleteMemoryPageOverride(id);

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.from("seo_page_overrides").delete().or(`id.eq.${id},pathname.eq.${id}`);
    }
  } catch {}

  return NextResponse.json({ ok: true, message: "Override deleted." });
}
