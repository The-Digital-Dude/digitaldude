import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import {
  getMemoryAuditIssues,
  updateMemoryAuditIssue,
  setMemoryPageOverride,
  getMemoryPageOverrides,
} from "@/lib/seo/auditStore";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action || "update_status";
  const newStatus = body.status || "resolved";

  const allIssues = getMemoryAuditIssues();
  const issue = allIssues.find((i) => i.id === id);

  if (!issue) {
    return NextResponse.json({ ok: false, error: "Issue not found" }, { status: 404 });
  }

  let appliedOverride: any = null;

  // 1. If applying fix, synthesize and save to page overrides
  if (action === "apply_fix" && issue.suggested_fix) {
    const fix = issue.suggested_fix;
    const existingOverrides = getMemoryPageOverrides();
    const existing = existingOverrides.find((o) => o.pathname === issue.pathname);

    const overridePayload: any = {
      id: existing?.id || crypto.randomUUID(),
      pathname: issue.pathname,
      title: existing?.title,
      meta_description: existing?.meta_description,
      h1: existing?.h1,
      target_keyword: existing?.target_keyword || issue.target_keyword,
      semantic_keywords: existing?.semantic_keywords || [],
      custom_schema: existing?.custom_schema,
      status: "published",
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (fix.field === "title" && fix.recommendedValue) {
      overridePayload.title = fix.recommendedValue;
    } else if (fix.field === "h1" && fix.recommendedValue) {
      overridePayload.h1 = fix.recommendedValue;
    } else if (fix.field === "meta_description" && fix.recommendedValue) {
      overridePayload.meta_description = fix.recommendedValue;
    } else if (fix.field === "content" && fix.extractedKeywords) {
      overridePayload.semantic_keywords = Array.from(
        new Set([...(overridePayload.semantic_keywords || []), ...fix.extractedKeywords])
      );
    } else if (fix.field === "schema" && fix.suggestedSchemaType) {
      overridePayload.custom_schema = {
        type: fix.suggestedSchemaType,
        hasAggregateRating: true,
        ratingValue: "4.9",
        reviewCount: 30,
      };
    }

    setMemoryPageOverride(overridePayload);
    appliedOverride = overridePayload;

    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase.from("seo_page_overrides").upsert({
          pathname: overridePayload.pathname,
          title: overridePayload.title,
          meta_description: overridePayload.meta_description,
          h1: overridePayload.h1,
          target_keyword: overridePayload.target_keyword,
          semantic_keywords: overridePayload.semantic_keywords,
          custom_schema: overridePayload.custom_schema,
          status: "published",
        }, { onConflict: "pathname" });
      }
    } catch {}
  }

  // 2. Update issue status
  const updatedIssue = updateMemoryAuditIssue(id, {
    status: newStatus,
    resolved_at: newStatus === "resolved" ? new Date().toISOString() : undefined,
  });

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase
        .from("seo_audit_issues")
        .update({
          status: newStatus,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    issue: updatedIssue,
    appliedOverride,
  });
}
