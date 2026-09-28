/**
 * Meta Pixel & Conversions API (CAPI) Client-Side Event Tracker
 * Enables dual browser-side & server-side event tracking with deduplication.
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

/**
 * Dispatch server-side CAPI event in background (fire-and-forget)
 */
function sendCapiEventAsync(payload: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;

  const url = payload.eventSourceUrl || window.location.href;
  const body = JSON.stringify({
    eventName: payload.eventName,
    eventId: payload.eventId,
    eventSourceUrl: url,
    customData: payload.customData || {},
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
 * Track PageView with automatic Pixel + CAPI deduplication
 */
export function pageview(options: Record<string, unknown> = {}) {
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
  });
}

/**
 * Track standard Meta events (ViewContent, Contact, Schedule, Lead, etc.)
 */
export function event(
  name: string,
  options: Record<string, unknown> = {},
  customEventId?: string
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
  });
}

/**
 * Track custom Meta events (e.g. ClickCTA, DownloadPDF, ExploreCareers)
 */
export function customEvent(
  name: string,
  options: Record<string, unknown> = {},
  customEventId?: string
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
  });
}
