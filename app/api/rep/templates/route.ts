import { NextResponse } from "next/server";
import { getAuthenticatedRep } from "@/lib/repAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { recordRepAuditLog } from "@/lib/repAudit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const { data: templates, error } = await supabase
      .from("rep_email_templates")
      .select("*")
      .eq("employee_id", rep.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: true, templates: [] });
    }

    return NextResponse.json({ ok: true, templates: templates || [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rep = await getAuthenticatedRep(request);
    if (!rep) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template_name, subject, body_content, is_default = false } = body;

    if (!template_name?.trim() || !subject?.trim() || !body_content?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Template name, subject line, and body are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
    }

    const { data: createdTemplate, error } = await supabase
      .from("rep_email_templates")
      .insert([
        {
          employee_id: rep.id,
          template_name: template_name.trim(),
          subject: subject.trim(),
          body_content: body_content.trim(),
          is_default,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await recordRepAuditLog({
      employeeId: rep.id,
      actionType: "template_created",
      description: `Created custom email template "${template_name.trim()}".`,
      targetIdentifier: template_name.trim(),
      metadata: { templateId: createdTemplate?.id },
    });

    return NextResponse.json({ ok: true, template: createdTemplate });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Failed to create template" }, { status: 500 });
  }
}
