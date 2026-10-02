/**
 * Meta Pixel & Conversions API (CAPI) Client-Side Event Tracker & Parameter Builder
 * Automatically captures Click ID (fbc), Browser ID (fbp), and user parameters
 * to maximize Event Match Quality (EMQ) and enable dual browser & server tracking.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "621170946348283";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `meta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, val: string, maxAgeDays = 90) {
  if (typeof document === "undefined") return;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(val)};path=/;max-age=${maxAgeSeconds};SameSite=Lax`;
}

/**
 * Parameter Builder: Ensure _fbp (Browser ID) is always generated & persisted
 * in both first-party cookies and localStorage.
 */
export function getOrSetFbp(): string | undefined {
  if (typeof window === "undefined") return undefined;

  let fbp = getCookie("_fbp");
  if (fbp) {
    try {
      localStorage.setItem("_fbp", fbp);
    } catch {
      // Ignore localStorage errors in private browsing
    }
    return fbp;
  }

  try {
    fbp = localStorage.getItem("_fbp") || undefined;
    if (fbp) {
      setCookie("_fbp", fbp);
      return fbp;
    }
  } catch {
    // Ignore localStorage errors
  }

  // Generate standard Meta _fbp format: fb.1.<creationTimestamp>.<randomNumber>
  const creationTime = Date.now();
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
  fbp = `fb.1.${creationTime}.${randomNum}`;

  setCookie("_fbp", fbp);
  try {
    localStorage.setItem("_fbp", fbp);
  } catch {
    // Ignore
  }

  return fbp;
}

/**
 * Parameter Builder: Ensure _fbc (Facebook Click ID) is captured from URL query 'fbclid',
 * formatted per Meta specs (fb.1.<creationTimestamp>.<fbclid>), and persisted.
 */
export function getOrSetFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;

  // 1. Check if landing URL has fbclid query parameter
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    if (fbclid) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      setCookie("_fbc", fbc);
      try {
        localStorage.setItem("_fbc", fbc);
      } catch {
        // Ignore
      }
      return fbc;
    }
  } catch {
    // URL parsing fallback
  }

  // 2. Check existing cookie
  let fbc = getCookie("_fbc");
  if (fbc) {
    try {
      localStorage.setItem("_fbc", fbc);
    } catch {
      // Ignore
    }
    return fbc;
  }

  // 3. Fallback to localStorage
  try {
    fbc = localStorage.getItem("_fbc") || undefined;
    if (fbc) {
      setCookie("_fbc", fbc);
      return fbc;
    }
  } catch {
    // Ignore
  }

  return undefined;
}

/**
 * Returns all current browser-side Meta matching parameters.
 */
export function getMetaBrowserData(): {
  fbp?: string;
  fbc?: string;
  clientUserAgent?: string;
} {
  if (typeof window === "undefined") return {};
  return {
    fbp: getOrSetFbp(),
    fbc: getOrSetFbc(),
    clientUserAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
}

export interface UserTrackingData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientUserAgent?: string | null;
}

/**
 * Dispatch server-side CAPI event in background (fire-and-forget)
 */
function sendCapiEventAsync(payload: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  user?: UserTrackingData;
}) {
  if (typeof window === "undefined") return;

  const browserData = getMetaBrowserData();
  const mergedUser: UserTrackingData = {
    fbp: payload.user?.fbp || browserData.fbp,
    fbc: payload.user?.fbc || browserData.fbc,
    clientUserAgent: payload.user?.clientUserAgent || browserData.clientUserAgent,
    email: payload.user?.email,
    phone: payload.user?.phone,
    firstName: payload.user?.firstName,
    lastName: payload.user?.lastName,
    country: payload.user?.country,
    externalId: payload.user?.externalId,
  };

  const url = payload.eventSourceUrl || window.location.href;
  const body = JSON.stringify({
    eventName: payload.eventName,
    eventId: payload.eventId,
    eventSourceUrl: url,
    customData: payload.customData || {},
    user: mergedUser,
  });

  // Use sendBeacon if available for reliable background dispatch on page unloads/transitions
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/tracking/event", blob);
  } else {
    fetch("/api/tracking/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Ignore background network errors
    });
  }
}

/**
 * Track PageView with automatic Pixel + CAPI deduplication & parameter builder
 */
export function pageview(options: Record<string, unknown> = {}, user?: UserTrackingData) {
  if (typeof window === "undefined") return;

  const eventId = generateEventId();
  const currentUrl = window.location.href;

  // 1. Browser-side Meta Pixel tracking
  if (window.fbq) {
    window.fbq("track", "PageView", options, { eventID: eventId });
  }

  // 2. Server-side Conversions API tracking
  sendCapiEventAsync({
    eventName: "PageView",
    eventId,
    eventSourceUrl: currentUrl,
    customData: options,
    user,
  });
}

/**
 * Track standard Meta events (ViewContent, Contact, Schedule, Lead, SubmitApplication, etc.)
 */
export function event(
  name: string,
  options: Record<string, unknown> = {},
  customEventId?: string,
  user?: UserTrackingData
) {
  if (typeof window === "undefined") return;

  const eventId = customEventId || generateEventId();
  const currentUrl = window.location.href;

  // 1. Browser-side Meta Pixel
  if (window.fbq) {
    window.fbq("track", name, options, { eventID: eventId });
  }

  // 2. Server-side Conversions API
  sendCapiEventAsync({
    eventName: name,
    eventId,
    eventSourceUrl: currentUrl,
    customData: options,
    user,
  });
}

/**
 * Track custom Meta events (e.g. ClickCTA, DownloadPDF, ExploreCareers)
 */
export function customEvent(
  name: string,
  options: Record<string, unknown> = {},
  customEventId?: string,
  user?: UserTrackingData
) {
  if (typeof window === "undefined") return;

  const eventId = customEventId || generateEventId();
  const currentUrl = window.location.href;

  // 1. Browser-side Meta Pixel
  if (window.fbq) {
    window.fbq("trackCustom", name, options, { eventID: eventId });
  }

  // 2. Server-side Conversions API
  sendCapiEventAsync({
    eventName: name,
    eventId,
    eventSourceUrl: currentUrl,
    customData: options,
    user,
  });
}

/**
 * Standard Event: ViewContent
 */
export function trackViewContent(
  options: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  },
  eventId?: string,
  user?: UserTrackingData
) {
  event("ViewContent", options, eventId, user);
}

/**
 * Standard Event: Contact
 */
export function trackContact(
  options: {
    content_name?: string;
    content_category?: string;
    status?: string;
    destination?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("Contact", options, eventId, user);
}

/**
 * Standard Event: Lead
 */
export function trackLead(
  options: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("Lead", options, eventId, user);
}

/**
 * Standard Event: Schedule
 */
export function trackSchedule(
  options: {
    content_name?: string;
    appointment_date?: string;
    appointment_type?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("Schedule", options, eventId, user);
}

/**
 * Standard Event: SubmitApplication
 */
export function trackSubmitApplication(
  options: {
    content_name?: string;
    content_category?: string;
    job_slug?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("SubmitApplication", options, eventId, user);
}

/**
 * Standard Event: Search
 */
export function trackSearch(
  options: {
    search_string: string;
    content_category?: string;
    [key: string]: unknown;
  },
  eventId?: string,
  user?: UserTrackingData
) {
  event("Search", options, eventId, user);
}

/**
 * Standard Event: InitiateCheckout
 */
export function trackInitiateCheckout(
  options: {
    content_ids?: string[];
    content_category?: string;
    num_items?: number;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("InitiateCheckout", options, eventId, user);
}

/**
 * Standard Event: AddToCart
 */
export function trackAddToCart(
  options: {
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  },
  eventId?: string,
  user?: UserTrackingData
) {
  event("AddToCart", options, eventId, user);
}

/**
 * Standard Event: Purchase
 */
export function trackPurchase(
  options: {
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    value: number;
    currency: string;
    transaction_id?: string;
    [key: string]: unknown;
  },
  eventId?: string,
  user?: UserTrackingData
) {
  event("Purchase", options, eventId, user);
}

/**
 * Standard Event: CompleteRegistration
 */
export function trackCompleteRegistration(
  options: {
    content_name?: string;
    status?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string,
  user?: UserTrackingData
) {
  event("CompleteRegistration", options, eventId, user);
}
