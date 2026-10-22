/**
 * Lead scoring, two separate axes (as CRM guidance recommends): FIT (does this person and company look like who we sell to) and
 * ENGAGEMENT (what they have actually done). They are shown separately; a great-fit lead with no engagement is "next up", a very
 * engaged lead who is a poor fit does not outrank a good one. Email "opens" are deliberately not used: mail apps pre-load images,
 * so opens say little about a person.
 */

export type Grade = "A" | "B" | "C" | "D";
export interface Factor { label: string; points: number }

export interface FitInput {
  jobTitle?: string | null;
  email: string;
  /** Result of the email address check, if there is one. */
  emailStatus?: "safe" | "risky" | "invalid" | "unknown" | null;
  hasPhone?: boolean;
  hasCompany?: boolean;
  /** 0-100 research fit score of the linked pool company, if there is one. */
  companyFit?: number | null;
  /** Is the lead's country enabled for outreach? null = unknown. */
  countryAllowed?: boolean | null;
  /** Does the lead's industry match an enabled market? null = unknown. */
  industryMatch?: boolean | null;
}

const FREE_MAIL = /@(gmail|googlemail|yahoo|hotmail|outlook|live|msn|icloud|me|aol|proton|protonmail|gmx|mail|yandex|zoho)\./i;
const SENIOR = /\b(owner|founder|co-?founder|ceo|cto|coo|cfo|managing director|director|head of|principal|partner|president|vp|vice president|general manager|proprietor)\b/i;
const MID = /\b(manager|lead|senior|supervisor)\b/i;
const JUNIOR = /\b(intern|student|assistant|coordinator|junior|trainee|receptionist)\b/i;

export const gradeFor = (score: number): Grade => (score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D");
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function fitScore(i: FitInput): { score: number; grade: Grade; factors: Factor[] } {
  const f: Factor[] = [{ label: "Starting point", points: 30 }];
  const add = (label: string, points: number) => { if (points !== 0) f.push({ label, points }); };
  if (typeof i.companyFit === "number") add(`Company research fit (${Math.round(i.companyFit)}/100)`, Math.round(Math.max(0, Math.min(100, i.companyFit)) * 0.3));
  const title = i.jobTitle ?? "";
  if (SENIOR.test(title)) add("Senior decision-maker title", 15);
  else if (MID.test(title)) add("Manager-level title", 8);
  else if (JUNIOR.test(title)) add("Junior title", -10);
  if (i.industryMatch === true) add("Industry matches a market we target", 8);
  if (i.countryAllowed === true) add("Country is enabled for outreach", 8);
  if (i.countryAllowed === false) add("Country is not enabled for outreach", -10);
  add(FREE_MAIL.test(i.email) ? "Personal (free) email address" : "Business email address", FREE_MAIL.test(i.email) ? -15 : 8);
  if (i.emailStatus === "safe") add("Email address checked OK", 4);
  if (i.emailStatus === "risky") add("Email address looks risky", -6);
  if (i.emailStatus === "invalid") add("Email address cannot receive mail", -40);
  if (i.hasPhone) add("Has a phone number", 3);
  if (i.hasCompany) add("Company is known", 2);
  const score = clamp(f.reduce((s, x) => s + x.points, 0));
  return { score, grade: gradeFor(score), factors: f };
}

export interface EngagementInput {
  /** Classifications of real replies from this person ("interested", "not_interested", "uncertain", "opt_out"...). */
  replies: string[];
  pageViews: number;
  buttonClicks: number;
  booked: boolean;
  bounced: boolean;
  optedOut: boolean;
  emailsSent: number;
  daysSinceActivity: number | null;
}

export type EngagementLabel = "hot" | "warm" | "cold";

export function engagementScore(i: EngagementInput): { score: number; label: EngagementLabel; factors: Factor[] } {
  if (i.optedOut) return { score: 0, label: "cold", factors: [{ label: "Asked not to be contacted", points: 0 }] };
  const f: Factor[] = [];
  const add = (label: string, points: number) => { if (points !== 0) f.push({ label, points }); };
  const interested = i.replies.filter((r) => r === "interested").length;
  const neutral = i.replies.filter((r) => r === "uncertain").length;
  const declined = i.replies.filter((r) => r === "not_interested").length;
  add("Interested reply", Math.min(interested, 1) * 40);
  add("Replied", Math.min(neutral, 1) * 20);
  add("Replied that they are not interested", declined > 0 ? -20 : 0);
  add("Opened their personal booking page", Math.min(i.pageViews, 3) * 8);
  add("Clicked the book button", Math.min(i.buttonClicks, 2) * 12);
  add("Booked a call", i.booked ? 60 : 0);
  add("An email bounced", i.bounced ? -30 : 0);
  const unanswered = i.replies.length === 0 && !i.booked ? Math.max(0, i.emailsSent - 3) : 0;
  add("Several emails with no response", -Math.min(unanswered * 2, 10));
  const raw = f.reduce((s, x) => s + x.points, 0);
  const d = i.daysSinceActivity;
  const decay = d === null || d <= 14 ? 1 : d <= 30 ? 0.8 : 0.5;
  if (decay < 1) f.push({ label: `No activity for ${d} days`, points: Math.round(raw * decay) - raw });
  const score = clamp(raw * decay);
  return { score, label: score >= 60 ? "hot" : score >= 30 ? "warm" : "cold", factors: f };
}

/** One number for sorting: fit counts a little more than engagement, so a great-fit lead is never buried by a noisy poor-fit one. */
export const priorityScore = (fit: number, engagement: number) => Math.round(fit * 0.6 + engagement * 0.4);

/** What to do with it, in words (the two scores are always shown too). */
export function nextMove(fit: Grade, engagement: EngagementLabel, optedOut = false): string {
  if (optedOut) return "Do not contact";
  if (engagement === "hot") return fit === "D" ? "Engaged but a weak fit: reply, then qualify" : "Work now";
  if (engagement === "warm") return fit === "A" || fit === "B" ? "Follow up" : "Keep warm";
  return fit === "A" ? "Next up: strong fit, no response yet" : fit === "B" ? "Worth a follow-up" : "Low priority";
}
