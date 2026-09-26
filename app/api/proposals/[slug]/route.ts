import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { DEMO_PROPOSAL, Proposal } from "@/lib/content/proposals";
import { log } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing proposal slug" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, proposal: data });
      }
    } catch (err) {
      log("warn", { message: "Supabase proposal lookup notice", error: err });
    }
  }

  // Fallback demo matching
  if (slug === DEMO_PROPOSAL.slug || slug.startsWith("TDD-SPEC-DEMO")) {
    return NextResponse.json({ ok: true, proposal: DEMO_PROPOSAL });
  }

  // Generic fallback if proposal was created locally / in-memory
  const dynamicFallback: Proposal = {
    ...DEMO_PROPOSAL,
    slug: slug,
    project_title: `Custom Architecture & Technical Specification (${slug})`,
  };

  return NextResponse.json({ ok: true, proposal: dynamicFallback });
}
