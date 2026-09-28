import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getAuthenticatedClient } from "@/lib/clientAuth";
import { sendAdminTicketAlertEmail } from "@/lib/clientEmails";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await getAuthenticatedClient(request);
  if (!client) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { subject, description, category = "general", urgency = "normal" } = body;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Subject and ticket description are required." },
        { status: 400 }
      );
    }

    const { data: ticket, error } = await supabase
      .from("client_tickets")
      .insert([
        {
          project_id: client.id,
          subject: subject.trim(),
          description: description.trim(),
          category,
          urgency,
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Send instant email alert to admin
    try {
      await sendAdminTicketAlertEmail({
        clientName: client.client_name,
        clientEmail: client.client_email,
        projectTitle: client.project_title,
        subject: subject.trim(),
        category,
        urgency,
        description: description.trim(),
      });
    } catch (mailErr) {
      log("warn", { message: "Could not send admin ticket alert email", error: mailErr });
    }

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
