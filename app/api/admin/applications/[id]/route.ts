import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

export async function GET(
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

  const { data, error } = await supabase
    .from("job_applications")
    .select("*, job_postings(title, slug)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, application: data });
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
    const {
      status,
      internal_notes,
      scorecard,
      send_email = false,
      email_subject,
      email_message,
      interview_booking_url,
      meeting_link,
    } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (scorecard !== undefined) updateData.scorecard = scorecard;

    const { data, error } = await supabase
      .from("job_applications")
      .update(updateData)
      .eq("id", id)
      .select("*, job_postings(title, slug)")
      .single();

    if (error) {
      log("error", { message: "Failed to update application", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (send_email && data.applicant_email) {
      try {
        const { sendApplicationStatusEmail } = await import("@/lib/recruitingEmails");
        await sendApplicationStatusEmail({
          applicantName: data.applicant_name,
          applicantEmail: data.applicant_email,
          jobTitle: data.job_postings?.title || "the role",
          status: status || data.status,
          customSubject: email_subject,
          customMessage: email_message,
          interviewBookingUrl: interview_booking_url,
          meetingLink: meeting_link,
        });
      } catch (err) {
        log("warn", { message: "Could not send application status email", error: err });
      }
    }

    return NextResponse.json({ ok: true, application: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
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

  const { data: application } = await supabase
    .from("job_applications")
    .select("cv_path, proof_of_results_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("job_applications").delete().eq("id", id);
  if (error) {
    log("error", { message: "Failed to delete application", error, context: { id } });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (application) {
    const paths = [application.cv_path, application.proof_of_results_path].filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("candidate-documents").remove(paths);
    }
  }

  return NextResponse.json({ ok: true });
}
