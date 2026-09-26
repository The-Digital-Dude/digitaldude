export interface ArchitectureModule {
  name: string;
  description: string;
  deliverables: string[];
  phase: string;
}

export interface DeliverablePhase {
  phase: string;
  duration: string;
  milestones: string[];
}

export interface Proposal {
  id: string;
  slug: string;
  booking_id?: string | null;
  client_name: string;
  client_email: string;
  company_name: string;
  country: string;
  project_title: string;
  system_type: string;
  scope_summary: string;
  problem_statement?: string;
  target_timeline: string;
  budget_range: string;
  tech_stack: string[];
  architecture_modules: ArchitectureModule[];
  deliverable_phases: DeliverablePhase[];
  status: "draft" | "sent" | "accepted" | "completed";
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export const DEMO_PROPOSAL: Proposal = {
  id: "demo-proposal-001",
  slug: "TDD-SPEC-DEMO-2026",
  client_name: "Alex Morgan",
  client_email: "alex@morganlogistics.co.uk",
  company_name: "Morgan Logistics & Freight",
  country: "United Kingdom",
  project_title: "Custom Freight Dispatch & Driver Tracking Portal",
  system_type: "Operations Portal & Logistics Hub",
  scope_summary: "End-to-end bespoke logistics portal replacing manual WhatsApp dispatching and multi-tab spreadsheets with real-time job allocation, driver mobile signatures, and automated client status tracking.",
  problem_statement: "Currently managing 400+ weekly consignments across 6 spreadsheets. Jobs are slipping through, proof-of-delivery photos get lost in chat threads, and manual invoice drafting takes 12 hours every Friday.",
  target_timeline: "6–8 Weeks",
  budget_range: "£8,500 – £14,000",
  tech_stack: [
    "Next.js 16 (App Router)",
    "TypeScript",
    "Supabase PostgreSQL (RLS)",
    "Tailwind CSS",
    "Cloudflare R2 Storage",
    "Twilio WhatsApp Webhooks",
    "Stripe / Xero API"
  ],
  architecture_modules: [
    {
      name: "Central Dispatch Control Room",
      description: "Multi-tenant dispatcher control dashboard with drag-and-drop route scheduling, real-time vehicle status indicators, and SLA bottleneck alerts.",
      deliverables: [
        "Interactive route scheduling calendar",
        "Driver assignment & route-splitting engine",
        "Instant WhatsApp dispatch triggers",
        "Automated late-delivery warnings"
      ],
      phase: "Phase 2"
    },
    {
      name: "Driver Mobile Web App (PWA)",
      description: "Lightweight, responsive mobile interface for drivers with offline cache support, 1-click arrival confirmation, digital signature capture, and camera photo upload.",
      deliverables: [
        "Digital Proof of Delivery (e-POD)",
        "Signature pad with GPS/timestamping",
        "Geo-tagged photo upload to Cloudflare R2",
        "Turn-by-turn navigation link integration"
      ],
      phase: "Phase 2"
    },
    {
      name: "Customer Live Tracking & Self-Serve Portal",
      description: "Public PIN-protected tracking links for consignees to track delivery progress in real time without calling the dispatch office.",
      deliverables: [
        "Unique tracking URL generator",
        "Live milestone progress bar",
        "Instant PDF consignment note download",
        "Automated email status notifications"
      ],
      phase: "Phase 3"
    },
    {
      name: "Automated Billing & Reporting Engine",
      description: "Automatic aggregation of completed delivery slips into monthly client statements and 1-click Xero/QuickBooks CSV export.",
      deliverables: [
        "Automated rate-card calculator",
        "1-click invoice batch generation",
        "Weekly driver efficiency reports",
        "Direct export to Xero / QuickBooks"
      ],
      phase: "Phase 3"
    }
  ],
  deliverable_phases: [
    {
      phase: "Phase 1: Architecture & Wireframing",
      duration: "Weeks 1–2",
      milestones: [
        "Database schema design & ERD approval",
        "High-fidelity Figma user flows & UI kit",
        "Role-Based Access Control matrix definition",
        "Technical sprint roadmap sign-off"
      ]
    },
    {
      phase: "Phase 2: Core Engineering & Database",
      duration: "Weeks 3–5",
      milestones: [
        "PostgreSQL database & RLS policy deployment",
        "Dispatcher dashboard & live calendar build",
        "Driver Mobile PWA & e-POD signature engine",
        "Cloudflare R2 image upload pipeline"
      ]
    },
    {
      phase: "Phase 3: Integrations & Testing",
      duration: "Weeks 6–7",
      milestones: [
        "Twilio WhatsApp notification triggers",
        "Accounting CSV export engine",
        "Live customer tracking portal & PIN auth",
        "End-to-end load & security testing"
      ]
    },
    {
      phase: "Phase 4: Deployment, Training & Handover",
      duration: "Week 8",
      milestones: [
        "Production deployment on Vercel & Supabase",
        "Driver & dispatcher onboarding session",
        "Loom video walkthrough documentation",
        "30-day post-launch hypercare support"
      ]
    }
  ],
  status: "sent",
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function generateProposalFromBooking(params: {
  bookingId?: string;
  name: string;
  email: string;
  company: string;
  country: string;
  systemType?: string;
  teamSize?: string;
  message?: string;
}): Proposal {
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const slug = `TDD-SPEC-${new Date().getFullYear()}-${code}`;
  const systemType = params.systemType || "Custom Business Portal";
  
  let projectTitle = `${systemType} Architecture Specification`;
  let scopeSummary = `Bespoke web architecture tailored for ${params.company || "your team"}, designed to replace manual overhead with high-performance automated workflows and role-based portals.`;
  let budgetRange = "£6,500 – £16,000";
  let targetTimeline = "4–8 Weeks";

  if (systemType.toLowerCase().includes("crm")) {
    projectTitle = `Custom Pipeline & Client CRM Architecture for ${params.company || "Client"}`;
    scopeSummary = `Bespoke CRM system centralizing multi-channel inbound inquiries, automated deal pipelines, client communications, and staff performance metrics.`;
    budgetRange = "£5,500 – £12,000";
    targetTimeline = "4–6 Weeks";
  } else if (systemType.toLowerCase().includes("marketplace")) {
    projectTitle = `Two-Sided Service Marketplace Platform for ${params.company || "Client"}`;
    scopeSummary = `Scalable multi-tenant marketplace platform with vendor onboarding, real-time availability calendars, Stripe split payouts, and customer reviews.`;
    budgetRange = "£9,500 – £18,000";
    targetTimeline = "6–10 Weeks";
  } else if (systemType.toLowerCase().includes("saas")) {
    projectTitle = `Multi-Tenant Cloud SaaS Product Architecture for ${params.company || "Client"}`;
    scopeSummary = `Modern SaaS application featuring tenant isolation, tiered Stripe billing, team workspaces, REST/Webhook APIs, and enterprise audit logs.`;
    budgetRange = "£8,000 – £16,000";
    targetTimeline = "6–8 Weeks";
  } else if (systemType.toLowerCase().includes("erp") || systemType.toLowerCase().includes("hrm")) {
    projectTitle = `Operations, Inventory & Staff Management ERP for ${params.company || "Client"}`;
    scopeSummary = `Unified internal operations platform consolidating staff scheduling, inventory tracking, equipment maintenance, and payroll exports.`;
    budgetRange = "£9,000 – £19,000";
    targetTimeline = "6–9 Weeks";
  }

  return {
    id: `prop-${Date.now()}`,
    slug,
    booking_id: params.bookingId,
    client_name: params.name,
    client_email: params.email,
    company_name: params.company || "Client Company",
    country: params.country || "United Kingdom",
    project_title: projectTitle,
    system_type: systemType,
    scope_summary: scopeSummary,
    problem_statement: params.message || `Eliminate manual operational bottlenecks, fragmented spreadsheets, and disconnected communications for a team of ${params.teamSize || "5–20"}.`,
    target_timeline: targetTimeline,
    budget_range: budgetRange,
    tech_stack: [
      "Next.js 16 (App Router)",
      "TypeScript",
      "Supabase PostgreSQL (Row-Level Security)",
      "Tailwind CSS",
      "Cloudflare CDN & Edge Caching",
      "Role-Based Access Control (RBAC)",
      "Transactional Email & Webhooks (Resend/SendGrid)"
    ],
    architecture_modules: [
      {
        name: "Central Admin & Operations Dashboard",
        description: `Primary control center for management to oversee active jobs, assign staff, and inspect key operational performance indicators in real time.`,
        deliverables: [
          "Interactive management metrics & KPIs",
          "Role-based permission matrix (SuperAdmin, Staff, Client)",
          "Real-time activity audit log",
          "1-click CSV & PDF export engine"
        ],
        phase: "Phase 2"
      },
      {
        name: "Client / User Self-Service Portal",
        description: `Intuitive, mobile-responsive portal enabling clients to submit requests, track progress, review documents, and make payments online.`,
        deliverables: [
          "Magic-link & passwordless secure authentication",
          "Live project/order milestone tracker",
          "Document repository & digital signatures",
          "Automated status push notifications"
        ],
        phase: "Phase 2"
      },
      {
        name: "Automated Workflows & Integrations Hub",
        description: `Background processing pipeline connecting webhooks, third-party APIs (Stripe, Accounting, WhatsApp/SMS), and automated reminder triggers.`,
        deliverables: [
          "Stripe automated payment & invoicing sync",
          "WhatsApp/SMS transactional notification triggers",
          "Automated email follow-up sequences",
          "Webhook endpoints for external software sync"
        ],
        phase: "Phase 3"
      },
      {
        name: "Database Security, Backup & High-Availability Infrastructure",
        description: `Production-ready cloud deployment with PostgreSQL row-level security, automated daily backups, SSL encryption, and edge acceleration.`,
        deliverables: [
          "PostgreSQL with granular Row-Level Security policies",
          "Automated point-in-time recovery & backups",
          "Cloudflare DDoS protection & SSL certificates",
          "Zero-downtime continuous deployment pipeline"
        ],
        phase: "Phase 3"
      }
    ],
    deliverable_phases: [
      {
        phase: "Phase 1: Technical Architecture & Wireframing",
        duration: "Weeks 1–2",
        milestones: [
          "Architecture specification & entity relationship sign-off",
          "Interactive Figma UI/UX prototype review",
          "Database schema & API contract design",
          "Milestone sprint plan confirmation"
        ]
      },
      {
        phase: "Phase 2: Core Engineering & Database Build",
        duration: "Weeks 3–5",
        milestones: [
          "PostgreSQL database setup with RLS policies",
          "Authentication & Role-Based Access Control implementation",
          "Admin control room & client portal UI construction",
          "Data migration from existing spreadsheets"
        ]
      },
      {
        phase: "Phase 3: Integrations, Automations & Testing",
        duration: "Weeks 6–7",
        milestones: [
          "Payment gateway & webhook automation testing",
          "Third-party messaging & email sync",
          "Rigorous security audit, validation & load testing",
          "User acceptance testing (UAT) with stakeholder team"
        ]
      },
      {
        phase: "Phase 4: Launch, Training & Hypercare Support",
        duration: "Week 8",
        milestones: [
          "Production cutover to custom domain with SSL",
          "Staff training video library & documentation handover",
          "Full 100% intellectual property & source code transfer",
          "30 days dedicated warranty & hypercare support"
        ]
      }
    ],
    status: "draft",
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
