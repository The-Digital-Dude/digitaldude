import { z } from "zod";

/** Shared CRM vocabulary: stages, statuses, lost reasons, activity types and the validation for everything a rep can send. */

export const STAGES = ["new", "contacted", "meeting_booked", "negotiation", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];
export const OPEN_STAGES: Stage[] = ["new", "contacted", "meeting_booked", "negotiation"];
export const STAGE_LABELS: Record<Stage, string> = { new: "New", contacted: "Contacted", meeting_booked: "Meeting booked", negotiation: "Negotiation", won: "Won", lost: "Lost" };

export const STATUSES = ["new", "attempted", "connected", "interested", "bad_timing", "unqualified"] as const;
export type LeadStatus = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<LeadStatus, string> = { new: "New", attempted: "Attempted to contact", connected: "Connected", interested: "Interested", bad_timing: "Bad timing", unqualified: "Unqualified" };

export const LOST_REASONS = ["no_budget", "no_need", "chose_competitor", "no_response", "bad_timing", "not_a_fit", "other"] as const;
export type LostReason = (typeof LOST_REASONS)[number];
export const LOST_REASON_LABELS: Record<LostReason, string> = {
  no_budget: "No budget", no_need: "No need", chose_competitor: "Chose a competitor", no_response: "Never responded", bad_timing: "Bad timing", not_a_fit: "Not a fit", other: "Other",
};

export const ACTIVITY_TYPES = ["created", "email_sent", "email_reply", "call", "meeting", "linkedin", "whatsapp", "note", "stage_change", "status_change", "task_done", "booking", "reassigned", "system"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
/** What a rep can log by hand (everything else is written by the system). */
export const MANUAL_ACTIVITY_TYPES = ["call", "meeting", "linkedin", "whatsapp", "note"] as const;

export const CALL_OUTCOMES = ["connected", "voicemail", "no_answer", "wrong_number", "call_back"] as const;
export const MEETING_OUTCOMES = ["booked", "held", "no_show", "rescheduled"] as const;
export const MESSAGE_OUTCOMES = ["message_sent", "reply_received"] as const;

export const TASK_KINDS = ["manual", "follow_up", "respond", "prepare_call"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const CURRENCY_BY_COUNTRY: Record<string, string> = { AU: "AUD", GB: "GBP", US: "USD", IE: "EUR", NL: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", BD: "BDT", CA: "CAD", NZ: "NZD", SG: "SGD" };
export const CURRENCIES = ["AUD", "GBP", "USD", "EUR", "BDT", "CAD", "NZD", "SGD"] as const;
export const currencyFor = (country: string | null | undefined, fallback = "BDT") => CURRENCY_BY_COUNTRY[(country ?? "").toUpperCase()] ?? fallback;

const text = (max: number) => z.string().trim().max(max);
const iso2 = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a 2-letter country code like AU");
const tag = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9 _-]{0,29}$/, "Tags are short words");

/** Fields a rep may change on a lead. Anything not listed here cannot be set through the API. */
export const leadPatchSchema = z
  .object({
    stage: z.enum(STAGES),
    status: z.enum(STATUSES),
    full_name: text(200).min(1),
    email: text(320),
    phone: text(60).nullable(),
    company_name: text(200).nullable(),
    job_title: text(200).nullable(),
    notes: text(10_000).nullable(),
    lead_source: text(80).min(1),
    estimated_deal_value: z.coerce.number().min(0).max(100_000_000),
    currency: z.enum(CURRENCIES),
    expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    probability: z.number().int().min(0).max(100).nullable(),
    country: iso2.nullable(),
    tags: z.array(tag).max(12),
    lost_reason: z.enum(LOST_REASONS).nullable(),
    lost_note: text(500).nullable(),
  })
  .partial()
  .strict();

export const activityInputSchema = z.object({
  type: z.enum(MANUAL_ACTIVITY_TYPES),
  outcome: z.string().trim().max(40).optional(),
  summary: text(1000).min(1, "Say what happened"),
  occurredAt: z.string().datetime().optional(),
});

export const taskInputSchema = z.object({
  leadId: z.string().uuid(),
  title: text(200).min(1),
  dueAt: z.string().datetime(),
});

export const taskPatchSchema = z.object({
  status: z.enum(["done", "cancelled"]).optional(),
  dueAt: z.string().datetime().optional(),
  title: text(200).min(1).optional(),
});

export const viewInputSchema = z.object({
  name: text(60).min(1),
  filters: z
    .object({
      stage: z.enum(STAGES).optional(),
      status: z.enum(STATUSES).optional(),
      tag: tag.optional(),
      country: iso2.optional(),
      stale: z.boolean().optional(),
      grade: z.enum(["A", "B", "C", "D"]).optional(),
      q: text(80).optional(),
      noNextStep: z.boolean().optional(),
    })
    .strict(),
});
export type ViewFilters = z.infer<typeof viewInputSchema>["filters"];
