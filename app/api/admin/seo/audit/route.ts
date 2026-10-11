import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getMemoryAuditIssues, setMemoryAuditIssues } from "@/lib/seo/auditStore";

export async function GET(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const pathnameFilter = searchParams.get("pathname") || "";
  const search = (searchParams.get("search") || "").toLowerCase();

  let allIssues = getMemoryAuditIssues();

  // Try fetching from Supabase
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("seo_audit_issues")
        .select("*")
        .order("priority", { ascending: false });

      if (!error && data && data.length > 0) {
        allIssues = data;
        setMemoryAuditIssues(data);
      }
    }
  } catch {}

  // Filter
  let filtered = allIssues;

  if (statusFilter !== "all") {
    filtered = filtered.filter((i) => i.status === statusFilter);
  }

  if (categoryFilter !== "all") {
    filtered = filtered.filter((i) => i.category === categoryFilter);
  }

  if (pathnameFilter) {
    filtered = filtered.filter((i) => i.pathname === pathnameFilter);
  }

  if (search) {
    filtered = filtered.filter(
      (i) =>
        i.issue_text.toLowerCase().includes(search) ||
        i.url.toLowerCase().includes(search) ||
        (i.target_keyword && i.target_keyword.toLowerCase().includes(search))
    );
  }

  // Summary Metrics
  const metrics = {
    total: allIssues.length,
    open: allIssues.filter((i) => i.status === "open").length,
    resolved: allIssues.filter((i) => i.status === "resolved").length,
    dismissed: allIssues.filter((i) => i.status === "dismissed").length,
    highPriority: allIssues.filter((i) => Number(i.priority) >= 2.0).length,
    categories: {
      metadata: allIssues.filter((i) => i.category === "metadata").length,
      content: allIssues.filter((i) => i.category === "content").length,
      schema: allIssues.filter((i) => i.category === "schema").length,
      crawlability: allIssues.filter((i) => i.category === "crawlability").length,
      backlinks: allIssues.filter((i) => i.category === "backlinks").length,
      general: allIssues.filter((i) => i.category === "general").length,
    },
    uniqueUrls: Array.from(new Set(allIssues.map((i) => i.pathname))).length,
  };

  return NextResponse.json({
    ok: true,
    issues: filtered,
    metrics,
  });
}

export async function DELETE(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  setMemoryAuditIssues([]);

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.from("seo_audit_issues").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
  } catch {}

  return NextResponse.json({ ok: true, message: "All audit issues cleared." });
}
