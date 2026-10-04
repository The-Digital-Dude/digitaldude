import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Items array is required and cannot be empty." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase database client not configured." },
        { status: 503 }
      );
    }

    const formattedRows = items.map((item: any) => {
      const cleanSlug = String(item.slug || "").replace(/^\/+|\/+$/g, "");
      return {
        slug: cleanSlug,
        category: item.category || "custom",
        target_keyword: item.target_keyword || item.targetKeyword || item.title || cleanSlug,
        title: item.title || "Custom Page",
        meta_description: item.meta_description || item.metaDescription || "",
        hero_badge: item.hero_badge || item.heroBadge || null,
        hero_headline: item.hero_headline || item.heroHeadline || item.title || "Headline",
        hero_subheadline: item.hero_subheadline || item.heroSubheadline || null,
        city: item.city || null,
        country: item.country || null,
        region: item.region || null,
        currency: item.currency || "GBP",
        industry_slug: item.industry_slug || item.industrySlug || null,
        service_slug: item.service_slug || item.serviceSlug || null,
        competitor_name: item.competitor_name || item.competitorName || null,
        featured_case_study_slug: item.featured_case_study_slug || item.featuredCaseStudySlug || null,
        custom_content: item.custom_content || item.customContent || null,
        faqs: Array.isArray(item.faqs) ? item.faqs : [],
        stats: Array.isArray(item.stats) ? item.stats : [],
        comparison_matrix: Array.isArray(item.comparison_matrix || item.comparisonMatrix)
          ? item.comparison_matrix || item.comparisonMatrix
          : [],
        status: item.status || "published",
        updated_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase
      .from("pseo_pages")
      .upsert(formattedRows, { onConflict: "slug" })
      .select("id, slug, title, status");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Auto-dispatch published URLs to IndexNow in background
    const publishedSlugs = formattedRows
      .filter((r) => r.status === "published")
      .map((r) => `/${r.slug}`);

    if (publishedSlugs.length > 0) {
      try {
        const { submitToIndexNow } = await import("@/lib/pseo/indexNow");
        await submitToIndexNow(publishedSlugs);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      count: data?.length || formattedRows.length,
      imported: data
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
