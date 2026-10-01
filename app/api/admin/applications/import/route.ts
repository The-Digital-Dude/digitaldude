import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { detectAndParseSheet, suggestFieldMapping, MappingTarget } from "@/lib/leadImport";

interface CommitBody {
  action: "commit";
  jobPostingId: string;
  headers: string[];
  mapping: Record<string, MappingTarget>;
  rows: string[][];
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

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      // action=parse: parse the uploaded file and return headers/rows/suggested mapping.
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ ok: false, error: "Please choose a CSV or Excel file." }, { status: 400 });
      }

      const text = await file.text();
      const { headers, rows } = detectAndParseSheet(file.name, text);

      if (headers.length === 0) {
        return NextResponse.json(
          { ok: false, error: "No columns could be detected in this file." },
          { status: 400 }
        );
      }

      const suggestedMapping = suggestFieldMapping(headers);

      return NextResponse.json({
        ok: true,
        headers,
        rows,
        suggestedMapping,
        totalRows: rows.length,
      });
    }

    // action=commit: insert the mapped rows as job_applications.
    const body: CommitBody = await request.json();
    const { jobPostingId, headers, mapping, rows } = body;

    if (!jobPostingId) {
      return NextResponse.json({ ok: false, error: "A target job posting is required." }, { status: 400 });
    }
    if (!Array.isArray(headers) || !Array.isArray(rows) || !mapping) {
      return NextResponse.json({ ok: false, error: "Malformed import payload." }, { status: 400 });
    }

    const { data: job } = await supabase
      .from("job_postings")
      .select("id, title")
      .eq("id", jobPostingId)
      .maybeSingle();

    if (!job) {
      return NextResponse.json({ ok: false, error: "Selected job posting was not found." }, { status: 404 });
    }

    const nameCol = headers.find((h) => mapping[h] === "applicant_name");
    const emailCol = headers.find((h) => mapping[h] === "applicant_email");
    const phoneCol = headers.find((h) => mapping[h] === "applicant_phone");
    const createdCol = headers.find((h) => mapping[h] === "created_at");
    const screeningCols = headers.filter((h) => mapping[h] === "screening");
    const metadataCols = headers.filter((h) => mapping[h] === "metadata");

    const results: Array<{
      row: number;
      status: "created" | "duplicate" | "error";
      applicationId?: string;
      error?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const valueOf = (col: string | undefined) => {
        if (!col) return "";
        const idx = headers.indexOf(col);
        return idx >= 0 ? (row[idx] || "").trim() : "";
      };

      const applicantName = valueOf(nameCol);
      const applicantEmail = valueOf(emailCol).toLowerCase();

      if (!applicantName || !applicantEmail) {
        results.push({ row: i + 1, status: "error", error: "Missing name or email." });
        continue;
      }

      const { data: existing } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_posting_id", jobPostingId)
        .eq("applicant_email", applicantEmail)
        .maybeSingle();

      if (existing) {
        results.push({ row: i + 1, status: "duplicate", applicationId: existing.id });
        continue;
      }

      const screeningAnswers: Record<string, string> = {};
      for (const col of screeningCols) {
        const value = valueOf(col);
        if (value) screeningAnswers[col] = value;
      }

      const sourceMetadata: Record<string, string> = {};
      for (const col of metadataCols) {
        const value = valueOf(col);
        if (value) sourceMetadata[col] = value;
      }
      const originalCreatedTime = valueOf(createdCol);
      if (originalCreatedTime) sourceMetadata.original_created_time = originalCreatedTime;
      sourceMetadata.imported_at = new Date().toISOString();

      const insertPayload = {
        job_posting_id: jobPostingId,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: valueOf(phoneCol) || null,
        cv_path: "manual:no-file-provided",
        proof_of_results_path: null,
        written_test_response: "",
        status: "new",
        internal_notes: "",
        source: "import",
        source_metadata: sourceMetadata,
        screening_answers: screeningAnswers,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("job_applications")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertError) {
        // Unique constraint race: another request inserted the same email concurrently.
        if (insertError.code === "23505") {
          results.push({ row: i + 1, status: "duplicate" });
        } else {
          log("error", { message: "Failed to import candidate row", error: insertError, context: { row: i + 1 } });
          results.push({ row: i + 1, status: "error", error: insertError.message });
        }
        continue;
      }

      results.push({ row: i + 1, status: "created", applicationId: inserted.id });
    }

    const summary = {
      created: results.filter((r) => r.status === "created").length,
      duplicate: results.filter((r) => r.status === "duplicate").length,
      error: results.filter((r) => r.status === "error").length,
    };

    log("info", { message: "Candidate import committed", context: { jobPostingId, summary } });

    return NextResponse.json({ ok: true, summary, results });
  } catch (error) {
    log("error", { message: "Failed to process candidate import", error });
    return NextResponse.json(
      { ok: false, error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
