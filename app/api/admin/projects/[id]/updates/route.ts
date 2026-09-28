import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { sendClientProjectUpdateEmail } from "@/lib/clientEmails";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
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
    const { title, content_md, loom_video_url, send_email = true } = body;

    if (!title?.trim() || !content_md?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Update title and content are required." },
        { status: 400 }
      );
    }

    // Fetch project
    const { data: project, error: pErr } = await supabase
      .from("client_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (pErr || !project) {
      return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    }

    const { data: updateRecord, error } = await supabase
      .from("client_updates")
      .insert([
        {
          project_id: id,
          title: title.trim(),
          content_md: content_md.trim(),
          loom_video_url: loom_video_url?.trim() || null,
          published_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Send email to client stakeholder
    if (send_email && project.client_email) {
      try {
        await sendClientProjectUpdateEmail({
          email: project.client_email,
          clientName: project.client_name,
          projectTitle: project.project_title,
          updateTitle: title.trim(),
          summary: content_md.trim().slice(0, 300),
        });
      } catch (mailErr) {
        log("warn", { message: "Could not send client project update email", error: mailErr });
      }
    }

    return NextResponse.json({ ok: true, update: updateRecord });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
