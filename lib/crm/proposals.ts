import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { Proposal, ArchitectureModule, DeliverablePhase } from "@/lib/content/proposals";
import { getAiProvider } from "@/lib/acquisition/providers/ai";
import { log } from "@/lib/logger";

export interface ProposalBlueprint {
  id: string;
  name: string;
  systemType: string;
  targetTimeline: string;
  defaultBudgetMin: number;
  defaultBudgetMax: number;
  techStack: string[];
  architectureModules: ArchitectureModule[];
  deliverablePhases: DeliverablePhase[];
}

export const PROPOSAL_BLUEPRINTS: ProposalBlueprint[] = [
  {
    id: "logistics-hub",
    name: "Operations Portal & Logistics Dispatch Hub",
    systemType: "Operations Portal & Logistics Hub",
    targetTimeline: "6–8 Weeks",
    defaultBudgetMin: 8500,
    defaultBudgetMax: 15000,
    techStack: [
      "Next.js 16 (App Router)",
      "TypeScript",
      "Supabase PostgreSQL (RLS)",
      "Tailwind CSS",
      "Cloudflare R2 Storage",
      "Twilio WhatsApp / SMS Webhooks",
      "Stripe / Xero API",
    ],
    architectureModules: [
      {
        name: "Central Dispatch Control Room",
        description: "Dispatcher control board with drag-and-drop route scheduling, real-time driver allocation, and SLA bottleneck alerts.",
        deliverables: [
          "Interactive job scheduling calendar",
          "Driver assignment & route allocation engine",
          "Automated delay & SLA warning triggers",
        ],
        phase: "Phase 2",
      },
      {
        name: "Driver Mobile Web App (PWA)",
        description: "Mobile-responsive driver application with digital signature capture, offline proof-of-delivery, and turn-by-turn navigation.",
        deliverables: [
          "Digital Proof of Delivery (e-POD)",
          "Touch signature pad with geolocation",
          "Camera photo upload for parcel condition",
        ],
        phase: "Phase 2",
      },
      {
        name: "Client Live Tracking & Self-Serve Portal",
        description: "Secure, PIN-protected tracking links for consignees to inspect shipment milestones without calling dispatch.",
        deliverables: [
          "Unique tracking URL generator",
          "Live milestone progression bar",
          "Instant consignment note PDF download",
        ],
        phase: "Phase 3",
      },
      {
        name: "Automated Billing & Rate Cards",
        description: "Batch generation of client invoices based on completed consignments, weight tiers, and fuel surcharges.",
        deliverables: [
          "Dynamic rate-card calculator",
          "1-click batch invoice generation",
          "CSV export for Xero and QuickBooks",
        ],
        phase: "Phase 3",
      },
    ],
    deliverablePhases: [
      {
        phase: "Phase 1: Architecture & Wireframing",
        duration: "Weeks 1–2",
        milestones: [
          "Database schema design & ERD approval",
          "High-fidelity Figma user flows & UI kit",
          "Role-Based Access Control matrix definition",
          "Technical sprint roadmap sign-off",
        ],
      },
      {
        phase: "Phase 2: Core Engineering & Dispatch Engines",
        duration: "Weeks 3–5",
        milestones: [
          "PostgreSQL database & RLS policy deployment",
          "Dispatcher dashboard & live route calendar build",
          "Driver Mobile PWA & e-POD signature engine",
          "Cloudflare R2 image upload pipeline",
        ],
      },
      {
        phase: "Phase 3: Integrations & Customer Tracking",
        duration: "Weeks 6–7",
        milestones: [
          "Twilio notification triggers",
          "Accounting CSV export engine",
          "Live customer tracking portal & PIN auth",
          "End-to-end load & security testing",
        ],
      },
      {
        phase: "Phase 4: Deployment, Training & Handover",
        duration: "Week 8",
        milestones: [
          "Production deployment on Vercel & Supabase",
          "Dispatcher & driver team onboarding session",
          "Loom video walkthrough documentation",
          "30-day post-launch warranty & hypercare",
        ],
      },
    ],
  },
  {
    id: "custom-crm",
    name: "Custom CRM & Client Operations Portal",
    systemType: "Bespoke CRM & Operations Portal",
    targetTimeline: "5–7 Weeks",
    defaultBudgetMin: 7000,
    defaultBudgetMax: 13500,
    techStack: [
      "Next.js 16 (App Router)",
      "TypeScript",
      "Supabase PostgreSQL (RLS)",
      "Tailwind CSS",
      "Brevo / Resend Email Engine",
      "Role-Based Access Control",
    ],
    architectureModules: [
      {
        name: "Lead Pipeline & Deal Kanban",
        description: "Visual pipeline mapped to custom deal stages with deal value tracking, loss reasons, and stage-by-stage conversion metrics.",
        deliverables: [
          "Multi-stage drag-and-drop Kanban board",
          "Deal value & probability weighting",
          "Automated follow-up reminders",
        ],
        phase: "Phase 2",
      },
      {
        name: "Unified Client Timeline & Activity Log",
        description: "Consolidated timeline recording every email, phone call outcome, meeting note, and quote interaction in one chronological feed.",
        deliverables: [
          "Multi-channel activity logging",
          "Task scheduler with snooze & due dates",
          "Automated quiet-lead stale alerts",
        ],
        phase: "Phase 2",
      },
      {
        name: "Client Self-Serve Document & Billing Portal",
        description: "Passwordless OTP login for clients to review project deliverables, sign proposals, and submit support tickets.",
        deliverables: [
          "Single-use Email OTP authentication",
          "Interactive milestone status board",
          "Support ticket submission with file attachments",
        ],
        phase: "Phase 3",
      },
      {
        name: "Executive Analytics & Performance Reporting",
        description: "Live conversion velocity reports, revenue forecasting, rep productivity audit logs, and CSV data export.",
        deliverables: [
          "Deal velocity & pipeline conversion dashboard",
          "Rep activity & response time audit",
          "One-click CSV data export",
        ],
        phase: "Phase 3",
      },
    ],
    deliverablePhases: [
      {
        phase: "Phase 1: Architecture & Workflow Mapping",
        duration: "Weeks 1–2",
        milestones: [
          "Sales workflow & pipeline stage definition",
          "Database ERD & access control rules sign-off",
          "Figma interactive UI prototypes",
          "Integration schema approval",
        ],
      },
      {
        phase: "Phase 2: CRM Core Engine & Activity Log",
        duration: "Weeks 3–4",
        milestones: [
          "PostgreSQL schema & RLS implementation",
          "Kanban deal board & list views",
          "Activity logging & task management system",
          "Contact deduplication & validation engine",
        ],
      },
      {
        phase: "Phase 3: Client Portal & Email Automations",
        duration: "Weeks 5–6",
        milestones: [
          "Client OTP authentication & milestone tracker",
          "Transactional email dispatch hooks",
          "Executive analytics charts",
          "Security audit & role permissions verification",
        ],
      },
      {
        phase: "Phase 4: Launch & Team Training",
        duration: "Week 7",
        milestones: [
          "Production deployment & data migration",
          "Sales team live training session",
          "Admin handbook & Loom video guides",
          "30-day post-launch operational support",
        ],
      },
    ],
  },
  {
    id: "property-portal",
    name: "Real Estate & Property Management Hub",
    systemType: "Property Management & Tenant Portal",
    targetTimeline: "6–9 Weeks",
    defaultBudgetMin: 9000,
    defaultBudgetMax: 16000,
    techStack: [
      "Next.js 16 (App Router)",
      "TypeScript",
      "Supabase PostgreSQL (RLS)",
      "Tailwind CSS",
      "Cloudflare R2 Document Vault",
      "DocuSign / Native E-Sign",
    ],
    architectureModules: [
      {
        name: "Property & Unit Inventory Engine",
        description: "Centralized property database tracking lease agreements, occupancy status, key dates, and statutory compliance certificates.",
        deliverables: [
          "Property unit catalog with media galleries",
          "Lease schedule & renewal alert engine",
          "Gas safety & EPC compliance register",
        ],
        phase: "Phase 2",
      },
      {
        name: "Tenant Self-Serve Maintenance Portal",
        description: "Mobile-friendly maintenance dispatch system where tenants submit photo/video work requests with contractor triage.",
        deliverables: [
          "Guided issue ticketing with photo capture",
          "Contractor job assignment & quote approval",
          "Maintenance status SMS notifications",
        ],
        phase: "Phase 2",
      },
      {
        name: "Landlord Financial Statements & Rent Ledger",
        description: "Automated monthly landlord statement generator reconciling rent receipts against maintenance deductions and management fees.",
        deliverables: [
          "Rent arrears tracking & automated reminders",
          "Landlord statement PDF generation",
          "Direct banking payout reconciliation",
        ],
        phase: "Phase 3",
      },
    ],
    deliverablePhases: [
      {
        phase: "Phase 1: Architecture & Compliance Design",
        duration: "Weeks 1–2",
        milestones: [
          "Property data models & lease schema design",
          "Tenant user journey & mobile UI prototypes",
          "Compliance document encryption architecture",
          "Sprint backlog sign-off",
        ],
      },
      {
        phase: "Phase 2: Inventory & Maintenance Build",
        duration: "Weeks 3–5",
        milestones: [
          "Property unit & lease manager build",
          "Tenant maintenance ticketing PWA",
          "Cloudflare R2 secure document storage",
          "Automated renewal alert triggers",
        ],
      },
      {
        phase: "Phase 3: Financials & Statements",
        duration: "Weeks 6–7",
        milestones: [
          "Rent ledger & deduction calculation engine",
          "Automated monthly PDF statement builder",
          "Landlord portal dashboard",
          "End-to-end user acceptance testing",
        ],
      },
      {
        phase: "Phase 4: Go-Live & Handover",
        duration: "Weeks 8–9",
        milestones: [
          "Production cutover",
          "Staff & property manager onboarding",
          "Tenant welcome guide distribution",
          "30-day hypercare support",
        ],
      },
    ],
  },
  {
    id: "saas-mvp",
    name: "B2B SaaS MVP & Multi-Tenant Platform",
    systemType: "B2B SaaS Web Application",
    targetTimeline: "6–8 Weeks",
    defaultBudgetMin: 10000,
    defaultBudgetMax: 18000,
    techStack: [
      "Next.js 16 (App Router)",
      "TypeScript",
      "Supabase PostgreSQL (Multi-Tenant RLS)",
      "Tailwind CSS",
      "Stripe Subscriptions & Billing",
      "Cloudflare Edge",
    ],
    architectureModules: [
      {
        name: "Multi-Tenant Workspace Engine",
        description: "Isolated organization workspaces with tenant-scoped database policies, custom subdomains, and granular team roles.",
        deliverables: [
          "Multi-tenant tenant isolation with RLS",
          "Team member invitations & role permissions",
          "Workspace configuration & audit logs",
        ],
        phase: "Phase 2",
      },
      {
        name: "Core Domain Application Logic",
        description: "Primary product feature set tailored to user workflows with real-time optimistic state and background task workers.",
        deliverables: [
          "Core interactive product views",
          "Background processing queue",
          "Search & data filtering engine",
        ],
        phase: "Phase 2",
      },
      {
        name: "Stripe Billing & Subscription Hub",
        description: "Self-serve subscription management supporting tiered seat licensing, usage limits, and automatic customer portal access.",
        deliverables: [
          "Stripe webhook subscription sync",
          "Tiered feature-gating middleware",
          "Self-serve invoice & card update portal",
        ],
        phase: "Phase 3",
      },
    ],
    deliverablePhases: [
      {
        phase: "Phase 1: Architecture & Technical Spec",
        duration: "Weeks 1–2",
        milestones: [
          "Multi-tenant data schema & RLS security design",
          "Design system & high-fidelity prototype",
          "API contract & billing tier definition",
          "Engineering sprint plan approval",
        ],
      },
      {
        phase: "Phase 2: Core Platform & Workspaces",
        duration: "Weeks 3–5",
        milestones: [
          "Tenant isolation & auth deployment",
          "Core application workflows build",
          "Team invite & role-based permissions",
          "Cloudflare Edge caching & API routes",
        ],
      },
      {
        phase: "Phase 3: Billing & Integrations",
        duration: "Weeks 6–7",
        milestones: [
          "Stripe subscription webhooks integration",
          "Usage metering & feature limits",
          "Security penetration testing",
          "Beta testing with pilot accounts",
        ],
      },
      {
        phase: "Phase 4: Launch & Infrastructure Handover",
        duration: "Week 8",
        milestones: [
          "Production deployment & domain mapping",
          "Monitoring, error alerting & backup verification",
          "Developer handover & API documentation",
          "30-day post-launch engineering support",
        ],
      },
    ],
  },
];

/** Generates a confidential, unguessable slug for proposals. */
export function generateProposalSlug(companyName: string): string {
  const clean = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 28)
    .replace(/-+$/, "") || "deal";
  const hash = crypto.randomBytes(4).toString("hex");
  return `tdd-prop-${clean}-${hash}`;
}

/** Creates a SHA-256 agreement audit hash for an executed proposal. */
export function createAgreementHash(payload: {
  slug: string;
  clientName: string;
  clientEmail: string;
  signedAt: string;
  signedIp: string;
  budgetRange: string;
}): string {
  const content = `${payload.slug}|${payload.clientName}|${payload.clientEmail}|${payload.signedAt}|${payload.signedIp}|${payload.budgetRange}`;
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * AI-assisted proposal synthesizer.
 * Takes blueprint and lead details, and tailor-drafts customized problem statement and modules.
 * Gracefully falls back to the blueprint when AI is not configured.
 */
export async function tailorProposalWithAi(params: {
  blueprint: ProposalBlueprint;
  lead: {
    fullName: string;
    companyName: string | null;
    jobTitle?: string | null;
    notes?: string | null;
    estimatedDealValue?: number | null;
    currency?: string | null;
    country?: string | null;
  };
}): Promise<{
  scopeSummary: string;
  problemStatement: string;
  architectureModules: ArchitectureModule[];
  deliverablePhases: DeliverablePhase[];
}> {
  const { blueprint, lead } = params;
  const company = lead.companyName || "the Client";
  const defaultScope = `Bespoke ${blueprint.systemType.toLowerCase()} custom-engineered for ${company} to streamline operations, eliminate spreadsheet patchwork, and establish automated client workflows.`;
  const defaultProblem = lead.notes?.trim()
    ? `Identified operational bottleneck: ${lead.notes.slice(0, 300)}`
    : `Currently constrained by disjointed tools, manual data re-entry, and lack of real-time visibility across team workflows.`;

  const ai = getAiProvider();
  if (!ai) {
    return {
      scopeSummary: defaultScope,
      problemStatement: defaultProblem,
      architectureModules: blueprint.architectureModules,
      deliverablePhases: blueprint.deliverablePhases,
    };
  }

  try {
    const system = `You are the Principal Solutions Architect at The Digital Dude, an elite bespoke software engineering agency.
You write crisp, authoritative, high-value technical architecture proposals for enterprise and mid-market clients.
Respond with pure JSON conforming to this schema:
{
  "scopeSummary": "concise 2-3 sentence executive scope brief",
  "problemStatement": "crisp 2-3 sentence problem definition based on lead notes",
  "modules": [
    {
      "name": "module title",
      "description": "module architectural description",
      "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
      "phase": "Phase 2"
    }
  ]
}`;

    const user = `Client Company: ${company}
Contact: ${lead.fullName} (${lead.jobTitle || "Executive"})
Country: ${lead.country || "UK"}
Deal Budget: ${lead.estimatedDealValue ? `${lead.currency || "USD"} ${lead.estimatedDealValue}` : "Standard"}
Discovery Notes: ${lead.notes || "No notes provided"}
Base Blueprint: ${blueprint.name}
Default Modules: ${JSON.stringify(blueprint.architectureModules.map((m) => m.name))}`;

    const raw = await ai.completeJson({ system, user });
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed.scopeSummary === "string" && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
      return {
        scopeSummary: parsed.scopeSummary,
        problemStatement: parsed.problemStatement || defaultProblem,
        architectureModules: parsed.modules.map((m: any, idx: number) => ({
          name: String(m.name || blueprint.architectureModules[idx]?.name || `Module ${idx + 1}`),
          description: String(m.description || blueprint.architectureModules[idx]?.description || ""),
          deliverables: Array.isArray(m.deliverables) ? m.deliverables.map(String) : blueprint.architectureModules[idx]?.deliverables || [],
          phase: String(m.phase || blueprint.architectureModules[idx]?.phase || "Phase 2"),
        })),
        deliverablePhases: blueprint.deliverablePhases,
      };
    }
  } catch (err) {
    log("warn", { message: "AI proposal tailoring fallback", error: err });
  }

  return {
    scopeSummary: defaultScope,
    problemStatement: defaultProblem,
    architectureModules: blueprint.architectureModules,
    deliverablePhases: blueprint.deliverablePhases,
  };
}
