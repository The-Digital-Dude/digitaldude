import crypto from "crypto";
import { log } from "@/lib/logger";

// No hardcoded fallback for either value: the access token especially must
// only ever come from the environment. A prior version of this file had the
// real token committed directly as a fallback default — in a public GitHub
// repo, which exposed it to the entire internet from the moment it was
// pushed. That token must be rotated in Meta Business Settings; removing it
// from source here does not invalidate a token already leaked in git history.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

function hashSha256(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  // Remove non-digit characters except leading plus if any
  const clean = phone.replace(/[^0-9]/g, "");
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

const COUNTRY_TO_ISO: Record<string, string> = {
  australia: "au",
  "united kingdom": "gb",
  uk: "gb",
  "united states": "us",
  usa: "us",
  canada: "ca",
  "new zealand": "nz",
  singapore: "sg",
  germany: "de",
  "united arab emirates": "ae",
  uae: "ae",
  bangladesh: "bd",
  india: "in",
  pakistan: "pk",
  ireland: "ie",
  france: "fr",
  spain: "es",
  italy: "it",
  netherlands: "nl",
  switzerland: "ch",
};

function hashCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  const clean = country.trim().toLowerCase();
  const code = COUNTRY_TO_ISO[clean] || (clean.length === 2 ? clean : undefined);
  if (!code) return undefined;
  return crypto.createHash("sha256").update(code).digest("hex");
}

function isValidIpAddress(ip?: string | null): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  if (clean === "unknown" || clean === "localhost") return false;
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ipv4Regex.test(clean) || (clean.includes(":") && ipv6Regex.test(clean));
}

export interface MetaCapiEventParams {
  eventName: "PageView" | "Lead" | "Schedule" | "Contact" | "SubmitApplication" | "ViewContent" | "ClickCTA" | string;
  eventId?: string;
  eventSourceUrl?: string;
  user: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    country?: string | null;
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    /**
     * A stable identifier from our own system (e.g. a booking or
     * application row id) — distinct from email/phone, and the one
     * genuinely missing matching parameter Meta's Event Match Quality
     * tooling flagged. Hashed the same way as the other identifiers before
     * being sent; Meta never receives the raw id.
     */
    externalId?: string | null;
  };
  customData?: Record<string, unknown>;
}

export async function sendMetaCapiEvent(params: MetaCapiEventParams) {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) {
    log("warn", { message: "Meta CAPI skipped: Pixel ID or Access Token missing" });
    return { ok: false, skipped: true };
  }

  const { eventName, eventId, eventSourceUrl, user, customData } = params;

  const userDataPayload: Record<string, unknown> = {};

  const hashedEmail = hashSha256(user.email);
  if (hashedEmail) userDataPayload.em = [hashedEmail];

  const hashedPhone = hashPhone(user.phone);
  if (hashedPhone) userDataPayload.ph = [hashedPhone];

  const hashedFn = hashSha256(user.firstName);
  if (hashedFn) userDataPayload.fn = [hashedFn];

  const hashedLn = hashSha256(user.lastName);
  if (hashedLn) userDataPayload.ln = [hashedLn];

  const hashedCountry = hashCountry(user.country);
  if (hashedCountry) userDataPayload.country = [hashedCountry];

  if (user.clientIpAddress && isValidIpAddress(user.clientIpAddress)) {
    userDataPayload.client_ip_address = user.clientIpAddress.trim();
  }
  if (user.clientUserAgent && user.clientUserAgent.trim()) {
    userDataPayload.client_user_agent = user.clientUserAgent.trim();
  }
  if (user.fbp && user.fbp.trim()) userDataPayload.fbp = user.fbp.trim();
  if (user.fbc && user.fbc.trim()) userDataPayload.fbc = user.fbc.trim();

  const hashedExternalId = hashSha256(user.externalId);
  if (hashedExternalId) userDataPayload.external_id = [hashedExternalId];

  // Validate that user_data contains at least one parameter required by Meta
  const hasUserDataKeys = Object.keys(userDataPayload).length > 0;
  if (!hasUserDataKeys) {
    log("warn", {
      message: "Meta CAPI: No user_data match parameters available for event",
      context: { eventName, eventId },
    });
  }

  const testEventCode = process.env.META_TEST_EVENT_CODE || undefined;

  const eventPayload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || crypto.randomUUID(),
    action_source: "website",
    event_source_url: eventSourceUrl || "https://www.digitaldude.co.uk",
    user_data: userDataPayload,
    custom_data: customData || {},
  };

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
  };
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  const url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    if (!response.ok) {
      log("warn", { message: "Meta CAPI error response", error: result, context: { eventName } });
      return { ok: false, error: result };
    }

    log("info", {
      message: "Meta CAPI event sent successfully",
      context: { eventName, eventId: eventPayload.event_id, eventsReceived: result.events_received },
    });
    return { ok: true, result };
  } catch (error) {
    log("error", { message: "Meta CAPI dispatch failed", error, context: { eventName } });
    return { ok: false, error: (error as Error).message };
  }
}
