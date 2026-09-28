import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

export async function PUT(
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
    const body = await request.json();
    const { taskIndex, done } = body;

    if (typeof taskIndex !== "number" || typeof done !== "boolean") {
      return NextResponse.json({ ok: false, error: "taskIndex (number) and done (boolean) are required." }, { status: 400 });
    }

    const { data: employee, error: fetchError } = await supabase
      .from("employees")
      .select("onboarding_checklist")
      .eq("id", id)
      .single();

    if (fetchError || !employee) {
      return NextResponse.json({ ok: false, error: "Employee not found" }, { status: 404 });
    }

    const checklist: ChecklistItem[] = Array.isArray(employee.onboarding_checklist)
      ? employee.onboarding_checklist
      : [];

    if (taskIndex < 0 || taskIndex >= checklist.length) {
      return NextResponse.json({ ok: false, error: "Task index out of range" }, { status: 400 });
    }

    checklist[taskIndex] = {
      ...checklist[taskIndex],
      done,
      done_at: done ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("employees")
      .update({ onboarding_checklist: checklist, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log("error", { message: "Failed to update onboarding checklist", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const allDone = checklist.length > 0 && checklist.every((item) => item.done);
    if (allDone && data.status === "onboarding") {
      const { data: activated } = await supabase
        .from("employees")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      try {
        const { sendOnboardingWelcomeEmail } = await import("@/lib/recruitingEmails");
        await sendOnboardingWelcomeEmail({
          fullName: data.full_name,
          email: data.email,
          roleTitle: data.role_title || "team member",
        });
      } catch (err) {
        log("warn", { message: "Could not send onboarding welcome email", error: err });
      }

      return NextResponse.json({ ok: true, employee: activated || data });
    }

    return NextResponse.json({ ok: true, employee: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
