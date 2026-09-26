// Business hours are defined in UTC as a simple approximation of UK time
// (daylight saving isn't adjusted for). Change these to fit real availability.
export const WORKING_HOURS = { startHour: 9, endHour: 17 };
export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 21;

export function isWorkingDay(date: Date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5; // Monday to Friday
}

/** Generates every slot start time (ISO strings) for a given YYYY-MM-DD date. */
export function generateSlotsForDate(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  if (!isWorkingDay(base)) return [];

  const slots: string[] = [];
  for (let hour = WORKING_HOURS.startHour; hour < WORKING_HOURS.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push(new Date(Date.UTC(y, m - 1, d, hour, minute)).toISOString());
    }
  }
  return slots;
}

/** YYYY-MM-DD (UTC) of the next day, from today, that has bookable working hours left. */
export function nextAvailableDateIso(): string {
  const now = new Date();
  let candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Search the full booking window (not just 14 days) to avoid falling back
  // to today when the window still has available weekdays.
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const isToday = i === 0;
    const stillTimeLeftToday = now.getUTCHours() < WORKING_HOURS.endHour - 1;
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

