import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  categorizeSeoIdea,
  synthesizeSuggestedFix,
  extractPathnameFromUrl,
  SeoAuditIssue,
} from "@/lib/seo/auditEngine";
import { addMemoryAuditIssues } from "@/lib/seo/auditStore";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const defaultFilePath = "C:\\Users\\USER\\Downloads\\gmmg\\ideas_digitaldude.co.uk_20261010.xlsx";
  let buffer: Buffer | null = null;

  try {
    if (fs.existsSync(defaultFilePath)) {
      buffer = fs.readFileSync(defaultFilePath);
    }
  } catch {}

  if (!buffer) {
    return NextResponse.json(
      { ok: false, error: `Could not access file at: ${defaultFilePath}` },
      { status: 404 }
    );
  }

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

    const issues: SeoAuditIssue[] = [];

    for (const r of rows) {
      const priorityVal = parseFloat(r.Priority || r.priority || "0") || 0;
      const url = (r.Url || r.url || "").toString().trim();
      const keyword = (r.Keyword || r.keyword || "").toString().trim();
      const idea = (r.Idea || r.idea || "").toString().trim();

      if (!url || !idea) continue;

      const pathname = extractPathnameFromUrl(url);
      const category = categorizeSeoIdea(idea);
      const suggestedFix = synthesizeSuggestedFix(idea, pathname, keyword);

      issues.push({
        id: crypto.randomUUID(),
        audit_filename: path.basename(defaultFilePath),
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
      });
    }

    addMemoryAuditIssues(issues);

    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase.from("seo_audit_issues").insert(
          issues.map((i) => ({
            audit_filename: i.audit_filename,
            url: i.url,
            pathname: i.pathname,
            target_keyword: i.target_keyword,
            priority: i.priority,
            category: i.category,
            issue_text: i.issue_text,
            suggested_fix: i.suggested_fix,
            status: i.status,
          }))
        );
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      totalLoaded: issues.length,
      filename: path.basename(defaultFilePath),
      message: `Successfully ingested ${issues.length} SEO audit ideas from SEMrush export!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to parse default file" },
      { status: 500 }
    );
  }
}
