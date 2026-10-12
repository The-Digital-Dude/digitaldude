/** Central, validated access to acquisition-system configuration. */

export function acqEnv() {
  return {
    /** Hard ceiling on a campaign's daily send limit, regardless of what is typed in the UI. */
    maxDailyLimit: Math.max(1, Number.parseInt(process.env.ACQ_MAX_DAILY_LIMIT ?? "5", 10) || 5),
    operatorName: (process.env.ACQ_OPERATOR_NAME ?? "admin").trim() || "admin",
    bookingUrl: process.env.ACQ_BOOKING_URL || process.env.NEXT_PUBLIC_GOOGLE_APPOINTMENT_URL || "",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.digitaldude.co.uk").replace(/\/$/, ""),
  };
}

/** Required secret for signing unsubscribe links. Throws rather than falling back to a weak default. */
export function unsubscribeSecret(): string {
  const s = process.env.ACQ_UNSUBSCRIBE_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ACQ_UNSUBSCRIBE_SECRET must be set to a random string of at least 32 characters");
  }
  return s;
}

export function webhookSecret(): string | null {
  const s = process.env.ACQ_WEBHOOK_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function unsubscribeUrlFor(token: string): string {
  return `${acqEnv().siteUrl}/api/acquisition/unsubscribe?t=${encodeURIComponent(token)}`;
}
