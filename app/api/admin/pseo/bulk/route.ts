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
      let cleanSlug = String(item.slug || "").replace(/^\/+|\/+$/g, "");
      const city = item.city || null;
      const serviceSlug = item.service_slug || item.serviceSlug || null;
      const industrySlug = item.industry_slug || item.industrySlug || null;
      const competitorName = item.competitor_name || item.competitorName || null;

      // Auto-derive slug if missing
      if (!cleanSlug) {
        if (city && serviceSlug) {
          cleanSlug = `locations/${city.toLowerCase().replace(/\s+/g, "-")}/${serviceSlug.toLowerCase().replace(/\s+/g, "-")}`;
        } else if (industrySlug && serviceSlug) {
          cleanSlug = `solutions/${industrySlug.toLowerCase().replace(/\s+/g, "-")}/${serviceSlug.toLowerCase().replace(/\s+/g, "-")}`;
        } else if (competitorName) {
          cleanSlug = `compare/custom-software-vs-${competitorName.toLowerCase().replace(/\s+/g, "-")}`;
        }
      }

      // Smart title generation
      const serviceLabel = (serviceSlug || "custom-software").split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const defaultTitle = city
        ? `Bespoke ${serviceLabel} in ${city} | The Digital Dude`
        : industrySlug
        ? `Custom ${serviceLabel} for ${industrySlug.charAt(0).toUpperCase() + industrySlug.slice(1)} | The Digital Dude`
        : competitorName
        ? `Custom Software vs ${competitorName} | The Digital Dude`
        : "Custom Programmatic Page";

      const defaultDescription = city
        ? `High-performance ${serviceLabel.toLowerCase()} in ${city}. Fixed sprint pricing, zero per-seat licensing, and UK/Australia time-zone alignment.`
        : industrySlug
        ? `Tailored ${serviceLabel.toLowerCase()} engineered for ${industrySlug} operations. Automated workflows, zero per-seat fees, and enterprise compliance.`
        : `Compare bespoke software engineering vs ${competitorName || "off-the-shelf SaaS"}. Full IP ownership and zero recurring user licenses.`;

      const defaultHeadline = city
        ? `Bespoke ${serviceLabel} Engineered for ${city} Scaleups`
        : industrySlug
        ? `Custom ${serviceLabel} for High-Growth ${industrySlug.charAt(0).toUpperCase() + industrySlug.slice(1)} Companies`
        : competitorName
        ? `Why High-Growth Companies Choose Custom Software over ${competitorName}`
        : defaultTitle;

      return {
        slug: cleanSlug,
        category: item.category || (city ? "location" : industrySlug ? "solution" : competitorName ? "comparison" : "custom"),
        target_keyword: item.target_keyword || item.targetKeyword || (city ? `${serviceLabel} ${city}` : industrySlug ? `${industrySlug} ${serviceLabel}` : defaultTitle),
        title: item.title || defaultTitle,
        meta_description: item.meta_description || item.metaDescription || defaultDescription,
        hero_badge: item.hero_badge || item.heroBadge || null,
        hero_headline: item.hero_headline || item.heroHeadline || defaultHeadline,
        hero_subheadline: item.hero_subheadline || item.heroSubheadline || null,
        city: city,
        country: item.country || (city ? "United Kingdom" : null),
        region: item.region || null,
        currency: item.currency || (item.country === "Australia" || item.country === "AU" ? "AUD" : "GBP"),
        industry_slug: industrySlug,
        service_slug: serviceSlug,
        competitor_name: competitorName,
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
