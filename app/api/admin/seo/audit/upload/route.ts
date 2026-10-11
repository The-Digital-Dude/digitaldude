import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";
import {
  categorizeSeoIdea,
  synthesizeSuggestedFix,
  extractPathnameFromUrl,
  SeoAuditIssue,
} from "@/lib/seo/auditEngine";
import { addMemoryAuditIssues } from "@/lib/seo/auditStore";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let rows: any[] = [];
    let filename = "uploaded_audit.xlsx";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
      }
      filename = file.name || filename;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    } else {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body.rows)) {
        rows = body.rows;
        filename = body.filename || filename;
      } else if (body.rawBase64) {
        const buffer = Buffer.from(body.rawBase64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        filename = body.filename || filename;
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No rows found in the uploaded file" },
        { status: 400 }
      );
    }

    // Standardize column mappings (Priority, Url, Keyword, Idea)
    const issuesToInsert: SeoAuditIssue[] = [];

    for (const r of rows) {
      const priorityVal = parseFloat(r.Priority || r.priority || r["Priority Score"] || "0") || 0;
      const url = (r.Url || r.url || r.URL || r["Page URL"] || "").toString().trim();
      const keyword = (r.Keyword || r.keyword || r["Target Keyword"] || "").toString().trim();
      const idea = (r.Idea || r.idea || r.Issue || r.Recommendation || "").toString().trim();

      if (!url || !idea) continue;

      const pathname = extractPathnameFromUrl(url);
      const category = categorizeSeoIdea(idea);
      const suggestedFix = synthesizeSuggestedFix(idea, pathname, keyword);

      const issue: SeoAuditIssue = {
        id: crypto.randomUUID(),
        audit_filename: filename,
        url,
        pathname,
        target_keyword: keyword || undefined,
        priority: priorityVal,
        category,
        issue_text: idea,
        suggested_fix: suggestedFix,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      issuesToInsert.push(issue);
    }

    // Persist to in-memory store
    addMemoryAuditIssues(issuesToInsert);

    // Persist to Supabase if database connection is available
    let dbSuccessCount = 0;
    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const dbPayload = issuesToInsert.map((item) => ({
          audit_filename: item.audit_filename,
          url: item.url,
          pathname: item.pathname,
          target_keyword: item.target_keyword,
          priority: item.priority,
          category: item.category,
          issue_text: item.issue_text,
          suggested_fix: item.suggested_fix,
          status: item.status,
        }));

        const { data, error } = await supabase
          .from("seo_audit_issues")
          .insert(dbPayload)
          .select("id");

        if (!error && data) {
          dbSuccessCount = data.length;
        }
      }
    } catch (dbErr: any) {
      console.warn("Notice: Database insert optional fallback active:", dbErr.message);
    }

    return NextResponse.json({
      ok: true,
      filename,
      totalParsed: issuesToInsert.length,
      dbInserted: dbSuccessCount,
      sample: issuesToInsert.slice(0, 3),
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to process audit file" },
      { status: 500 }
    );
  }
}
