/**
 * Meta Pixel Client-Side Event Tracker
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "621170946348283";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function pageview() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
}

export function event(name: string, options: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventId) {
      window.fbq("track", name, options, { eventID: eventId });
    } else {
      window.fbq("track", name, options);
    }
  }
}

export function customEvent(name: string, options: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventId) {
      window.fbq("trackCustom", name, options, { eventID: eventId });
    } else {
      window.fbq("trackCustom", name, options);
    }
  }
}
