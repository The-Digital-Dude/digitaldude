import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
import { caseStudies as fallbackCaseStudies } from "@/lib/content/caseStudies";
import { parsePageParams, isRangeNotSatisfiableError } from "@/lib/adminPagination";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Only fall back to the static 7 when Supabase is genuinely
  // unconfigured/unreachable — a configured query returning zero rows (all
  // deleted) must show an empty admin list, not silently re-present the
  // hardcoded content as if it were still in the database.
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const industry = searchParams.get("industry")?.trim();
  const { page, pageSize, from, to } = parsePageParams(searchParams);

  if (supabase) {
    try {
      let query = supabase
        .from("case_studies")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (industry && industry !== "all") query = query.eq("industry", industry);
      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,industry.ilike.%${search}%`);
      }

      query = query.range(from, to);
      let { data, error, count } = await query;

      if (error && isRangeNotSatisfiableError(error)) {
        ({ count } = await query.range(0, 0));
        data = [];
        error = null;
      }

      if (!error) {
        return NextResponse.json({ ok: true, caseStudies: data || [], totalCount: count || 0, page, pageSize });
      }
      log("warn", { message: "Supabase case studies query error", error });
    } catch (err) {
      log("warn", { message: "Supabase case studies query fallback", error: err });
    }
  }

  // Fallback to the 7 production case studies so they are always manageable in Admin
  const formattedFallbacks = fallbackCaseStudies.map((c) => ({
    id: c.slug,
    slug: c.slug,
    title: c.title,
    industry: c.industry,
    tag: c.tag,
    summary: c.summary,
    status: c.status,
    image: c.image,
    image_alt: c.imageAlt,
    headline: c.headline,
    page_summary: c.pageSummary,
    stats: c.stats,
    challenge: c.challenge,
    what_we_built: c.whatWeBuilt,
    what_changed: c.whatChanged,
    what_changed_label: c.whatChangedLabel,
    built_with: c.builtWith,
    related: c.related,
    created_at: new Date().toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    caseStudies: formattedFallbacks,
    totalCount: formattedFallbacks.length,
    page: 1,
    pageSize: formattedFallbacks.length || 25,
  });
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

  try {
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      industry = "Custom Software",
      tag = "Production · UK & Australia",
      summary,
      status = "Live",
      image = "/images/case-studies/property-compliance.svg",
      image_alt,
      headline,
      page_summary,
      stats = [],
      challenge,
      what_we_built = [],
      what_changed,
      what_changed_label = "What changed",
      built_with = "Next.js, TypeScript, Supabase, Tailwind CSS",
      related = [],
    } = body;

    if (!title || !headline || !challenge || !what_changed) {
      return NextResponse.json(
        { ok: false, error: "Title, headline, challenge, and what changed are required." },
        { status: 400 }
      );
    }

    const slug = customSlug ? slugify(customSlug) : slugify(title);

    const payload = {
      title,
      slug,
      industry,
      tag,
      summary: summary || headline,
      status,
      image,
      image_alt: image_alt || title,
      headline,
      page_summary: page_summary || summary || headline,
      stats: Array.isArray(stats) ? stats : [],
      challenge,
      what_we_built: Array.isArray(what_we_built) ? what_we_built : [],
      what_changed,
      what_changed_label,
      built_with,
      related: Array.isArray(related) ? related : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("case_studies").insert(payload).select().single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "A case study with this URL slug already exists." },
          { status: 409 }
        );
      }
      log("error", { message: "Failed to create case study", error, context: { slug } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Case study created successfully", context: { slug } });
    return NextResponse.json({ ok: true, caseStudy: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
