import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
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

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`apply:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Applications are not accepted right now. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();

    // Hidden honeypot field: real applicants never fill this in.
    const honeypot = formData.get("website");
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const jobSlug = String(formData.get("jobSlug") || "").trim();
    const applicantName = String(formData.get("applicantName") || "").trim();
    const applicantEmail = String(formData.get("applicantEmail") || "").trim().toLowerCase();
    const applicantPhone = String(formData.get("applicantPhone") || "").trim();
    const writtenTestResponse = String(formData.get("writtenTestResponse") || "").trim();
    const cvFile = formData.get("cv") as File | null;
    const proofFile = formData.get("proofOfResults") as File | null;

    if (!jobSlug || !applicantName || !applicantEmail || !writtenTestResponse || !cvFile) {
      return NextResponse.json(
        { ok: false, error: "Name, email, CV, and the written test response are all required." },
        { status: 400 }
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id, title, status")
      .eq("slug", jobSlug)
      .single();

    if (jobError || !job || job.status !== "open") {
      return NextResponse.json(
        { ok: false, error: "This role is no longer accepting applications." },
        { status: 404 }
      );
    }

    const folder = `${job.id}/${Date.now()}`;
    const cvUpload = await uploadDocument(supabase, cvFile, folder);
    if (!cvUpload.ok) {
      return NextResponse.json({ ok: false, error: cvUpload.error }, { status: 400 });
    }

    let proofPath: string | null = null;
    if (proofFile && proofFile.size > 0) {
      const proofUpload = await uploadDocument(supabase, proofFile, folder);
      if (!proofUpload.ok) {
        return NextResponse.json({ ok: false, error: proofUpload.error }, { status: 400 });
      }
      proofPath = proofUpload.path;
    }

    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        job_posting_id: job.id,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone || null,
        cv_path: cvUpload.path,
        proof_of_results_path: proofPath,
        written_test_response: writtenTestResponse,
      })
      .select()
      .single();

    if (insertError) {
      log("error", { message: "Failed to save job application", error: insertError });
      return NextResponse.json(
        { ok: false, error: "Could not save your application. Please try again." },
        { status: 500 }
      );
    }

    try {
      const { sendApplicationReceivedEmail } = await import("@/lib/recruitingEmails");
      await sendApplicationReceivedEmail({
        applicantName,
        applicantEmail,
        jobTitle: job.title,
      });
    } catch (err) {
      // Never fail the application because the confirmation email failed.
      log("warn", { message: "Could not send application-received email", error: err });
    }

    // Dispatch Meta Conversions API (CAPI) SubmitApplication Event
    try {
      const { sendMetaCapiEvent } = await import("@/lib/metaCapi");
      const userAgent = request.headers.get("user-agent") || undefined;
      const cookieHeader = request.headers.get("cookie") || "";
      const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/);
      const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/);

      await sendMetaCapiEvent({
        eventName: "SubmitApplication",
        eventSourceUrl: `https://www.digitaldude.co.uk/careers/${jobSlug}`,
        user: {
          email: applicantEmail,
          phone: applicantPhone || undefined,
          firstName: applicantName.split(" ")[0],
          lastName: applicantName.split(" ").slice(1).join(" ") || undefined,
          clientIpAddress: ip,
          clientUserAgent: userAgent,
          fbp: fbpMatch ? fbpMatch[1] : undefined,
          fbc: fbcMatch ? fbcMatch[1] : undefined,
        },
        customData: {
          content_name: job.title,
          job_slug: jobSlug,
        },
      });
    } catch (capiErr) {
      log("warn", { message: "Meta CAPI dispatch error on job application", error: capiErr });
    }

    log("info", { message: "Job application received", context: { applicationId: application.id, jobSlug } });

    return NextResponse.json({ ok: true, applicationId: application.id });
  } catch (error) {
    log("error", { message: "Failed to process job application", error });
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
