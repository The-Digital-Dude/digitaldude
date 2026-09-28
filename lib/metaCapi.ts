import crypto from "crypto";
import { log } from "@/lib/logger";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "621170946348283";
const META_CAPI_ACCESS_TOKEN =
  process.env.META_CAPI_ACCESS_TOKEN ||
  "EAAXPGkqfCM8BSm8PYVQPIUupZATd6gaDrjmobZAt4nZCx4QqMBLTsdATYb4NhKCA7iGBHkch6HGOS5wcCFzx4CqnoNkFzshiTARosy1XK5dmkUCyJeZC9GN4wZBqsPWjEjKZAlmxgK5j2yZArLzP9ZBSFxydvHz4EzH7yOuJELuivFA5uqFeG5f8rmJdrlqbizBV6AZDZD";

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

export interface MetaCapiEventParams {
  eventName: "PageView" | "Lead" | "Schedule" | "Contact" | "SubmitApplication" | string;
  eventId?: string;
  eventSourceUrl?: string;
  user: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
    fbp?: string | null;
    fbc?: string | null;
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

  if (user.clientIpAddress) userDataPayload.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) userDataPayload.client_user_agent = user.clientUserAgent;
  if (user.fbp) userDataPayload.fbp = user.fbp;
  if (user.fbc) userDataPayload.fbc = user.fbc;

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
