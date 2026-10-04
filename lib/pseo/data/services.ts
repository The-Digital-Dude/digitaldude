import { PseoService } from "../types";

export const pseoServices: PseoService[] = [
  {
    slug: "crm-development",
    name: "Custom CRM Development",
    navLabel: "CRM Development",
    badge: "Bespoke CRM Engineering",
    oneLiner: "Custom sales pipelines, field technician dispatch, and role-based portals mapped to your exact operational workflow.",
    headlinePrefix: "Custom CRM Development",
    coreDeliverables: [
      "Omnichannel Lead Pipeline (WhatsApp, Web Forms, Phone, Email sync)",
      "Multi-Role Permission Portals (Management, Ops, Field Techs, Clients)",
      "Automated Quote, Invoicing & Digital Certificate Dispatch",
      "Real-time KPI & Velocity Analytics Dashboards",
      "Seamless Integration with Stripe, Xero, Brevo, and Twilio"
    ],
    techStack: ["Next.js 16 App Router", "React 19", "Supabase PostgreSQL", "Tailwind CSS", "Server Actions", "Brevo / Twilio API"],
    roiHighlights: [
      { metric: "100%", label: "Zero Per-Seat Fees", detail: "Stop paying £100–£300 per user per month as your team expands." },
      { metric: "4x", label: "Faster Turnaround", detail: "Turn jobs from inquiry to completed compliance certificate in < 48 hours." },
      { metric: "38%", label: "Conversion Uplift", detail: "Automated instant lead routing captures inquiries within 60 seconds." }
    ],
    baseMonthlyCostSaaS: 2400
  },
  {
    slug: "saas-development",
    name: "SaaS Product Development",
    navLabel: "SaaS Engineering",
    badge: "Multi-Tenant SaaS Engineering",
    oneLiner: "Multi-tenant cloud architecture, automated recurring billing, identity verification, and scalable database schemas.",
    headlinePrefix: "Bespoke SaaS Development",
    coreDeliverables: [
      "Multi-Tenant Database Architecture with Row Level Security (RLS)",
      "Automated Stripe Billing (Tiers, Add-ons, Usage-based metering)",
      "KYC / Identity & Background Check Verification Workflows",
      "Granular RBAC (Role-Based Access Control) & Team Collaboration",
      "High-Converting Self-Service Onboarding & Product Analytics"
    ],
    techStack: ["Next.js 16", "Supabase Auth & RLS", "PostgreSQL", "Stripe Billing Engine", "Tailwind CSS", "TypeScript"],
    roiHighlights: [
      { metric: "8-12 Wks", label: "MVP to Production", detail: "Ship production-ready SaaS in weeks instead of 9+ months." },
      { metric: "99.9%", label: "Reliability & Uptime", detail: "Cloud-native serverless architecture with global CDN caching." },
      { metric: "0%", label: "Vendor Lock-in", detail: "You own 100% of the proprietary codebase and intellectual property." }
    ],
    baseMonthlyCostSaaS: 3500
  },
  {
    slug: "marketplace-development",
    name: "Marketplace Platform Development",
    navLabel: "Marketplace Development",
    badge: "Two-Sided Marketplace Systems",
    oneLiner: "Two-sided platforms with upfront customer payments, provider verification, escrow splits, and dispute resolution.",
    headlinePrefix: "Custom Marketplace Development",
    coreDeliverables: [
      "Three-Sided Ecosystem (Customer Web, Provider Mobile App, Master Admin)",
      "Stripe Connect Custom Split Payouts & Escrow Release",
      "Photo-Verified Job Completion & Geolocation Check-in",
      "Automated Commission Deductions & Instant Invoicing",
      "Two-Way Rating, Review & Background Check Verification"
    ],
    techStack: ["Next.js App Router", "React 19", "Stripe Connect", "Supabase Storage", "Google Maps Geocoding", "WebSockets"],
    roiHighlights: [
      { metric: "15-25%", label: "Platform Take Rate", detail: "Automated commission deduction straight to your business bank account." },
      { metric: "92%", label: "Photo Verification", detail: "Zero dispute payouts with mandatory before/after photo uploads." },
      { metric: "3-in-1", label: "Unified Architecture", detail: "Customer booking, worker portal, and admin desk in one repository." }
    ],
    baseMonthlyCostSaaS: 1800
  },
  {
    slug: "erp-hrm-systems",
    name: "ERP & Operations Portals",
    navLabel: "ERP & HRM Systems",
    badge: "Operational ERP & HRM",
    oneLiner: "Custom workforce scheduling, asset tracking, inventory workflows, and internal tooling for complex service operations.",
    headlinePrefix: "Bespoke ERP & Operational Software",
    coreDeliverables: [
      "Dynamic Resource & Staff Roster Scheduling",
      "Multi-Location Inventory & Equipment Tracking",
      "Automated Time Tracking, Timesheet Approvals & Payroll Sync",
      "Custom Client Invoicing with Statutory Tax & Compliance Rules",
      "Audit Logging & Employee Onboarding Scorecards"
    ],
    techStack: ["Next.js 16", "Supabase PostgreSQL", "Tailwind CSS", "Xero / QuickBooks API", "PDF Generator", "TypeScript"],
    roiHighlights: [
      { metric: "65%", label: "Admin Hours Saved", detail: "Eliminate double-entry between spreadsheets, timecards, and invoices." },
      { metric: "100%", label: "Audit Traceability", detail: "Immutable event logs for every status change, approval, and refund." },
      { metric: "Zero", label: "Spreadsheet Drift", detail: "One single source of operational truth across all branches." }
    ],
    baseMonthlyCostSaaS: 4200
  },
  {
    slug: "website-development",
    name: "Enterprise Web Applications",
    navLabel: "Web Applications",
    badge: "High-Performance Web Platforms",
    oneLiner: "High-converting, lightning-fast web applications built on modern Next.js and React architecture.",
    headlinePrefix: "Enterprise Web Application Engineering",
    coreDeliverables: [
      "Sub-second Core Web Vitals & Instant Server-Rendered Pages",
      "Integrated Booking Calendars with Google Calendar & Meet Sync",
      "Interactive Product Calculators & Dynamic Lead Funnels",
      "Dynamic OpenGraph & Structured JSON-LD SEO Metadata",
      "Custom CMS with Markdown & Supabase Storage Media Management"
    ],
    techStack: ["Next.js 16 App Router", "React 19", "TypeScript", "Tailwind CSS", "Google Calendar OAuth2", "Supabase"],
    roiHighlights: [
      { metric: "99/100", label: "Lighthouse Performance", detail: "Ultra-fast load times maximizing organic search ranking and conversion." },
      { metric: "3.2x", label: "Lead Capture Rate", detail: "Streamlined multi-step booking funnels that eliminate form friction." },
      { metric: "100%", label: "Mobile Responsive", detail: "Flawless UX across desktop, tablet, and mobile browsers." }
    ],
    baseMonthlyCostSaaS: 1200
  },
  {
    slug: "seo-growth",
    name: "Programmatic SEO & Growth Systems",
    navLabel: "SEO & Growth Systems",
    badge: "Programmatic Growth Engines",
    oneLiner: "Automated SEO architectures, AI-ready indexing feeds, dynamic sitemaps, and programmatic landing page clusters.",
    headlinePrefix: "Programmatic SEO & Growth Engine Development",
    coreDeliverables: [
      "Dynamic Programmatic Page Generation (Locations, Niches, Comparisons)",
      "Automated XML Sitemaps, RSS & Atom Feeds",
      "LLM Discovery Feeds (`llms.txt`, `llms-full.txt`) for AI Search Visibility",
      "Automated OpenGraph Dynamic Image Generation (`/api/og`)",
      "Structured Schema Markup (JSON-LD Breadcrumbs, Services, FAQs)"
    ],
    techStack: ["Next.js 16 App Router", "Edge Runtime", "Dynamic Sitemaps", "JSON-LD", "Tailwind CSS", "TypeScript"],
    roiHighlights: [
      { metric: "10x-50x", label: "Indexable Search Footprint", detail: "Scale from 10 pages to 200+ high-ranking long-tail assets." },
      { metric: "0", label: "Ad Spend Required", detail: "Generate permanent compounding organic inbound leads month over month." },
      { metric: "AI-Ready", label: "LLM Search Ready", detail: "Optimized for indexing by ChatGPT Search, Perplexity, and Claude." }
    ],
    baseMonthlyCostSaaS: 2500
  }
];
