import type { LeadStatus, Stage } from "@/lib/crm/model";
import type { FollowUpReason } from "@/lib/crm/followups";

/** A lead as the rep dashboard receives it (the lead row plus the computed CRM fields from GET /api/rep/leads). */
export interface CrmLead {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  lead_source: string;
  stage: Stage;
  status?: LeadStatus;
  estimated_deal_value: number;
  currency: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  expected_close_date?: string | null;
  probability?: number | null;
  country?: string | null;
  tags?: string[] | null;
  lost_reason?: string | null;
  lost_note?: string | null;
  fit_score?: number | null;
  engagement_score?: number | null;
  fit_grade?: "A" | "B" | "C" | "D" | null;
  engagement_label?: "hot" | "warm" | "cold" | null;
  priority?: number | null;
  next_move?: string | null;
  open_tasks?: number;
  next_task_due?: string | null;
  task_overdue?: boolean;
  stale?: boolean;
  days_quiet?: number;
  stale_after?: number | null;
  needs_next_step?: boolean;
  next_task_title?: string | null;
  follow_up_reasons?: FollowUpReason[];
  /** They replied and the team is answering. */
  team_answering?: boolean;
  /** Set for leads that came from the lead pool: "eligible" means cleared to email. */
  pool_contact_status?: string | null;
  email_check?: { status: "safe" | "risky" | "invalid" | "unknown"; reason: string; source: "builtin" | "reacher" } | null;
  proposal_status?: "draft" | "sent" | "viewed" | "accepted" | null;
  proposal_slug?: string | null;
  proposal_views?: number;
}

export interface CrmTask {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  kind: string;
  auto: boolean;
  rep_leads: { full_name: string; company_name: string | null; stage: string } | null;
}

export interface Forecast { currency: string; open: number; weighted: number; won: number; openCount: number }

export interface SavedView { id: string; name: string; filters: ViewFilters }
export interface ViewFilters { stage?: string; status?: string; tag?: string; country?: string; stale?: boolean; grade?: string; q?: string; noNextStep?: boolean; followUp?: FollowUpReason | "any" }

export async function crm<T = Record<string, unknown>>(url: string, method = "GET", body?: unknown): Promise<{ ok: boolean; error?: string } & T> {
  try {
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ...(data as T), ok: res.ok && data.ok !== false, error: data.error ?? (res.ok ? undefined : `Request failed (${res.status})`) } as { ok: boolean; error?: string } & T;
  } catch {
    return { ok: false, error: "Network error" } as { ok: boolean; error?: string } & T;
  }
}

export const money = (v: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(v || 0);
  } catch {
    return `${currency} ${Math.round(v || 0).toLocaleString()}`;
  }
};

export const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export const dueLabel = (iso: string, now = new Date()) => {
  const diff = new Date(iso).getTime() - now.getTime();
  const day = 86_400_000;
  if (diff < 0) return { text: `overdue ${Math.max(1, Math.ceil(-diff / day))}d`, overdue: true };
  if (diff < day) return { text: `today ${new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`, overdue: false };
  return { text: when(iso), overdue: false };
};

export const GRADE_STYLE: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-300",
  B: "bg-sky-500/15 text-sky-300",
  C: "bg-amber-500/15 text-amber-300",
  D: "bg-slate-500/20 text-slate-300",
};
export const HEAT_STYLE: Record<string, string> = {
  hot: "bg-rose-500/15 text-rose-300",
  warm: "bg-amber-500/15 text-amber-300",
  cold: "bg-slate-500/20 text-slate-300",
};

export function applyFilters(leads: CrmLead[], f: ViewFilters): CrmLead[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return leads.filter((l) => {
    if (f.stage && l.stage !== f.stage) return false;
    if (f.status && (l.status ?? "new") !== f.status) return false;
    if (f.tag && !(l.tags ?? []).includes(f.tag)) return false;
    if (f.country && (l.country ?? "").toUpperCase() !== f.country.toUpperCase()) return false;
    if (f.stale && !l.stale) return false;
    if (f.grade && l.fit_grade !== f.grade) return false;
    if (f.noNextStep && !l.needs_next_step) return false;
    if (f.followUp) {
      const r = l.follow_up_reasons ?? [];
      if (f.followUp === "any" ? r.length === 0 : !r.includes(f.followUp)) return false;
    }
    if (q && !`${l.full_name} ${l.email} ${l.company_name ?? ""} ${l.job_title ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
