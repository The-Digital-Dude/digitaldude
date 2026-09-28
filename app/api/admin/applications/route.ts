import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { createCandidateInterviewMeeting } from "@/lib/googleCalendar";
import { log } from "@/lib/logger";

const BUCKET_NAME = "candidate-documents";
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function slugifyFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "bin";
  const base = name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  return `${Date.now()}-${base}.${ext}`;
}

async function uploadDocument(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  file: File,
  folder: string
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return { ok: false, error: "Only PDF, Word, or image files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File size exceeds the 10MB limit." };
  }

  const path = `${folder}/${slugifyFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return { ok: false, error: error.message || "Failed to upload file." };
  }
  return { ok: true, path };
}

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const jobPostingId = searchParams.get("job_posting_id");
  const status = searchParams.get("status");

  try {
    let query = supabase
      .from("job_applications")
      .select("*, job_postings(title, slug)")
      .order("created_at", { ascending: false });

    if (jobPostingId) query = query.eq("job_posting_id", jobPostingId);
    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      log("error", { message: "Failed to fetch job applications", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, applications: data || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let applicantName = "";
    let applicantEmail = "";
    let applicantPhone = "";
    let jobPostingId = "";
    let status = "new";
    let writtenTestResponse = "";
    let internalNotes = "";
    let scorecard: Record<string, number> = {};
    let cvPath = "";
    let proofPath: string | null = null;
    let cvFile: File | null = null;
    let proofFile: File | null = null;
    let sendEmail = false;
    let emailSubject = "";
    let emailMessage = "";
    let interviewBookingUrl = "";
    let interviewDate = "";
    let meetingLink = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      applicantName = String(formData.get("applicantName") || "").trim();
      applicantEmail = String(formData.get("applicantEmail") || "").trim().toLowerCase();
      applicantPhone = String(formData.get("applicantPhone") || "").trim();
      jobPostingId = String(formData.get("jobPostingId") || "").trim();
      status = String(formData.get("status") || "new").trim();
      writtenTestResponse = String(formData.get("writtenTestResponse") || "").trim();
      internalNotes = String(formData.get("internalNotes") || "").trim();
      sendEmail = formData.get("sendEmail") === "true";
      emailSubject = String(formData.get("emailSubject") || "").trim();
      emailMessage = String(formData.get("emailMessage") || "").trim();
      interviewBookingUrl = String(formData.get("interviewBookingUrl") || "").trim();
      interviewDate = String(formData.get("interviewDate") || "").trim();
      meetingLink = String(formData.get("meetingLink") || "").trim();

      const scorecardRaw = formData.get("scorecard");
      if (scorecardRaw && typeof scorecardRaw === "string") {
        try {
          scorecard = JSON.parse(scorecardRaw);
        } catch {}
      }

      cvFile = formData.get("cv") as File | null;
      proofFile = formData.get("proofOfResults") as File | null;
      const cvUrl = String(formData.get("cvUrl") || "").trim();
      if (cvUrl) cvPath = `url:${cvUrl}`;
    } else {
      const body = await request.json();
      applicantName = String(body.applicantName || "").trim();
      applicantEmail = String(body.applicantEmail || "").trim().toLowerCase();
      applicantPhone = String(body.applicantPhone || "").trim();
      jobPostingId = String(body.jobPostingId || "").trim();
      status = String(body.status || "new").trim();
      writtenTestResponse = String(body.writtenTestResponse || "").trim();
      internalNotes = String(body.internalNotes || "").trim();
      scorecard = body.scorecard || {};
      sendEmail = Boolean(body.sendEmail);
      emailSubject = String(body.emailSubject || "").trim();
      emailMessage = String(body.emailMessage || "").trim();
      interviewBookingUrl = String(body.interviewBookingUrl || "").trim();
      interviewDate = String(body.interviewDate || "").trim();
      meetingLink = String(body.meetingLink || "").trim();
      if (body.cvUrl) cvPath = `url:${body.cvUrl.trim()}`;
    }

    if (!applicantName || !applicantEmail) {
      return NextResponse.json(
        { ok: false, error: "Candidate Name and Email are required." },
        { status: 400 }
      );
    }

    // Resolve job posting if not supplied
    let targetJobId = jobPostingId;
    let jobTitle = "General Opening";

    if (!targetJobId) {
      const { data: firstJob } = await supabase
        .from("job_postings")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (firstJob) {
        targetJobId = firstJob.id;
        jobTitle = firstJob.title;
      }
    } else {
      const { data: job } = await supabase
        .from("job_postings")
        .select("id, title")
        .eq("id", targetJobId)
        .maybeSingle();
      if (job) jobTitle = job.title;
    }

    const folder = `${targetJobId || "manual"}/${Date.now()}`;

    // Upload CV file if provided
    if (cvFile && cvFile.size > 0) {
      const uploadRes = await uploadDocument(supabase, cvFile, folder);
      if (!uploadRes.ok) {
        return NextResponse.json({ ok: false, error: uploadRes.error }, { status: 400 });
      }
      cvPath = uploadRes.path;
    }

    if (!cvPath) {
      cvPath = "manual:no-file-provided";
    }

    // Upload Proof file if provided
    if (proofFile && proofFile.size > 0) {
      const uploadProofRes = await uploadDocument(supabase, proofFile, folder);
      if (uploadProofRes.ok) {
        proofPath = uploadProofRes.path;
      }
    }

    // Optional Google Meet generation if interview date is provided
    let generatedMeetUrl = meetingLink;
    if (status === "interview" && interviewDate && !generatedMeetUrl) {
      try {
        const meetResult = await createCandidateInterviewMeeting({
          candidateName: applicantName,
          candidateEmail: applicantEmail,
          jobTitle,
          slotStart: interviewDate,
          notes: internalNotes || writtenTestResponse || undefined,
        });
        if (meetResult?.meetUrl) {
          generatedMeetUrl = meetResult.meetUrl;
        }
      } catch (meetErr) {
        log("warn", { message: "Could not auto-generate Google Meet for interview", error: meetErr });
      }
    }

    let insertPayload: Record<string, unknown> = {
      job_posting_id: targetJobId || null,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: applicantPhone || null,
      cv_path: cvPath,
      proof_of_results_path: proofPath,
      written_test_response: writtenTestResponse,
      status,
      internal_notes: internalNotes,
      scorecard,
    };

    let { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert(insertPayload)
      .select("*, job_postings(title, slug)")
      .single();

    if (insertError && insertError.message?.includes("column")) {
      const sanitized = { ...insertPayload };
      if (insertError.message.includes("scorecard")) delete sanitized.scorecard;
      if (insertError.message.includes("internal_notes")) delete sanitized.internal_notes;

      const retryRes = await supabase
        .from("job_applications")
        .insert(sanitized)
        .select("*, job_postings(title, slug)")
        .single();

      if (!retryRes.error) {
        application = retryRes.data;
        insertError = null;
      }
    }

    if (insertError) {
      log("error", { message: "Failed to save manual candidate application", error: insertError });
      return NextResponse.json(
        { ok: false, error: insertError.message || "Failed to save application." },
        { status: 500 }
      );
    }

    // Dispatch dynamic email if requested
    if (sendEmail) {
      try {
        const { sendApplicationStatusEmail } = await import("@/lib/recruitingEmails");
        await sendApplicationStatusEmail({
          applicantName,
          applicantEmail,
          jobTitle,
          status,
          customSubject: emailSubject || undefined,
          customMessage: emailMessage || undefined,
          interviewBookingUrl: interviewBookingUrl || undefined,
          meetingLink: generatedMeetUrl || undefined,
        });
        log("info", { message: "Manual candidate email dispatched", context: { applicantEmail, status } });
      } catch (emailErr) {
        log("warn", { message: "Could not send manual candidate status email", error: emailErr });
      }
    }

    return NextResponse.json({
      ok: true,
      application,
      meetUrl: generatedMeetUrl || null,
    });
  } catch (error) {
    log("error", { message: "Failed to process manual candidate creation", error });
    return NextResponse.json(
      { ok: false, error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
