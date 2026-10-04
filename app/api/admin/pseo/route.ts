import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getAllCodePseoPages } from "@/lib/pseo/engine";
import { PseoPageData } from "@/lib/pseo/types";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const category = searchParams.get("category")?.trim() || "all";
  const status = searchParams.get("status")?.trim() || "all";

  // 1. Get base code pages
  const codePages = getAllCodePseoPages();
  const pageMap = new Map<string, PseoPageData>();

  for (const p of codePages) {
    pageMap.set(p.slug, { ...p, status: "published" });
  }

  // 2. Overlay Supabase overrides if configured
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("pseo_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        for (const row of data) {
          const existing = pageMap.get(row.slug);
          pageMap.set(row.slug, {
            ...(existing || {}),
            id: row.id,
            slug: row.slug,
            category: row.category,
            targetKeyword: row.target_keyword || row.title,
            title: row.title,
            metaDescription: row.meta_description,
            heroBadge: row.hero_badge || "",
            heroHeadline: row.hero_headline,
            heroSubheadline: row.hero_subheadline || "",
            city: row.city,
            country: row.country,
            region: row.region,
            currency: row.currency,
            industrySlug: row.industry_slug,
            serviceSlug: row.service_slug,
            competitorName: row.competitor_name,
            featuredCaseStudySlug: row.featured_case_study_slug,
            customContent: row.custom_content,
            faqs: Array.isArray(row.faqs) ? row.faqs : [],
            stats: Array.isArray(row.stats) ? row.stats : [],
            comparisonMatrix: Array.isArray(row.comparison_matrix) ? row.comparison_matrix : undefined,
            status: row.status,
            breadcrumbs: existing?.breadcrumbs || [
              { label: "Home", url: "/" },
              { label: row.title, url: `/${row.slug}` }
            ]
          });
        }
      }
    }
  } catch {}

  let allPages = Array.from(pageMap.values());

  // Metrics
  const metrics = {
    total: allPages.length,
    locations: allPages.filter((p) => p.category === "location").length,
    solutions: allPages.filter((p) => p.category === "solution").length,
    comparisons: allPages.filter((p) => p.category === "comparison").length,
    custom: allPages.filter((p) => p.category === "custom").length,
    dbOverrides: allPages.filter((p) => Boolean(p.id)).length,
  };

  // Filter
  if (category !== "all") {
    allPages = allPages.filter((p) => p.category === category);
  }
  if (status !== "all") {
    allPages = allPages.filter((p) => p.status === status);
  }
  if (search) {
    allPages = allPages.filter(
      (p) =>
        p.slug.toLowerCase().includes(search) ||
        p.title.toLowerCase().includes(search) ||
        p.targetKeyword.toLowerCase().includes(search) ||
        (p.city && p.city.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    ok: true,
    metrics,
    pages: allPages,
    totalCount: allPages.length
  });
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      category,
      targetKeyword,
      title,
      metaDescription,
      heroBadge,
      heroHeadline,
      heroSubheadline,
      city,
      country,
      region,
      currency,
      industrySlug,
      serviceSlug,
      competitorName,
      featuredCaseStudySlug,
      customContent,
      faqs,
      stats,
      comparisonMatrix,
      status = "published"
    } = body;

    if (!slug || !title || !metaDescription || !heroHeadline) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (slug, title, metaDescription, heroHeadline)" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.replace(/^\/+|\/+$/g, "");
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase database client not configured." },
        { status: 503 }
      );
    }

    const payload = {
      slug: cleanSlug,
      category: category || "custom",
      target_keyword: targetKeyword || title,
      title,
      meta_description: metaDescription,
      hero_badge: heroBadge || null,
      hero_headline: heroHeadline,
      hero_subheadline: heroSubheadline || null,
      city: city || null,
      country: country || null,
      region: region || null,
      currency: currency || "GBP",
      industry_slug: industrySlug || null,
      service_slug: serviceSlug || null,
      competitor_name: competitorName || null,
      featured_case_study_slug: featuredCaseStudySlug || null,
      custom_content: customContent || null,
      faqs: faqs || [],
      stats: stats || [],
      comparison_matrix: comparisonMatrix || [],
      status,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("pseo_pages")
      .upsert(payload, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, page: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
