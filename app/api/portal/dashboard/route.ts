import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedClient } from "@/lib/clientAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const client = await getAuthenticatedClient(request);
  if (!client) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    // 1. Fetch project details
    const { data: project, error: pErr } = await supabase
      .from("client_projects")
      .select("*")
      .eq("id", client.id)
      .single();

    if (pErr || !project) {
      return NextResponse.json({ ok: false, error: "Project workspace not found." }, { status: 404 });
    }

    // 2. Fetch milestones
    const { data: milestones } = await supabase
      .from("client_milestones")
      .select("*")
      .eq("project_id", client.id)
      .order("order_index", { ascending: true });

    // 3. Fetch updates / changelog
    const { data: updates } = await supabase
      .from("client_updates")
      .select("*")
      .eq("project_id", client.id)
      .order("published_at", { ascending: false });

    // 4. Fetch support tickets
    const { data: tickets } = await supabase
      .from("client_tickets")
      .select("*")
      .eq("project_id", client.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ok: true,
      project,
      milestones: milestones || [],
      updates: updates || [],
      tickets: tickets || [],
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
