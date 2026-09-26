import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.digitaldude.co.uk";
