import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { caseStudies as fallbackCaseStudies } from "@/lib/content/caseStudies";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  if (supabase) {
    try {
      // Check by UUID or by slug
      let query = supabase.from("case_studies").select("*");
      if (id.includes("-") && id.length > 30) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }

      const { data, error } = await query.single();
      if (!error && data) {
        return NextResponse.json({ ok: true, caseStudy: data });
      }
    } catch {
      // Fallback
    }
  }

  // Check fallback list
  const fallback = fallbackCaseStudies.find((c) => c.slug === id || `case_study_${c.slug}` === id);
  if (fallback) {
    return NextResponse.json({
      ok: true,
      caseStudy: {
        id: fallback.slug,
        slug: fallback.slug,
        title: fallback.title,
        industry: fallback.industry,
        tag: fallback.tag,
        summary: fallback.summary,
        status: fallback.status,
        image: fallback.image,
        image_alt: fallback.imageAlt,
        headline: fallback.headline,
        page_summary: fallback.pageSummary,
        stats: fallback.stats,
        challenge: fallback.challenge,
        what_we_built: fallback.whatWeBuilt,
        what_changed: fallback.whatChanged,
        what_changed_label: fallback.whatChangedLabel,
        built_with: fallback.builtWith,
        related: fallback.related,
        created_at: new Date().toISOString(),
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Case study not found" }, { status: 404 });
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
      title,
      slug: customSlug,
      industry,
      tag,
      summary,
      status,
      image,
      image_alt,
      headline,
      page_summary,
      stats,
      challenge,
      what_we_built,
      what_changed,
      what_changed_label,
      built_with,
      related,
    } = body;

    const targetSlug = customSlug ? slugify(customSlug) : (id.includes("-") && id.length > 30 ? undefined : slugify(id));

    const upsertData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) upsertData.title = title;
    if (targetSlug !== undefined) upsertData.slug = targetSlug;
    if (industry !== undefined) upsertData.industry = industry;
    if (tag !== undefined) upsertData.tag = tag;
    if (summary !== undefined) upsertData.summary = summary;
    if (status !== undefined) upsertData.status = status;
    if (image !== undefined) upsertData.image = image;
    if (image_alt !== undefined) upsertData.image_alt = image_alt;
    if (headline !== undefined) upsertData.headline = headline;
    if (page_summary !== undefined) upsertData.page_summary = page_summary;
    if (stats !== undefined) upsertData.stats = Array.isArray(stats) ? stats : [];
    if (challenge !== undefined) upsertData.challenge = challenge;
    if (what_we_built !== undefined) upsertData.what_we_built = Array.isArray(what_we_built) ? what_we_built : [];
    if (what_changed !== undefined) upsertData.what_changed = what_changed;
    if (what_changed_label !== undefined) upsertData.what_changed_label = what_changed_label;
    if (built_with !== undefined) upsertData.built_with = built_with;
    if (related !== undefined) upsertData.related = Array.isArray(related) ? related : [];

    let result;
    if (id.includes("-") && id.length > 30) {
      // It is a UUID
      result = await supabase
        .from("case_studies")
        .update(upsertData)
        .eq("id", id)
        .select()
        .single();
    } else {
      // It is a slug (from fallback seed) -> upsert by slug
      result = await supabase
        .from("case_studies")
        .upsert({ ...upsertData, slug: targetSlug || id }, { onConflict: "slug" })
        .select()
        .single();
    }

    if (result.error) {
      log("error", { message: "Failed to update/upsert case study", error: result.error, context: { id } });
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }

    log("info", { message: "Case study updated successfully", context: { id } });
    return NextResponse.json({ ok: true, caseStudy: result.data });
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

  try {
    let query = supabase.from("case_studies").delete();
    if (id.includes("-") && id.length > 30) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", id);
    }

    const { error } = await query;
    if (error) {
      log("error", { message: "Failed to delete case study", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    log("info", { message: "Case study deleted successfully", context: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
