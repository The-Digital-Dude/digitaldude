import { acqEnv } from "../env";

/** Booking is a link to the existing calendar scheduler; nothing is built from scratch. */
export function getBookingUrl(): string | null {
  return acqEnv().bookingUrl || null;
}
