import { google } from "googleapis";
import { log } from "@/lib/logger";

interface CalendarMeetingParams {
  name: string;
  workEmail: string;
  companyName: string;
  slotStart: string;
  slotEnd: string;
  message?: string;
}

export interface GoogleMeetingResult {
  eventId: string;
  meetUrl: string | null;
  htmlLink: string | null;
}

/**
 * Creates an event on Google Calendar with a unique Google Meet video link
 * and automatically sends calendar invitations to the attendee.
 */
export async function createGoogleCalendarMeeting({
  name,
  workEmail,
  companyName,
  slotStart,
  slotEnd,
  message,
}: CalendarMeetingParams): Promise<GoogleMeetingResult | null> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "info@digitaldude.co.uk";

  if (!clientEmail || !privateKeyRaw) {
    log("info", {
      message: "Google Calendar credentials not configured. Skipping automated Google Calendar event creation.",
    });
    return null;
  }

  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const summary = `Discovery Call: ${companyName} × The Digital Dude`;
    const description = [
      `Discovery call with ${name} from ${companyName}.`,
      `Work Email: ${workEmail}`,
      "",
      "Topics / What they would like to fix:",
      message || "(No message provided)",
      "",
      "— The Digital Dude",
      "https://www.digitaldude.co.uk",
    ].join("\n");

    const requestId = `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all", // Automatically sends Google Calendar invitations to attendees
      requestBody: {
        summary,
        description,
        start: {
          dateTime: slotStart,
        },
        end: {
          dateTime: slotEnd,
        },
        attendees: [
          { email: workEmail, displayName: name },
          { email: calendarId, displayName: "The Digital Dude" },
        ],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
            { method: "popup", minutes: 10 },
          ],
        },
      },
    });

    const event = response.data;
    const meetUrl =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri ||
      null;

    log("info", {
      message: "Google Calendar event with Meet link created successfully",
      context: { eventId: event.id, meetUrl, workEmail },
    });

    return {
      eventId: event.id || "",
      meetUrl,
      htmlLink: event.htmlLink || null,
    };
  } catch (error) {
    log("error", {
      message: "Failed to create Google Calendar event",
      error,
      context: { workEmail, slotStart },
    });
    return null;
  }
}
