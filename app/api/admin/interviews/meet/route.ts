import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { createCandidateInterviewMeeting } from "@/lib/googleCalendar";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      candidateName,
      candidateEmail,
      jobTitle = "Software Role",
      slotStart,
      slotEnd,
      notes,
    } = body;

    if (!candidateName || !candidateEmail || !slotStart) {
      return NextResponse.json(
        { ok: false, error: "candidateName, candidateEmail, and slotStart are required." },
        { status: 400 }
      );
    }

    const result = await createCandidateInterviewMeeting({
      candidateName: String(candidateName).trim(),
      candidateEmail: String(candidateEmail).trim().toLowerCase(),
      jobTitle: String(jobTitle).trim(),
      slotStart,
      slotEnd,
      notes,
    });

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not generate Google Meet room. Ensure Google OAuth is connected or provide meeting link manually.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      meetUrl: result.meetUrl,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    });
  } catch (error) {
    log("error", { message: "Error in interview meet generation route", error });
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
