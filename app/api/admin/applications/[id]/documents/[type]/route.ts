import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

const SIGNED_URL_TTL_SECONDS = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, type } = await params;
  if (type !== "cv" && type !== "proof") {
    return NextResponse.json({ ok: false, error: "Unknown document type" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { data: application, error } = await supabase
    .from("job_applications")
    .select("cv_path, proof_of_results_path")
    .eq("id", id)
    .single();

  if (error || !application) {
    return NextResponse.json({ ok: false, error: "Application not found" }, { status: 404 });
  }

  const path = type === "cv" ? application.cv_path : application.proof_of_results_path;
  if (!path) {
    return NextResponse.json({ ok: false, error: "No file of this type on this application" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("candidate-documents")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    log("error", { message: "Failed to create signed URL for candidate document", error: signError, context: { id, type } });
    return NextResponse.json({ ok: false, error: "Could not generate a link to this file." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
