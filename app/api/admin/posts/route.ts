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

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      log("error", { message: "Failed to fetch posts in admin", error });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, posts: data || [] });
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
      excerpt,
      content,
      cover_image,
      author,
      category,
      status = "published",
      meta_title,
      meta_description,
    } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { ok: false, error: "Title, excerpt, and content are required." },
        { status: 400 }
      );
    }

    const slug = customSlug ? slugify(customSlug) : slugify(title);
    const readingTime = calculateReadingTime(content);

    const postData = {
      title,
      slug,
      excerpt,
      content,
      cover_image: cover_image || null,
      author: author || "The Digital Dude",
      category: category || "Custom Software",
      status,
      reading_time_minutes: readingTime,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("posts").insert(postData).select().single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "An article with this slug already exists. Please choose another slug." },
          { status: 409 }
        );
      }
      log("error", { message: "Failed to create post", error, context: { slug } });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    log("info", { message: "Blog post created successfully", context: { slug } });
    return NextResponse.json({ ok: true, post: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
