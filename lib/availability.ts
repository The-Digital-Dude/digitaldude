// Business hours are defined in UK Time (Europe/London), automatically
// adjusting between GMT (UTC+0) and British Summer Time (BST, UTC+1).
export const WORKING_HOURS = { startHour: 9, endHour: 17 };
export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 21;

/**
 * Returns the London timezone offset in minutes for a given UTC instant.
 * (e.g. 0 during GMT, 60 during BST).
 */
function getLondonOffsetMinutes(instant: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(instant);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart) {
      if (tzPart.value === "GMT") return 0;
      const match = tzPart.value.match(/GMT([+-]\d+)(?::(\d+))?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = match[2] ? parseInt(match[2], 10) : 0;
        return hours * 60 + (hours >= 0 ? mins : -mins);
      }
    }
  } catch {
    // Fallback: simple check if between April and October
    const month = instant.getUTCMonth();
    if (month >= 3 && month <= 9) return 60;
  }
  return 0;
}

export function isWorkingDay(date: Date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5; // Monday to Friday
}

/** Generates every slot start time (ISO strings) for a given YYYY-MM-DD date in Europe/London business hours. */
export function generateSlotsForDate(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const baseUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (!isWorkingDay(baseUtc)) return [];

  const slots: string[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");

  for (let hour = WORKING_HOURS.startHour; hour < WORKING_HOURS.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      // Local time string in London
      const testLocal = new Date(Date.UTC(y, m - 1, d, hour, minute));
      const offsetMinutes = getLondonOffsetMinutes(testLocal);
      
      // Compute UTC timestamp corresponding to hour:minute in London
      const utcTimestamp = new Date(Date.UTC(y, m - 1, d, hour, minute) - offsetMinutes * 60_000);
      slots.push(utcTimestamp.toISOString());
    }
  }
  return slots;
}

/** YYYY-MM-DD of the next day, from today, that has bookable working hours left in Europe/London. */
export function nextAvailableDateIso(): string {
  const now = new Date();
  const offset = getLondonOffsetMinutes(now);
  const nowLondon = new Date(now.getTime() + offset * 60_000);
  
  let candidate = new Date(Date.UTC(nowLondon.getUTCFullYear(), nowLondon.getUTCMonth(), nowLondon.getUTCDate()));

  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const isToday = i === 0;
    const currentLondonHour = nowLondon.getUTCHours();
    const stillTimeLeftToday = currentLondonHour < WORKING_HOURS.endHour - 1;
    if (isWorkingDay(candidate) && (!isToday || stillTimeLeftToday)) {
      return candidate.toISOString().slice(0, 10);
    }
    candidate = new Date(candidate.getTime() + 86400000);
  }
  return now.toISOString().slice(0, 10);
}

export function isDateWithinBookingWindow(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const requested = new Date(`${dateStr}T00:00:00Z`);
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const maxDate = new Date(todayUtc.getTime() + BOOKING_WINDOW_DAYS * 86400000);
  return requested >= todayUtc && requested <= maxDate;
}
