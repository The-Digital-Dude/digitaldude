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

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) return null;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Builds the one-time Google consent URL with optional state. Used only by the setup route. */
export function buildGoogleConsentUrl(state?: string) {
  const client = getGoogleOAuthClient();
  if (!client) return null;

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token even if previously authorized
    scope: CALENDAR_SCOPES,
    state,
  });
}

function getAuthorizedClient() {
  const client = getGoogleOAuthClient();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!client || !refreshToken) return null;

  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export interface BusyInterval {
  start: string;
  end: string;
}

/**
 * Returns the busy intervals on the real Google Calendar between timeMin and
 * timeMax (ISO strings). Returns null if OAuth isn't configured or the query
 * fails, so callers can fall back to "no calendar conflicts known" rather
 * than blocking bookings entirely on a transient Google API issue.
 */
export async function getBusyIntervals(
  timeMin: string,
  timeMax: string
): Promise<BusyInterval[] | null> {
  const auth = getAuthorizedClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!auth) return null;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy || [];
    return busy
      .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
      .map((b) => ({ start: b.start, end: b.end }));
  } catch (error) {
    log("error", {
      message: "Failed to fetch Google Calendar free/busy",
      error,
      context: { timeMin, timeMax },
    });
    return null;
  }
}

/**
 * Creates an event on the founder's real Google Calendar (via OAuth2, not a
 * service account — service accounts cannot create Meet links or invite
 * attendees on a personal, non-Workspace calendar; see git history for the
 * live-tested proof). Sends calendar invitations automatically.
 */
export async function createGoogleCalendarMeeting({
  name,
  workEmail,
  companyName,
  slotStart,
  slotEnd,
  message,
}: CalendarMeetingParams): Promise<GoogleMeetingResult | null> {
  const auth = getAuthorizedClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!auth) {
    log("info", {
      message: "Google Calendar OAuth not configured. Skipping automated Meet creation.",
    });
    return null;
  }

  try {
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
        start: { dateTime: slotStart },
        end: { dateTime: slotEnd },
        attendees: [{ email: workEmail, displayName: name }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
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
