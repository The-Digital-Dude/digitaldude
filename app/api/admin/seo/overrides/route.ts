import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import {
  getMemoryPageOverrides,
  setMemoryPageOverride,
  SeoPageOverride,
} from "@/lib/seo/auditStore";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  let overrides = getMemoryPageOverrides();

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const query = supabase.from("seo_page_overrides").select("*").order("updated_at", { ascending: false });
      if (pathname) {
        query.eq("pathname", pathname);
      }
      const { data, error } = await query;
      if (!error && data) {
        overrides = data;
      }
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    overrides,
  });
}

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pathname = (body.pathname || "").trim();

    if (!pathname) {
      return NextResponse.json({ ok: false, error: "Missing pathname" }, { status: 400 });
    }

    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

    const overridePayload: SeoPageOverride = {
      id: body.id || crypto.randomUUID(),
      pathname: normalizedPath,
      title: body.title?.trim() || undefined,
      meta_description: body.meta_description?.trim() || undefined,
      h1: body.h1?.trim() || undefined,
      target_keyword: body.target_keyword?.trim() || undefined,
      semantic_keywords: Array.isArray(body.semantic_keywords)
        ? body.semantic_keywords.filter(Boolean)
        : [],
      canonical_url: body.canonical_url?.trim() || undefined,
      noindex: Boolean(body.noindex),
      custom_schema: body.custom_schema || undefined,
      og_image: body.og_image?.trim() || undefined,
      status: body.status || "published",
      notes: body.notes?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMemoryPageOverride(overridePayload);

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
          canonical_url: overridePayload.canonical_url,
          noindex: overridePayload.noindex,
          custom_schema: overridePayload.custom_schema,
          og_image: overridePayload.og_image,
          status: overridePayload.status,
          notes: overridePayload.notes,
        }, { onConflict: "pathname" });
      }
    } catch (e: any) {
      console.warn("Database override save error:", e.message);
    }

    return NextResponse.json({
      ok: true,
      override: overridePayload,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to save override" },
      { status: 500 }
    );
  }
}
