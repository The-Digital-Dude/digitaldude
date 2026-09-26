import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { log } from "@/lib/logger";

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

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
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json({ ok: true, post: data });
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
      excerpt,
      content,
      cover_image,
      author,
      category,
      status,
      meta_title,
      meta_description,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (customSlug !== undefined) updateData.slug = slugify(customSlug);
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) {
      updateData.content = content;
      updateData.reading_time_minutes = calculateReadingTime(content);
    }
    if (cover_image !== undefined) updateData.cover_image = cover_image || null;
    if (author !== undefined) updateData.author = author;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;

    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "An article with this slug already exists." },
          { status: 409 }
        );
      }
      log("error", { message: "Failed to update post", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Post updated successfully", context: { id } });
    return NextResponse.json({ ok: true, post: data });
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
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      log("error", { message: "Failed to delete post", error, context: { id } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Post deleted successfully", context: { id } });
    return NextResponse.json({ ok: true, message: "Post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
