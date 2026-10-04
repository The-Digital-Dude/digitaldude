import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { isAdminAuthenticated } from "@/lib/adminAuth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("pseo_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, page: data });
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  const allowedFields = [
    "title",
    "meta_description",
    "hero_badge",
    "hero_headline",
    "hero_subheadline",
    "target_keyword",
    "status",
    "custom_content",
    "faqs",
    "stats",
    "comparison_matrix"
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("pseo_pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, page: data });
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("pseo_pages")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: true });
}
