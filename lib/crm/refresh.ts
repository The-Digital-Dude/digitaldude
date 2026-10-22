import type { SupabaseClient } from "@supabase/supabase-js";
import { loadChecks } from "@/lib/acquisition/verify/bulk";
import { engagementScore, fitScore, type EngagementLabel, type Grade } from "./scoring";

type Db = SupabaseClient;

export interface ScoredLead {
  id: string;
  employee_id: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  country?: string | null;
  acq_contact_id?: string | null;
  last_activity_at?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  anonymized_at?: string | null;
  fit_score?: number | null;
  engagement_score?: number | null;
  score_updated_at?: string | null;
}

export interface LeadScores {
  fit: number;
  fitGrade: Grade;
  engagement: number;
  engagementLabel: EngagementLabel;
}

/** How long a saved score is trusted by the list before it is recomputed (events refresh it sooner). */
export const SCORE_MAX_AGE_MS = 30 * 60_000;

function chunk<T>(list: T[], size = 150): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function inChunks<T>(values: string[], run: (part: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (const part of chunk([...new Set(values)])) out.push(...(await run(part)));
  return out;
}

/** Computes fit and engagement for these leads from what the system knows, and saves the scores on the lead rows. */
export async function computeScores(db: Db, leads: ScoredLead[], now = new Date()): Promise<Map<string, LeadScores>> {
  const out = new Map<string, LeadScores>();
  const live = leads.filter((l) => !l.anonymized_at);
  if (live.length === 0) return out;
  const ids = live.map((l) => l.id);
  const emails = live.map((l) => l.email.trim().toLowerCase());

  const [checks, activities, links, suppressed, rules, contacts] = await Promise.all([
    loadChecks(db, emails).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>),
    inChunks<{ lead_id: string; type: string; details: Record<string, unknown> | null; occurred_at: string }>(ids, async (p) => {
      const { data } = await db.from("rep_lead_activities").select("lead_id,type,details,occurred_at").in("lead_id", p).in("type", ["email_reply", "email_sent", "booking"]);
      return (data ?? []) as never[];
    }),
    inChunks<{ employee_id: string | null; recipient_email: string | null; views: number; cta_clicks: number; booking_id: string | null }>(emails, async (p) => {
      const { data } = await db.from("rep_book_links").select("employee_id,recipient_email,views,cta_clicks,booking_id").in("recipient_email", p);
      return (data ?? []) as never[];
    }),
    inChunks<{ normalized_email: string; reason: string }>(emails, async (p) => {
      const { data } = await db.from("acq_suppressions").select("normalized_email,reason").in("normalized_email", p);
      return (data ?? []) as never[];
    }),
    db.from("acq_country_rules").select("country,email_allowed").then((r) => (r.data ?? []) as { country: string; email_allowed: boolean }[]),
    inChunks<{ id: string; company_id: string | null }>(live.map((l) => l.acq_contact_id).filter((x): x is string => !!x), async (p) => {
      const { data } = await db.from("acq_contacts").select("id,company_id").in("id", p);
      return (data ?? []) as never[];
    }),
  ]);

  const companyIds = contacts.map((c) => c.company_id).filter((x): x is string => !!x);
  const companyFit = new Map<string, number>();
  for (const c of await inChunks<{ id: string; fit_score: number | null }>(companyIds, async (p) => {
    const { data } = await db.from("acq_companies").select("id,fit_score").in("id", p);
    return (data ?? []) as never[];
  })) if (typeof c.fit_score === "number") companyFit.set(c.id, c.fit_score);
  const contactCompany = new Map(contacts.map((c) => [c.id, c.company_id]));
  const countryRule = new Map(rules.map((r) => [r.country.toUpperCase(), r.email_allowed]));
  const suppressionOf = new Map(suppressed.map((s) => [s.normalized_email, s.reason]));

  const nowIso = now.toISOString();
  const writes: Promise<unknown>[] = [];
  for (const lead of live) {
    const email = lead.email.trim().toLowerCase();
    const acts = activities.filter((a) => a.lead_id === lead.id);
    const replies = acts.filter((a) => a.type === "email_reply").map((a) => String((a.details as { classification?: string } | null)?.classification ?? "uncertain"));
    const myLinks = links.filter((k) => k.recipient_email === email && k.employee_id === lead.employee_id);
    const reason = suppressionOf.get(email);
    const optedOut = reason === "unsubscribe" || reason === "reply_opt_out" || reason === "objection" || reason === "spam_complaint" || replies.includes("opt_out");
    const lastTouch = Math.max(Date.parse(lead.last_activity_at ?? "") || 0, Date.parse(lead.last_contacted_at ?? "") || 0);
    const check = checks[email];
    const companyId = lead.acq_contact_id ? contactCompany.get(lead.acq_contact_id) : null;
    const fit = fitScore({
      email,
      jobTitle: lead.job_title,
      emailStatus: check?.status ?? null,
      hasPhone: !!lead.phone,
      hasCompany: !!lead.company_name,
      companyFit: companyId ? (companyFit.get(companyId) ?? null) : null,
      countryAllowed: lead.country && countryRule.has(lead.country.toUpperCase()) ? countryRule.get(lead.country.toUpperCase())! : null,
    });
    const eng = engagementScore({
      replies: replies.filter((r) => r !== "out_of_office" && r !== "bounce"),
      pageViews: myLinks.reduce((s, k) => s + (k.views || 0), 0),
      buttonClicks: myLinks.reduce((s, k) => s + (k.cta_clicks || 0), 0),
      booked: acts.some((a) => a.type === "booking") || myLinks.some((k) => !!k.booking_id),
      bounced: reason === "hard_bounce" || replies.includes("bounce"),
      optedOut,
      emailsSent: acts.filter((a) => a.type === "email_sent").length,
      daysSinceActivity: lastTouch ? Math.floor((now.getTime() - lastTouch) / 86_400_000) : null,
    });
    out.set(lead.id, { fit: fit.score, fitGrade: fit.grade, engagement: eng.score, engagementLabel: eng.label });
    if (lead.fit_score !== fit.score || lead.engagement_score !== eng.score || !lead.score_updated_at) {
      writes.push(Promise.resolve(db.from("rep_leads").update({ fit_score: fit.score, engagement_score: eng.score, score_updated_at: nowIso }).eq("id", lead.id)));
    } else {
      writes.push(Promise.resolve(db.from("rep_leads").update({ score_updated_at: nowIso }).eq("id", lead.id)));
    }
  }
  await Promise.allSettled(writes);
  return out;
}

/** Reloads these leads and recomputes their scores (called after an event such as a reply, a booking or a manual note). */
export async function refreshScores(db: Db, leadIds: string[]): Promise<void> {
  if (leadIds.length === 0) return;
  const rows: ScoredLead[] = [];
  for (const part of chunk(leadIds)) {
    const { data } = await db.from("rep_leads").select("id,employee_id,email,phone,company_name,job_title,country,acq_contact_id,last_activity_at,last_contacted_at,created_at,anonymized_at,fit_score,engagement_score,score_updated_at").in("id", part);
    rows.push(...((data ?? []) as ScoredLead[]));
  }
  await computeScores(db, rows);
}

/** Recomputes the scores of every (not erased) lead with this address, whoever owns it. */
export async function refreshScoresForEmail(db: Db, email: string): Promise<void> {
  const { data } = await db.from("rep_leads").select("id").eq("email", email.trim().toLowerCase()).is("anonymized_at", null);
  await refreshScores(db, ((data ?? []) as { id: string }[]).map((r) => r.id));
}

export const scoresAreFresh = (l: Pick<ScoredLead, "score_updated_at">, now = new Date()) => !!l.score_updated_at && now.getTime() - Date.parse(l.score_updated_at) < SCORE_MAX_AGE_MS;
