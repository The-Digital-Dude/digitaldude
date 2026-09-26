import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendNotification } from "@/lib/sendNotification";

export async function POST(request: Request) {
  const body = await request.json();

  const { name, workEmail, companyName, country, teamSize, message, company } = body ?? {};

  // Hidden honeypot field: real visitors never fill this in.
  if (typeof company === "string" && company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !workEmail || !companyName || !country || !message) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The contact form isn't connected to a database yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("contact_submissions").insert({
    name,
    work_email: workEmail,
    company_name: companyName,
    country,
    team_size: teamSize || null,
    message,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not save your message." }, { status: 500 });
  }

  await sendNotification({ name, workEmail, companyName, country, teamSize, message });

  return NextResponse.json({ ok: true, firstName: String(name).split(" ")[0] });
}
