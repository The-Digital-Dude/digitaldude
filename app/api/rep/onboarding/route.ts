import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedRep } from "@/lib/repAuth";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

export async function PUT(request: Request) {
  const repSession = await getAuthenticatedRep(request);
  if (!repSession) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { taskIndex, done } = await request.json();

    const { data: employee, error: fetchErr } = await supabase
      .from("employees")
      .select("id, onboarding_checklist")
      .eq("id", repSession.id)
      .single();

    if (fetchErr || !employee) {
      return NextResponse.json({ ok: false, error: "Employee record not found." }, { status: 404 });
    }

    const checklist: ChecklistItem[] = (employee.onboarding_checklist as ChecklistItem[]) || [];
    if (taskIndex < 0 || taskIndex >= checklist.length) {
      return NextResponse.json({ ok: false, error: "Invalid task index." }, { status: 400 });
    }

    checklist[taskIndex].done = !!done;
    checklist[taskIndex].done_at = done ? new Date().toISOString() : null;

    const { data: updated, error: updateErr } = await supabase
      .from("employees")
      .update({
        onboarding_checklist: checklist,
        updated_at: new Date().toISOString(),
      })
      .eq("id", repSession.id)
      .select("id, onboarding_checklist")
      .single();

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, onboarding_checklist: updated.onboarding_checklist });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
