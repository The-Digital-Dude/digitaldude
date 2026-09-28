import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { log } from "@/lib/logger";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, jobs: [] });
  }

  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      log("error", { message: "Failed to fetch open job postings", error });
      return NextResponse.json({ ok: true, jobs: [] });
    }

    return NextResponse.json({ ok: true, jobs: data || [] });
  } catch (error) {
    log("error", { message: "Exception fetching job postings", error });
    return NextResponse.json({ ok: true, jobs: [] });
  }
}
