export type CrmStage =
  | "new_booking"
  | "call_completed"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type LeadScore = "hot" | "warm" | "cold";

export interface BookingLead {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  team_size?: string | null;
  message?: string | null;
  slot_start: string;
  slot_end: string;
  meet_url?: string | null;
  stage: CrmStage;
  status?: string;
  admin_notes?: string | null;
  deal_value: number;
  lead_score: LeadScore;
  lead_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface CrmStageConfig {
  id: CrmStage;
  name: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
}

export const CRM_STAGES: CrmStageConfig[] = [
  {
    id: "new_booking",
    name: "New Inbound Booking",
    description: "Discovery call scheduled, pre-call review pending",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    borderClass: "border-blue-400",
    bgClass: "bg-blue-50/40",
  },
  {
    id: "call_completed",
    name: "Discovery Completed",
    description: "Requirements confirmed, scoping technical architecture",
    badgeClass: "bg-purple/10 text-purple border-purple/20",
    borderClass: "border-purple",
    bgClass: "bg-purple/[0.03]",
  },
  {
    id: "proposal_sent",
    name: "Proposal & Spec Sent",
    description: "Interactive spec brief & contract sent for review",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    borderClass: "border-amber-400",
    bgClass: "bg-amber-50/40",
  },
  {
    id: "negotiation",
    name: "Negotiation / Legal",
    description: "Scope tailoring, milestone terms & budget alignment",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    borderClass: "border-cyan-400",
    bgClass: "bg-cyan-50/40",
  },
  {
    id: "closed_won",
    name: "Closed Won / In Build",
    description: "Contract executed, sprint 1 architecture underway",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-emerald-500",
    bgClass: "bg-emerald-50/40",
  },
  {
    id: "closed_lost",
    name: "Closed Lost / Postponed",
    description: "Budget postponed or outside core tech domain",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    borderClass: "border-slate-300",
    bgClass: "bg-slate-50/40",
  },
];

export const DEMO_LEADS: BookingLead[] = [
  {
    id: "lead-001",
    name: "Alex Morgan",
    work_email: "alex@morganlogistics.co.uk",
    company_name: "Morgan Logistics & Freight",
    country: "United Kingdom",
    team_size: "20 to 50 people",
    message: "Currently managing 400+ weekly consignments across 6 spreadsheets. Looking to replace WhatsApp dispatch with a custom portal.",
    slot_start: new Date(Date.now() + 86400000).toISOString(),
    slot_end: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    meet_url: "https://meet.google.com/tdd-demo-alex",
    stage: "proposal_sent",
    deal_value: 12500,
    lead_score: "hot",
    lead_notes: "Very high intent. Sent TDD-SPEC-DEMO-2026 proposal. Target start date next month.",
    assigned_to: "Lead Architect",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "lead-002",
    name: "David Sterling",
    work_email: "david@sterlingpm.com.au",
    company_name: "Sterling Property Management",
    country: "Australia",
    team_size: "10 to 30 people",
    message: "Need a smoke alarm and compliance tracking CRM for 3,500 rental properties in Sydney.",
    slot_start: new Date(Date.now() + 2 * 86400000).toISOString(),
    slot_end: new Date(Date.now() + 2 * 86400000 + 1800000).toISOString(),
    meet_url: "https://meet.google.com/tdd-demo-david",
    stage: "call_completed",
    deal_value: 16000,
    lead_score: "hot",
    lead_notes: "Spoke with David. They are fed up with PropertyMe workarounds. Drafting Phase 1 wireframes.",
    assigned_to: "Lead Architect",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "lead-003",
    name: "Elena Rostova",
    work_email: "elena@skylinkjets.com",
    company_name: "SkyLink Aviation",
    country: "United Kingdom",
    team_size: "5 to 15 people",
    message: "Charter flight quote engine with instant WhatsApp notifications and PNR booking sync.",
    slot_start: new Date(Date.now() + 3 * 86400000).toISOString(),
    slot_end: new Date(Date.now() + 3 * 86400000 + 1800000).toISOString(),
    stage: "negotiation",
    deal_value: 14500,
    lead_score: "warm",
    lead_notes: "Reviewed spec, negotiating payment split (50/25/25 vs 40/30/30).",
    assigned_to: "Lead Architect",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "lead-004",
    name: "Marcus Thorne",
    work_email: "marcus@purecleanpro.co.uk",
    company_name: "PureClean UK",
    country: "United Kingdom",
    team_size: "50+ cleaners",
    message: "Two-sided cleaning marketplace with cleaner mobile check-ins and Stripe automated contractor payouts.",
    slot_start: new Date(Date.now() - 14 * 86400000).toISOString(),
    slot_end: new Date(Date.now() - 14 * 86400000 + 1800000).toISOString(),
    stage: "closed_won",
    deal_value: 18500,
    lead_score: "hot",
    lead_notes: "Signed proposal TDD-SPEC-2026-PC. Phase 2 database & admin control room deployed.",
    assigned_to: "Engineering Team",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "lead-005",
    name: "Sarah Jenkins",
    work_email: "sarah@jenkinstutoring.com.au",
    company_name: "Jenkins Tutoring Guild",
    country: "Australia",
    team_size: "1 to 5 people",
    message: "Looking for an AI automated worksheet generator with Stripe subscriptions.",
    slot_start: new Date(Date.now() + 4 * 86400000).toISOString(),
    slot_end: new Date(Date.now() + 4 * 86400000 + 1800000).toISOString(),
    stage: "new_booking",
    deal_value: 7500,
    lead_score: "warm",
    lead_notes: "New booking via website wizard. Automated spec generated.",
    assigned_to: "Lead Architect",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  }
];

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}
