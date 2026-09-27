import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { caseStudies as fallbackCaseStudies, type CaseStudy } from "@/lib/content/caseStudies";

export async function getCaseStudies(): Promise<CaseStudy[]> {
  // Only fall back to the hardcoded array when Supabase is genuinely
  // unconfigured/unreachable — a real, configured query that returns zero
  // rows (every case study unpublished) must render as empty, not silently
  // substitute the static content as if it were still live in the database.
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .in("status", ["Live", "Delivered"])
        .order("created_at", { ascending: false });

      if (!error) {
        return (data || []).map((d) => ({
          slug: d.slug,
          industry: d.industry,
          tag: d.tag,
          title: d.title,
          summary: d.summary,
          status: d.status,
          image: d.image,
          imageAlt: d.image_alt || d.title,
          headline: d.headline,
          pageSummary: d.page_summary,
          stats: Array.isArray(d.stats) ? d.stats : [],
          challenge: d.challenge,
          whatWeBuilt: Array.isArray(d.what_we_built) ? d.what_we_built : [],
          whatChanged: d.what_changed,
          whatChangedLabel: d.what_changed_label || "What changed",
          builtWith: d.built_with,
          related: Array.isArray(d.related) ? d.related : [],
        }));
      }
    }
  } catch {}

  return fallbackCaseStudies;
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("case_studies")
        .select("*")
        .eq("slug", slug)
        .in("status", ["Live", "Delivered"])
        .single();

      if (data) {
        return {
          slug: data.slug,
          industry: data.industry,
          tag: data.tag,
          title: data.title,
          summary: data.summary,
          status: data.status,
          image: data.image,
          imageAlt: data.image_alt || data.title,
          headline: data.headline,
          pageSummary: data.page_summary,
          stats: Array.isArray(data.stats) ? data.stats : [],
          challenge: data.challenge,
          whatWeBuilt: Array.isArray(data.what_we_built) ? data.what_we_built : [],
          whatChanged: data.what_changed,
          whatChangedLabel: data.what_changed_label || "What changed",
          builtWith: data.built_with,
          related: Array.isArray(data.related) ? data.related : [],
        };
      }

      // PGRST116 = no row matched (a genuine "not found" from a working
      // query) — that must 404, not silently render stale hardcoded content
      // for a case study that was actually deleted or unpublished.
      if (error && error.code === "PGRST116") {
        return null;
      }
    } catch {
      // Supabase reachable but the call itself failed (network/connection) —
      // fall through to the static fallback below.
    }
  }

  const match = fallbackCaseStudies.find((c) => c.slug === slug);
  return match || null;
}
