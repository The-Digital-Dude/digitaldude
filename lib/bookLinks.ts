import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/utils";

type Db = SupabaseClient;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // no look-alike characters (0/O, 1/l/I)
export const CODE_RE = /^[A-Za-z0-9]{8,12}$/;

/** 10 random characters from a 55-letter alphabet: not guessable, not sequential. */
export function newCode(len = 10): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export const bookLinkUrl = (code: string) => `${SITE_URL}/b/${code}`;

export interface BookLink {
  id: string;
  code: string;
  employee_id: string | null;
  contact_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  company_name: string | null;
  industry: string | null;
  stage: "cold" | "follow_up";
  source: string;
  template_used: string | null;
  design: string | null;
  views: number;
  cta_clicks: number;
  booking_id: string | null;
  expires_at: string;
}

export interface NewBookLink {
  employeeId: string | null;
  contactId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  companyName?: string | null;
  industry?: string | null;
  stage: "cold" | "follow_up";
  source?: "rep_outreach" | "rep_drip" | "admin_campaign";
  templateUsed?: string | null;
  design?: string | null;
}

/** Creates the private link for one email. Returns null on failure so the caller can fall back to the plain referral link. */
export async function createBookLink(db: Db, n: NewBookLink): Promise<{ code: string; url: string } | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newCode();
    const { error } = await db.from("rep_book_links").insert({
      code,
      employee_id: n.employeeId,
      contact_id: n.contactId ?? null,
      recipient_email: n.recipientEmail?.trim().toLowerCase() || null,
      recipient_name: n.recipientName?.trim().slice(0, 200) || null,
      company_name: n.companyName?.trim().slice(0, 200) || null,
      industry: n.industry?.trim().slice(0, 80) || null,
      stage: n.stage,
      source: n.source ?? "rep_outreach",
      template_used: n.templateUsed?.slice(0, 120) || null,
      design: n.design?.slice(0, 40) || null,
    });
    if (!error) return { code, url: bookLinkUrl(code) };
    if (error.code !== "23505") return null; // not a code clash: give up (the email still goes out with the plain link)
  }
  return null;
}

export async function getBookLink(db: Db, code: string): Promise<BookLink | null> {
  if (!CODE_RE.test(code)) return null;
  const { data } = await db.from("rep_book_links").select("*").eq("code", code).maybeSingle();
  return (data as BookLink | null) ?? null;
}

/** Link scanners and crawlers open links too: they must not count as a prospect's view. */
export const isBot = (userAgent: string | null | undefined) => !userAgent || /bot|crawl|spider|preview|scan|fetch|monitor|headless|python|curl|wget|go-http|java\//i.test(userAgent);

export async function recordView(db: Db, code: string): Promise<void> {
  await db.rpc("rep_book_link_view", { p_code: code });
}

export async function recordClick(db: Db, code: string): Promise<void> {
  await db.rpc("rep_book_link_click", { p_code: code });
}

/** Marks the link as having led to a booking (first booking wins). */
export async function markBooked(db: Db, code: string, bookingId: string): Promise<void> {
  await db.from("rep_book_links").update({ booking_id: bookingId, booked_at: new Date().toISOString() }).eq("code", code).is("booking_id", null);
}

export const isExpired = (l: Pick<BookLink, "expires_at">, now = new Date()) => Date.parse(l.expires_at) < now.getTime();
