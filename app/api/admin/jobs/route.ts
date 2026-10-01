import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";
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

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();
  // Other callers (candidate-add/import modals' job-posting dropdowns) fetch
  // this endpoint with no page param and expect every open role back —
  // pagination only kicks in when the admin jobs list page explicitly asks.
  const isPaginated = searchParams.has("page") || searchParams.has("pageSize");

  try {
    let query = supabase
      .from("job_postings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("title", `%${search}%`);
    if (status && status !== "all") query = query.eq("status", status);

    if (isPaginated) {
      const { from, to } = parsePageParams(searchParams);
      query = query.range(from, to);
    }

    let { data, error, count } = await query;

    if (error && isRangeNotSatisfiableError(error)) {
      ({ count } = await query.range(0, 0));
      data = [];
      error = null;
    }

    if (error) {
      log("error", { message: "Failed to fetch job postings in admin", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { page, pageSize } = parsePageParams(searchParams);
    return NextResponse.json({ ok: true, jobs: data || [], totalCount: count ?? (data || []).length, page, pageSize });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
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
      department = "General",
      location = "Remote",
      employment_type = "Full-time",
      compensation_summary = "",
      description,
      status = "draft",
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { ok: false, error: "Title and description are required." },
        { status: 400 }
      );
    }

    const slug = customSlug ? slugify(customSlug) : slugify(title);

    const { data, error } = await supabase
      .from("job_postings")
      .insert({
        title,
        slug,
        department,
        location,
        employment_type,
        compensation_summary,
        description,
        status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "A job posting with this URL slug already exists." },
          { status: 409 }
        );
      }
      log("error", { message: "Failed to create job posting", error, context: { slug } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Job posting created", context: { slug } });
    return NextResponse.json({ ok: true, job: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
