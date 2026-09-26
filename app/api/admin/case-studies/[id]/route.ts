import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

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
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase.from("case_studies").select("*").eq("id", id).single();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json({ ok: true, caseStudy: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (customSlug !== undefined) updateData.slug = slugify(customSlug);
    if (industry !== undefined) updateData.industry = industry;
    if (tag !== undefined) updateData.tag = tag;
    if (summary !== undefined) updateData.summary = summary;
    if (status !== undefined) updateData.status = status;
    if (image !== undefined) updateData.image = image;
    if (image_alt !== undefined) updateData.image_alt = image_alt;
    if (headline !== undefined) updateData.headline = headline;
    if (page_summary !== undefined) updateData.page_summary = page_summary;
    if (stats !== undefined) updateData.stats = Array.isArray(stats) ? stats : [];
    if (challenge !== undefined) updateData.challenge = challenge;
    if (what_we_built !== undefined) updateData.what_we_built = Array.isArray(what_we_built) ? what_we_built : [];
    if (what_changed !== undefined) updateData.what_changed = what_changed;
    if (what_changed_label !== undefined) updateData.what_changed_label = what_changed_label;
    if (built_with !== undefined) updateData.built_with = built_with;
    if (related !== undefined) updateData.related = Array.isArray(related) ? related : [];

    const { data, error } = await supabase
      .from("case_studies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "A case study with this URL slug already exists." },
          { status: 409 }
        );
      }
      log("error", { message: "Failed to update case study", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Case study updated successfully", context: { id } });
    return NextResponse.json({ ok: true, caseStudy: data });
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
    const { error } = await supabase.from("case_studies").delete().eq("id", id);
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
