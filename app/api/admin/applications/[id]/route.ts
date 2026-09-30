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
      task_submission_url,
      task_deadline,
      bkash_number,
      bkash_payment_status,
      bkash_payment_amount,
      bkash_transaction_id,
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
    if (task_submission_url !== undefined) updateData.task_submission_url = task_submission_url;
    if (task_deadline !== undefined) updateData.task_deadline = task_deadline;
    if (bkash_number !== undefined) updateData.bkash_number = bkash_number;
    if (bkash_payment_status !== undefined) updateData.bkash_payment_status = bkash_payment_status;
    if (bkash_payment_amount !== undefined) updateData.bkash_payment_amount = bkash_payment_amount;
    if (bkash_transaction_id !== undefined) updateData.bkash_transaction_id = bkash_transaction_id;

    let { data, error } = await supabase
      .from("job_applications")
      .update(updateData)
      .eq("id", id)
      .select("*, job_postings(title, slug)")
      .single();

    // Fallback if columns haven't been migrated yet in user's Supabase instance
    if (error && error.message?.includes("column")) {
      const sanitizedUpdate = { ...updateData };
      if (error.message.includes("scorecard")) delete sanitizedUpdate.scorecard;
      if (error.message.includes("internal_notes")) delete sanitizedUpdate.internal_notes;
      if (error.message.includes("task_submission_url")) delete sanitizedUpdate.task_submission_url;
      if (error.message.includes("task_deadline")) delete sanitizedUpdate.task_deadline;
      if (error.message.includes("bkash_number")) delete sanitizedUpdate.bkash_number;
      if (error.message.includes("bkash_payment_status")) delete sanitizedUpdate.bkash_payment_status;
      if (error.message.includes("bkash_payment_amount")) delete sanitizedUpdate.bkash_payment_amount;
      if (error.message.includes("bkash_transaction_id")) delete sanitizedUpdate.bkash_transaction_id;

      const retryRes = await supabase
        .from("job_applications")
        .update(sanitizedUpdate)
        .eq("id", id)
        .select("*, job_postings(title, slug)")
        .single();

      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      }
    }

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
