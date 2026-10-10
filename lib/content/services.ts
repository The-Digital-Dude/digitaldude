export type Faq = { q: string; a: string };

export type ComparisonItem = {
  feature: string;
  custom: string;
  offTheShelf: string;
};

export type DeliveryPhase = {
  phase: string;
  duration: string;
  focus: string;
  deliverables: string[];
};

export type ArchitectureModule = {
  title: string;
  description: string;
  techHighlights: string[];
};

export type Service = {
  slug: string;
  navLabel: string;
  oneLiner: string;
  headline: string;
  intro: string;
  included: string[];
  whoFor: string;
  related: string[];
  faqs: Faq[];
  architectureBlueprint?: ArchitectureModule[];
  comparisonMatrix?: ComparisonItem[];
  deliveryPhases?: DeliveryPhase[];
  roiHighlights?: Array<{ metric: string; label: string; detail: string }>;
};

export const services: Service[] = [
  {
    slug: "crm-development",
    navLabel: "CRM development",
    oneLiner: "Bespoke sales pipelines, mobile technician dispatch, and role-based portals mapped to your exact workflow.",
    headline: "Custom CRM Development Built Around How Your Business Actually Operates",
    intro:
      "Off-the-shelf CRMs (HubSpot, Salesforce, Zoho) force your operations to conform to generic sales pipelines while charging punitive per-user monthly subscription fees. We engineer bespoke CRMs designed 100% around your operational reality: connecting inbound multi-channel lead queues, field technician dispatch, automated certificate generation, and live executive KPIs without spreadsheet patchwork.",
    included: [
      "Omnichannel Lead Ingestion: Auto-capture leads from web forms, WhatsApp Business API, Facebook Messenger, phone logs, and email into a unified queue.",
      "Multi-Role Portals: Isolated, permission-controlled views for management, operations dispatchers, field technicians, and external clients.",
      "Custom Workflow Automation: Automated status triggers, instant quote generation, SMS appointment reminders, and automated digital certificate dispatch.",
      "Spreadsheet & Legacy Data Migration: Clean extraction, deduplication, and relational schema mapping of your historical records.",
      "Direct Billing & Invoicing Engine: Native Stripe Connect, Xero, and QuickBooks synchronization to trigger payments upon job completion.",
      "Executive Analytics & KPI Dashboards: Real-time visibility into conversion velocities, technician completion rates, and gross margin per job.",
    ],
    whoFor:
      "High-growth service businesses, property management firms, travel agencies, and multi-team field operations (5 to 250+ team members) outgrowing Google Sheets, WhatsApp chaos, or bloated off-the-shelf software.",
    related: ["property-compliance-crm", "airline-ticketing-crm", "recruitment-crm"],
    roiHighlights: [
      { metric: "4x", label: "Faster Turnaround", detail: "Jobs progress from booking to completed compliance certificate in under 48 hours instead of 8 days." },
      { metric: "100%", label: "Zero Per-Seat Fees", detail: "Eliminate recurring $100–$300/user monthly licensing costs as your team scales." },
      { metric: "38%", label: "Conversion Lift", detail: "Automated instant lead routing and SMS follow-ups capture high-intent inquiries within minutes." }
    ],
    comparisonMatrix: [
      {
        feature: "Pricing Model",
        custom: "One-time milestone investment. Zero per-user monthly software license fees forever.",
        offTheShelf: "Expensive monthly subscriptions per user ($50–$300/mo/user), ballooning as staff grows."
      },
      {
        feature: "Workflow Flexibility",
        custom: "100% mapped to your exact business operations, terminology, and field checklists.",
        offTheShelf: "Rigid standard sales stages; requires clunky third-party Zapier workarounds."
      },
      {
        feature: "Data Ownership & Security",
        custom: "You own the complete codebase, PostgreSQL database, and intellectual property from day one.",
        offTheShelf: "Your customer data is locked in vendor cloud silos with strict API export limits."
      },
      {
        feature: "Multi-Role Portals",
        custom: "Custom client portals, field technician mobile apps, and dispatcher dashboards in one unified system.",
        offTheShelf: "Requires buying multiple separate add-on software products and trying to sync them."
      }
    ],
    architectureBlueprint: [
      {
        title: "Omnichannel Lead & Ingestion Engine",
        description: "Centralizes high-velocity inbound inquiries from web forms, WhatsApp, Facebook Messenger, and phone call logs with automated duplication checks.",
        techHighlights: ["Webhooks", "WhatsApp Business API", "PostgreSQL RLS", "Async Job Queue"]
      },
      {
        title: "Dispatcher & Operations Command Center",
        description: "Interactive scheduling calendar with route mapping, automated technician availability matching, and real-time delayed task alerts.",
        techHighlights: ["Next.js 16 App Router", "Google Maps Geocoding API", "Server Actions", "Tailwind CSS"]
      },
      {
        title: "Field Technician Mobile Web App",
        description: "Mobile-optimized interface with GPS check-in, mandatory photo upload proof, digital customer sign-off, and offline support.",
        techHighlights: ["PWA / Mobile React", "Supabase Storage CDN", "Optimistic UI Updates"]
      },
      {
        title: "Automated Invoicing & Accounting Sync",
        description: "Instant PDF invoice generation and automated payment authorization links sent immediately upon technician completion sign-off.",
        techHighlights: ["Stripe Connect", "Xero / QuickBooks Webhooks", "PDFKit Engine"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: Process Mapping & Blueprinting",
        duration: "Week 1–2",
        focus: "Deep dive into your team's actual day-to-day workflow, identifying operational bottlenecks, role hierarchies, and data models.",
        deliverables: ["Interactive Figma clickable wireframes", "Relational Database Schema Design", "Fixed Technical Scope Proposal"]
      },
      {
        phase: "Phase 2: Core Engineering & Integrations",
        duration: "Week 3–6",
        focus: "Rapid bi-weekly sprint builds covering user authentication, database RLS, multi-channel lead queues, and dispatch dashboards.",
        deliverables: ["Staging environment access", "Role-based permission architecture", "Stripe & WhatsApp API integrations"]
      },
      {
        phase: "Phase 3: Data Migration & User Acceptance Testing",
        duration: "Week 7–8",
        focus: "Sanitizing, mapping, and migrating existing spreadsheet records, accompanied by live team onboarding and scenario stress testing.",
        deliverables: ["Full historical data import", "End-to-end UAT sign-off", "Mobile technician field testing"]
      },
      {
        phase: "Phase 4: Production Launch & 30-Day Support",
        duration: "Week 9+",
        focus: "Domain cutover, production database clustering, and dedicated post-launch bug warranty support at zero extra charge.",
        deliverables: ["Live production deployment", "30 days included bug-fix warranty", "Complete IP & codebase handover"]
      }
    ],
    faqs: [
      {
        q: "Why build a custom CRM instead of using HubSpot, Salesforce, or Zoho?",
        a: "Off-the-shelf CRMs are engineered for generic B2B software sales pipelines (Lead → Meeting → Closed). If your business dispatches field technicians, manages property compliance, handles multi-channel WhatsApp leads, or coordinates multi-sided portals, generic CRMs require costly add-ons and brittle Zapier zaps. A custom CRM eliminates per-user monthly SaaS fees and fits your exact operations from day one.",
      },
      {
        q: "How does our historical spreadsheet and email data get migrated?",
        a: "Data sanitization and migration is an integral deliverable in every CRM build. We analyze your existing Google Sheets, Excel files, and CSV exports, clean up duplicates, map relationships into normalized PostgreSQL tables, and run verification audits before switching over to the new system.",
      },
      {
        q: "How long does a bespoke CRM project take from kickoff to deployment?",
        a: "A focused single-portal CRM typically ships in 4 to 6 weeks. A comprehensive multi-portal system (with separate client portals, dispatcher operations, and mobile field worker apps) takes 8 to 12 weeks. Every project adheres to a fixed timeline agreed upon in our upfront proposal.",
      },
      {
        q: "What are the payment terms and ongoing costs?",
        a: "We work with fixed, transparent milestone proposals with zero hidden fees. Estimates are in USD ($) for international clarity, with UK bank transfer (GBP) and Australia (AUD) invoice equivalents available. Payment is structured across agreed milestones: 50% upfront deposit and the remainder upon delivery UAT. Ongoing infrastructure costs are minimal—just your cloud hosting (e.g., Vercel & Supabase, typically $25–$100/month total, ex. VAT) rather than recurring thousands in per-user software licenses.",
      },
      {
        q: "Who owns the intellectual property (IP) and source code?",
        a: "You own 100% of the source code, database architecture, and digital assets from the moment final milestones are settled. There are no vendor lock-ins or proprietary license restrictions.",
      },
      {
        q: "What support is provided after launch?",
        a: "Every CRM deployment includes 30 days of comprehensive post-launch warranty support covering bug fixes, edge-case adjustments, and user onboarding queries at no additional cost. Afterward, we offer flexible retainer support plans or on-demand feature sprints.",
      },
    ],
  },
  {
    slug: "saas-development",
    navLabel: "SaaS development",
    oneLiner: "Multi-tenant SaaS architectures, Stripe recurring subscription billing, and role-based permissions ready to monetize.",
    headline: "End-to-End SaaS Engineering: From Architecture Blueprint to Paying Subscribers",
    intro:
      "Transforming a software concept or internal operational tool into a commercial SaaS product requires bulletproof multi-tenant database isolation, automated Stripe subscription billing, scalable cloud infrastructure, and frictionless onboarding. We engineer production-grade SaaS platforms utilizing Next.js 16 App Router, TypeScript, and Supabase PostgreSQL with Row-Level Security (RLS) to ensure your software is fast, secure, and ready to scale.",
    included: [
      "Multi-Tenant Architecture: Secure workspace isolation, organizational hierarchies, and granular Role-Based Access Control (RBAC).",
      "Stripe Subscription & Billing Engine: Tiered pricing plans, usage-based metering, automated prorations, invoices, and self-service billing portals.",
      "High-Conversion Authentication & Onboarding: Social logins, magic links, email verification, and guided multi-step user onboarding flows.",
      "Custom Admin Command Center: User management, subscription churn analytics, feature flag toggles, and direct customer support impersonation.",
      "Applied AI Automation: Value-driven AI features including intelligent matching, automated content generation, and smart recommendations.",
      "Production CI/CD & Cloud Infrastructure: Edge rendering, Redis caching layers, automated backups, and 99.9% uptime SLA configuration.",
    ],
    whoFor:
      "Bootstrapped and venture-backed founders building new SaaS MVPs, and enterprise businesses productizing internal operational software into profitable commercial platforms.",
    related: ["matrimony-saas-platform", "ai-tutoring-platform", "property-compliance-crm"],
    roiHighlights: [
      { metric: "8–12 Wks", label: "MVP Time-to-Market", detail: "Launch a fully monetizable subscription platform with Stripe billing in under 90 days." },
      { metric: "99.9%", label: "Uptime & Security", detail: "Multi-tenant Row-Level Security (RLS) ensures total subscriber data isolation." },
      { metric: "100%", label: "Complete IP Ownership", detail: "Full source code, API keys, and database ownership transferred to your company." }
    ],
    comparisonMatrix: [
      {
        feature: "Time to Market",
        custom: "8 to 12 weeks for a production-ready, custom-branded SaaS platform with automated billing.",
        offTheShelf: "No-code tools launch quickly but hit performance walls and security bottlenecks at scale."
      },
      {
        feature: "Customizability & IP",
        custom: "100% bespoke code tailored to your exact business model with full investor-grade IP ownership.",
        offTheShelf: "White-label templates look generic, lock you to vendor platforms, and repel enterprise buyers."
      },
      {
        feature: "Database Scaling",
        custom: "High-concurrency PostgreSQL with Row-Level Security supporting tens of thousands of active tenants.",
        offTheShelf: "Shared databases struggle with concurrency, API rate limits, and custom integrations."
      },
      {
        feature: "AI Integration Depth",
        custom: "Native LLM vector search, automated grading, and smart workflows deeply wired into product logic.",
        offTheShelf: "Superficial AI wrappers that provide little defensibility against competitors."
      }
    ],
    architectureBlueprint: [
      {
        title: "Multi-Tenant Cloud Data Layer",
        description: "PostgreSQL database with strict Row-Level Security policies ensuring tenant data cannot be queried across organizational boundaries.",
        techHighlights: ["Supabase PostgreSQL", "RLS Policies", "Connection Pooling", "Automated Backups"]
      },
      {
        title: "Stripe Billing & Metering Engine",
        description: "Synchronized Stripe webhook architecture managing trials, seat upgrades, tier upgrades, and automated churn notifications.",
        techHighlights: ["Stripe Checkout & Billing", "Customer Portal", "Webhook Signature Verification"]
      },
      {
        title: "Edge Frontend & Server Components",
        description: "Next.js App Router with sub-second page loads, Server Actions, dynamic metadata for SEO, and fluid responsive UX.",
        techHighlights: ["Next.js 16", "React Server Components", "Tailwind CSS", "TypeScript"]
      },
      {
        title: "AI & Background Job Worker Pipelines",
        description: "Asynchronous task queue handling heavy AI embeddings, report generation, and transactional email distribution without blocking UI response.",
        techHighlights: ["OpenAI / Anthropic APIs", "Upstash Redis", "Resend / Brevo API"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: Architecture & Data Modeling",
        duration: "Week 1–2",
        focus: "Defining core user personas, subscription pricing tiers, multi-tenant relational schemas, and interactive wireframe flows.",
        deliverables: ["Product Architecture Blueprint", "Database Schema ERD", "Figma High-Fidelity UI Design"]
      },
      {
        phase: "Phase 2: Authentication & Core Workflows",
        duration: "Week 3–6",
        focus: "Engineering auth security, tenant onboarding, primary business logic features, and dashboard visualizations.",
        deliverables: ["Functional staging environment", "Tenant invite engine", "Primary workflow feature modules"]
      },
      {
        phase: "Phase 3: Stripe Monetization & Admin Tools",
        duration: "Week 7–9",
        focus: "Integrating Stripe subscription billing, customer management dashboards, email notification hooks, and telemetry analytics.",
        deliverables: ["Live Stripe checkout testing", "Super-admin management portal", "Automated email triggers"]
      },
      {
        phase: "Phase 4: Security Hardening & Launch",
        duration: "Week 10–12",
        focus: "Performing penetration tests, Core Web Vitals optimizations, database indexing, and launching to initial beta cohorts.",
        deliverables: ["Production cutover", "Security audit report", "30-day post-launch warranty"]
      }
    ],
    faqs: [
      {
        q: "Can you build an MVP version of our SaaS first?",
        a: "Yes, and we strongly advocate for this approach. We work closely with founders during technical discovery to isolate the core value-driver features needed to generate revenue, leaving non-essential features for subsequent roadmap sprints so you can start onboarding paying users as quickly as possible.",
      },
      {
        q: "How is multi-tenant security and customer data isolation handled?",
        a: "We architect multi-tenant SaaS platforms using PostgreSQL Row-Level Security (RLS) policies. Every database query automatically filters by the authenticated user's organization ID at the database engine level, mathematically preventing cross-tenant data leakage.",
      },
      {
        q: "How does recurring subscription billing work with Stripe?",
        a: "We build direct Stripe Billing integrations handling monthly/annual billing cycles, tiered user pricing, automated invoice receipts, failed payment retry logic (dunning), and self-service billing portals where customers can upgrade or update their payment methods.",
      },
      {
        q: "Who owns the code, intellectual property, and database?",
        a: "You retain 100% ownership of the entire repository, codebase, database schemas, and intellectual property. The platform is ready for enterprise due diligence and investor audits.",
      },
      {
        q: "What is the typical cost and timeline for a SaaS build?",
        a: "A focused SaaS MVP typically takes 8 to 12 weeks with milestone-based fixed pricing. We provide a comprehensive line-item scope document before any contracts are signed.",
      },
    ],
  },
  {
    slug: "erp-hrm-systems",
    navLabel: "ERP and HRM systems",
    oneLiner: "Unified operational engines connecting multi-location staffing, automated payroll, resource allocation, and real-time business intelligence.",
    headline: "Custom ERP & HRM Systems Built to Unify Operations, Staff, and Live Financials",
    intro:
      "When inventory, staff timesheets, payroll calculations, and job dispatch each live in disparate disconnected software tools, management loses visibility and operational drag escalates. We engineer custom ERP and HRM systems that unify your entire company workflow under one central, high-speed platform designed specifically for multi-branch and field-heavy service enterprises.",
    included: [
      "Multi-Branch Operations Tracking: Unified visibility across physical locations, warehouse depots, regional branches, and field crews.",
      "Automated Staff HRM & Timesheet Engine: GPS-verified check-ins, automated leave request workflows, shift scheduling, and compliance document tracking.",
      "Payroll & Commission Automation: Direct computation of hours, overtime rates, performance bonuses, and direct accounting exports.",
      "Inventory & Asset Tracking: Real-time stock counts, equipment allocation, automatic reorder thresholds, and equipment maintenance schedules.",
      "Granular Role-Based Security: Multi-tier permission matrices ensuring staff and managers only access data relevant to their specific role.",
      "Consolidated Business Intelligence: Cross-department executive dashboards showing live revenue, gross margin per branch, and labor efficiency.",
    ],
    whoFor:
      "Multi-location service providers, logistics operations, recruitment agencies, and contracting firms managing 20 to 500+ personnel across distributed job sites.",
    related: ["property-compliance-crm", "logistics-platform"],
    roiHighlights: [
      { metric: "15+ Hrs", label: "Saved Weekly", detail: "Eliminate manual timesheet reconciliation and payroll cross-checking every week." },
      { metric: "100%", label: "Real-Time Visibility", detail: "Live visibility over equipment allocation and field staff across all branches." },
      { metric: "Zero", label: "Data Discrepancies", detail: "Single source of truth replaces 6+ disconnected spreadsheets and apps." }
    ],
    comparisonMatrix: [
      {
        feature: "Operational Fit",
        custom: "Engineered around your exact branch hierarchy, compensation models, and compliance requirements.",
        offTheShelf: "Legacy ERPs (SAP, NetSuite) cost $100k+ and require 12-month consulting implementations."
      },
      {
        feature: "Mobile Usability",
        custom: "Lightning-fast mobile interfaces designed for field technicians and warehouse workers.",
        offTheShelf: "Clunky legacy enterprise UIs that field staff refuse to use properly."
      },
      {
        feature: "Ongoing Software Cost",
        custom: "Fixed one-time build cost. Zero recurring per-user enterprise licensing fees.",
        offTheShelf: "Exorbitant annual maintenance contracts and thousands in monthly seat licensing."
      },
      {
        feature: "Data Ownership",
        custom: "You own 100% of the proprietary database and code on your balance sheet.",
        offTheShelf: "Vendor locks your organizational operational data into proprietary cloud silos."
      }
    ],
    architectureBlueprint: [
      {
        title: "Multi-Branch & Organization Engine",
        description: "PostgreSQL database with multi-tenant row-level security mapping physical depots, branch hierarchies, and department permissions.",
        techHighlights: ["Supabase PostgreSQL", "Multi-Tenant RLS", "Role Hierarchies", "Audit Logging"]
      },
      {
        title: "Geofenced Mobile Attendance & Timesheets",
        description: "Mobile web app with GPS geofencing verification, biometric check-ins, automated break calculations, and supervisor sign-offs.",
        techHighlights: ["Progressive Web App", "Geolocation API", "Optimistic Offline Sync", "Tailwind CSS"]
      },
      {
        title: "Payroll & Commission Calculation Worker",
        description: "Automated engine computing standard hours, overtime thresholds, and performance bonuses with direct two-way accounting sync.",
        techHighlights: ["Xero / QuickBooks API", "Async Job Queue", "PDF Paystub Generator", "TypeScript"]
      },
      {
        title: "Live Inventory & Equipment Tracking",
        description: "Centralized asset roster tracking equipment allocation, depot check-in/out barcodes, maintenance alerts, and automatic reorder triggers.",
        techHighlights: ["Next.js 16 App Router", "Server Actions", "Barcode Scanner", "Supabase Storage"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: Operational Mapping & Hierarchy Blueprint",
        duration: "Week 1–2",
        focus: "Auditing branch structures, pay rates, timesheet rules, and inventory categories to establish clean relational database schemas.",
        deliverables: ["Organizational ERD blueprint", "Clickable Figma management wireframes", "Fixed milestone roadmap"]
      },
      {
        phase: "Phase 2: Core HRM, Timesheets & Mobile Check-in",
        duration: "Week 3–6",
        focus: "Engineering employee portals, mobile check-in interfaces, supervisor approval queues, and role-based permissions.",
        deliverables: ["Staging environment access", "Mobile technician PWA", "Branch admin dashboard"]
      },
      {
        phase: "Phase 3: Payroll Rules & Inventory Integrations",
        duration: "Week 7–10",
        focus: "Building accounting API synchronization, overtime calculations, asset management modules, and automated report exports.",
        deliverables: ["Xero/QuickBooks sync testing", "Inventory allocation tools", "Automated commission engine"]
      },
      {
        phase: "Phase 4: Data Migration & Multi-Depot Go-Live",
        duration: "Week 11–14",
        focus: "Importing historical employee records, running dual-entry payroll stress tests, and launching across branches with full handover.",
        deliverables: ["Complete historical data import", "Staff onboarding walkthrough", "30-day post-launch warranty"]
      }
    ],
    faqs: [
      {
        q: "Can this system integrate with our existing accounting package (Xero, QuickBooks, MYOB)?",
        a: "Yes. We build direct two-way API synchronizations with Xero, QuickBooks, and other leading accounting platforms to automatically push payroll runs, contractor invoices, and general ledger journal entries.",
      },
      {
        q: "Do we have to migrate all departments simultaneously?",
        a: "No. We generally recommend a phased rollout. Many clients start with the highest-friction module (such as timesheets, field dispatch, or inventory) and incrementally activate additional modules over time.",
      },
      {
        q: "Can field staff and technicians access the system on mobile devices?",
        a: "Yes. All interfaces are responsive, mobile-first web applications optimized for smartphones and tablets, featuring offline caching and fast camera uploads for photo verification.",
      },
      {
        q: "How long does a custom ERP or HRM implementation take?",
        a: "A foundational modular ERP build takes between 8 to 14 weeks depending on the number of departments, role hierarchies, and third-party accounting integrations included.",
      },
      {
        q: "What ongoing infrastructure costs should we expect?",
        a: "Because our systems run on modern cloud-native serverless architecture (e.g., Supabase PostgreSQL and Vercel/Cloudflare), hosting typically runs between $50–$200/month total rather than thousands in per-user monthly SaaS fees.",
      },
      {
        q: "Who owns the code and database intellectual property?",
        a: "You own 100% of the proprietary source code, database architecture, and intellectual property from the moment final milestones are settled. There are no vendor lock-ins or recurring proprietary license fees.",
      },
    ],
  },
  {
    slug: "marketplace-development",
    navLabel: "Marketplaces and apps",
    oneLiner: "3-sided marketplace platforms connecting customer booking apps, service provider mobile dispatch, and central admin operations.",
    headline: "Synchronized 3-Sided Marketplace Platforms Engineered for On-Demand Scale",
    intro:
      "Successful on-demand marketplaces require three distinct user experiences operating in perfect real-time synchronicity: a frictionless booking and upfront payment app for customers, a mobile-first job dispatch and proof-of-work app for service providers, and a central operations command center for dispatchers to manage margins and payouts. We build all three as a single, scalable ecosystem.",
    included: [
      "Customer Booking & Payment App: Instant pricing calculator, calendar availability picker, upfront Stripe payment authorization, and live booking tracker.",
      "Service Provider Mobile App: Job acceptance queue, GPS turn-by-turn routing, mandatory before/after photo proof, and earnings dashboard.",
      "Central Admin & Dispatch CRM: Real-time map view of active jobs, automated commission splitting, contractor payout approvals, and dispute resolution.",
      "Automated Multi-Party Notifications: Instant SMS, email, and push notifications sent automatically to customer, provider, and admin at every status milestone.",
      "Stripe Connect Payout Engine: Automated split payments, platform service fees, contractor balance tracking, and 1099/tax reporting exports.",
    ],
    whoFor:
      "Cleaning companies, home services, breakdown recovery, courier networks, and on-demand platforms scaling from local operations to multi-city coverage.",
    related: ["cleaning-marketplace", "logistics-platform"],
    roiHighlights: [
      { metric: "100%", label: "Upfront Payment", detail: "Authorize customer payments at booking to completely eliminate unpaid jobs." },
      { metric: "0%", label: "Dispute Rate", detail: "Mandatory before/after photo proof eliminates fraudulent customer chargebacks." },
      { metric: "Automated", label: "Contractor Payouts", detail: "Stripe Connect calculates commission and schedules payouts automatically." }
    ],
    comparisonMatrix: [
      {
        feature: "Payment Flow",
        custom: "Upfront pre-authorization holding funds until photo proof is submitted and verified.",
        offTheShelf: "Manual invoicing after the job, leading to late payments and unpaid contractor disputes."
      },
      {
        feature: "Proof of Work",
        custom: "Mandatory in-app photo upload and GPS timestamp before a job can be marked completed.",
        offTheShelf: "Disorganized WhatsApp photos scattered across personal phones with zero timestamp audit trail."
      },
      {
        feature: "Commission Splitting",
        custom: "Automated split payments via Stripe Connect directly depositing earnings to contractors.",
        offTheShelf: "Hours of manual end-of-month spreadsheet reconciliation and manual bank transfers."
      },
      {
        feature: "Unified Codebase",
        custom: "Customer booking, worker app, and admin desk in a single synchronized repository.",
        offTheShelf: "Fragmented third-party tools glued together with fragile Zapier webhooks."
      }
    ],
    architectureBlueprint: [
      {
        title: "Customer Booking & Upfront Payment Flow",
        description: "Instant quote calculations, real-time calendar availability, card pre-authorization, and live booking milestone tracking.",
        techHighlights: ["Next.js 16 App Router", "Stripe Custom Elements", "Escrow Pre-Authorization", "Server Actions"]
      },
      {
        title: "Provider Mobile Web App & Dispatch Queue",
        description: "Mobile interface with instant job notifications, turn-by-turn routing, GPS arrival timestamps, and mandatory before/after photo uploads.",
        techHighlights: ["Mobile PWA", "Supabase Storage CDN", "Leaflet / Google Maps API", "Optimistic UI"]
      },
      {
        title: "Operations Command Center & Map Dispatch",
        description: "Real-time interactive map of active jobs, dispute mediation tools, driver clustering, and manual override capabilities.",
        techHighlights: ["Realtime WebSockets", "Role-Based Access Control", "Interactive Dispatch Kanban"]
      },
      {
        title: "Stripe Connect Split Payout & Commission Engine",
        description: "Automated commission deductions, contractor balance payouts, automated PDF invoicing, and annual earnings tax export summaries.",
        techHighlights: ["Stripe Connect Express", "Automated Split Webhooks", "PDFKit Invoice Engine"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: 3-Sided Workflow Architecture & UX Design",
        duration: "Week 1–3",
        focus: "Mapping customer booking funnels, service contractor workflows, and dispatcher governance into clickable interactive prototypes.",
        deliverables: ["Figma prototypes for all 3 apps", "Relational database schema", "Fixed functional specification"]
      },
      {
        phase: "Phase 2: Customer Booking & Provider Mobile Apps",
        duration: "Week 4–8",
        focus: "Building responsive customer booking interfaces, calendar availability logic, provider job queues, and photo upload pipelines.",
        deliverables: ["Customer booking staging build", "Service provider mobile app", "Photo verification pipeline"]
      },
      {
        phase: "Phase 3: Stripe Connect Payouts & Admin Console",
        duration: "Week 9–12",
        focus: "Integrating automated split payouts, master dispatch dashboard, customer review flows, and automated notification triggers.",
        deliverables: ["Live Stripe Connect testing", "Master operations dispatch console", "Automated SMS/Email triggers"]
      },
      {
        phase: "Phase 4: Field Testing & Regional Production Launch",
        duration: "Week 13–16",
        focus: "Simulating live field bookings, testing payment escrow release under real scenarios, and rolling out initial geographical territories.",
        deliverables: ["Production infrastructure cutover", "Admin operations training", "30-day post-launch warranty"]
      }
    ],
    faqs: [
      {
        q: "How do payments and provider payouts work?",
        a: "We integrate Stripe Connect. When a customer books a service, funds are authorized and held. Upon provider job completion and mandatory photo upload, the platform deducts your commission fee automatically and deposits the contractor's payout directly into their bank account.",
      },
      {
        q: "Are the applications web-based or native mobile apps (iOS/Android)?",
        a: "We engineer Progressive Web Applications (PWAs) and mobile-optimized Next.js web applications that work instantly on any iOS or Android device without requiring app store download delays, while also supporting native React Native wrappers when required.",
      },
      {
        q: "What is the typical development timeline for a 3-sided marketplace?",
        a: "Building all three synchronized modules (Customer, Provider, and Admin) typically takes between 10 to 16 weeks, delivered across phased milestones with active staging test environments.",
      },
      {
        q: "Can we support multiple geographical cities with custom pricing?",
        a: "Yes. The architecture supports dynamic regional rules, letting you define unique service catalogs, minimum call-out fees, and surge pricing multipliers by postcode or city district.",
      },
    ],
  },
  {
    slug: "website-development",
    navLabel: "Websites",
    oneLiner: "Sub-second Next.js web applications and high-conversion marketing sites built for Core Web Vitals and lead generation.",
    headline: "High-Performance Web Applications Engineered to Convert Traffic into High-Value Inquiries",
    intro:
      "Your website is the foundational digital anchor of your business. We engineer lightning-fast, search-optimized web applications utilizing Next.js App Router that load in under a second, pass Core Web Vitals with flying colors, and clearly communicate your value proposition to turn inbound traffic into qualified discovery calls.",
    included: [
      "Next.js App Router Architecture: Edge-rendered, statically generated pages with sub-200ms Time to First Byte (TTFB).",
      "Conversion-Focused Copy & Structure: Clear visual hierarchy, benefit-driven headlines, and interactive ROI calculators designed to convert.",
      "Comprehensive SEO & Schema Markup: Automated XML sitemaps, OpenGraph cards, JSON-LD structured data, and canonical URL routing.",
      "Interactive Lead Capture & CRM Sync: Multi-step booking forms, Google Calendar scheduling widgets, and instant CRM webhook pipelines.",
      "Core Web Vitals Guarantee: 95+ Google PageSpeed score on mobile and desktop, zero layout shifts, and optimized asset delivery.",
    ],
    whoFor:
      "B2B service businesses, tech companies, and commercial contractors whose existing website is slow, outdated, or failing to convert traffic into leads.",
    related: ["property-compliance-crm"],
    roiHighlights: [
      { metric: "< 0.8s", label: "Page Load Speed", detail: "Edge-cached static delivery ensuring sub-second Largest Contentful Paint (LCP)." },
      { metric: "99%", label: "Passing Core Web Vitals", detail: "Zero layout shift (CLS), instant response (INP), and optimized hydration." },
      { metric: "100%", label: "CRM Lead Automation", detail: "Inbound form submissions routed directly into your CRM and Slack in real time." }
    ],
    comparisonMatrix: [
      {
        feature: "Speed & Core Web Vitals",
        custom: "Sub-800ms Next.js SSR/ISR delivery with zero render-blocking plugin bloat.",
        offTheShelf: "Heavy WordPress / Elementor themes loading 40+ plugins and taking 3.5s+ to paint."
      },
      {
        feature: "Lead Conversion Depth",
        custom: "Interactive ROI calculators, custom step forms, and instant calendar booking sync.",
        offTheShelf: "Generic contact form plugins that frequently drop submissions or fail spam checks."
      },
      {
        feature: "Security & Upkeep",
        custom: "Headless serverless hosting with zero vulnerable PHP plugins or database hacks.",
        offTheShelf: "Continuous plugin update vulnerabilities and weekly maintenance downtime risk."
      },
      {
        feature: "Technical SEO Foundation",
        custom: "Deep Schema.org entity graphs, programmatic URL logic, and optimized image pipelines.",
        offTheShelf: "Basic third-party SEO plugins generating superficial meta tags."
      }
    ],
    architectureBlueprint: [
      {
        title: "Edge Rendering & Global Caching Layer",
        description: "Next.js App Router deploying static HTML to global edge nodes with instant revalidation upon CMS or database edits.",
        techHighlights: ["Next.js 16", "Cloudflare CDN", "Server Components", "Tailwind CSS"]
      },
      {
        title: "Interactive Lead Qualification Funnel",
        description: "Multi-step interactive forms that pre-qualify inbound commercial prospects before syncing directly to your CRM.",
        techHighlights: ["Server Actions", "CRM Webhooks", "Optimistic Validation", "Resend API"]
      },
      {
        title: "Automated Structured Data & Entity Graph",
        description: "Automated JSON-LD schemas covering Organization, Service, Breadcrumbs, and FAQs to earn rich snippets in Google SERPs.",
        techHighlights: ["Schema.org Graph", "Dynamic OpenGraph", "XML Sitemap Generator"]
      },
      {
        title: "Asset & Layout Stability Optimization",
        description: "Responsive AVIF/WebP image pipelines with strict layout preservation preventing Cumulative Layout Shift (CLS).",
        techHighlights: ["next/image", "Dynamic SVG Generation", "Font Subsetting"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: Messaging, Conversion Hierarchy & Wireframing",
        duration: "Week 1–2",
        focus: "Crafting clear value propositions, customer journeys, and clickable desktop & mobile Figma prototypes.",
        deliverables: ["Conversion-focused copywriting", "Complete Figma design system", "Technical architecture brief"]
      },
      {
        phase: "Phase 2: High-Performance Next.js Engineering",
        duration: "Week 3–4",
        focus: "Building all pages as high-speed React Server Components with sub-second page transition speeds.",
        deliverables: ["Functional staging website", "Interactive ROI calculators", "Mobile-optimized responsive layouts"]
      },
      {
        phase: "Phase 3: Lead Routing, Analytics & Schema QA",
        duration: "Week 5",
        focus: "Connecting CRM webhooks, calendar scheduling widgets, conversion tracking pixels, and structured data audits.",
        deliverables: ["CRM webhook integrations", "Google Analytics 4 & Meta Pixel setup", "100% Schema validation"]
      },
      {
        phase: "Phase 4: Domain Cutover & 30-Day Launch Warranty",
        duration: "Week 6",
        focus: "Executing zero-downtime DNS cutover, setting up 301 redirects for legacy URLs, and monitoring Core Web Vitals.",
        deliverables: ["Production DNS cutover", "301 redirect map", "30 days included launch support"]
      }
    ],
    faqs: [
      {
        q: "How fast will the website load?",
        a: "We build with Next.js App Router and server-side static generation. Pages typically load in under 0.8 seconds worldwide and score 95+ on Google PageSpeed Insights.",
      },
      {
        q: "Can the website connect directly to our CRM and calendar?",
        a: "Yes. All contact forms and calendar pickers push lead records directly into your CRM, database, or notification channels in real time.",
      },
      {
        q: "Can our internal team edit content easily without touching code?",
        a: "Yes. We can integrate lightweight headless CMS systems (such as Supabase, Sanity, or Markdown repos) that let non-technical team members update copy, case studies, and blog posts effortlessly.",
      },
      {
        q: "Do you handle 301 redirects from our current website?",
        a: "Yes. We map and configure all historical URLs to preserve existing search engine rankings and backlink authority during cutover.",
      },
    ],
  },
  {
    slug: "seo-growth",
    navLabel: "SEO and growth",
    oneLiner: "Technical SEO, Answer Engine Optimization (AEO), and programmatic content systems to dominate Google, ChatGPT, and Perplexity.",
    headline: "Technical SEO & Generative Search Engineering: Capture High-Intent Commercial Inquiries",
    intro:
      "Search is evolving rapidly from traditional keyword matching into AI-driven answer engines (Google AI Overviews, Perplexity, ChatGPT Search). We build high-performance technical SEO architectures, Schema.org entity graphs, and programmatic content engines that establish your brand as the definitive authority in your industry.",
    included: [
      "Technical Core Web Vitals & Crawl Budget Audit: Eliminating redirect chains, indexing bloat, and hydration bottlenecks.",
      "Schema.org Entity Graph Architecture: Deep structured data graphs (Organization, Service, FAQPage, Article, Speakable) for rich SERP snippets.",
      "Generative Engine Optimization (GEO & AEO): Structuring content for direct answer citation by Google AI Overviews and Perplexity.",
      "Direct AI Standards Support: Full support for /llms.txt and /llms-full.txt machine-readable indexing feeds.",
      "High-Intent Keyword & Competitor Mapping: Targeting commercial 'buyer intent' search terms with measurable conversion tracking.",
    ],
    whoFor:
      "B2B service businesses and SaaS platforms looking to scale inbound qualified lead volume without relying exclusively on rising paid ad costs.",
    related: [],
    roiHighlights: [
      { metric: "100%", label: "Indexation Efficiency", detail: "Eliminate low-value crawl traps and duplicate canonical confusion." },
      { metric: "Top-Tier", label: "Entity Authority", detail: "Connected Schema.org graph establishing your brand identity in Knowledge Graphs." },
      { metric: "AI-Ready", label: "Answer Engine Citations", detail: "Structured data feeds directly cited by Google AI Overviews and Perplexity." }
    ],
    comparisonMatrix: [
      {
        feature: "Architecture Depth",
        custom: "Clean semantic server-rendered HTML with deep Schema.org entity graphs.",
        offTheShelf: "Generic SEO plugins producing superficial meta tags without true entity linkages."
      },
      {
        feature: "AI / GEO Readiness",
        custom: "Dedicated /llms.txt endpoints and answer-first structured passages for AI models.",
        offTheShelf: "Unstructured copy that generative AI answer engines struggle to parse or cite."
      },
      {
        feature: "Crawl Scalability",
        custom: "Selective programmatic SEO engines that enforce quality floors and avoid doorway penalties.",
        offTheShelf: "Indiscriminate programmatic content generation that triggers Google helpful-content penalties."
      },
      {
        feature: "Speed & Performance",
        custom: "Sub-second serverless response times ensuring Googlebot crawls 10x more pages per visit.",
        offTheShelf: "Slow server responses that exhaust crawl budget and reduce indexing frequency."
      }
    ],
    architectureBlueprint: [
      {
        title: "Semantic Schema Graph & JSON-LD Engine",
        description: "Connected entity graph interlinking Organization, Services, Breadcrumbs, and FAQs to maximize Knowledge Graph prominence.",
        techHighlights: ["Schema.org Standards", "JSON-LD Graph", "Google Rich Results QA", "TypeScript"]
      },
      {
        title: "Edge-Cached Dynamic XML Sitemaps",
        description: "High-performance sitemap generators with automated lastmod calculation, separating core authoritative hubs from draft pages.",
        techHighlights: ["Next.js Sitemap API", "Hourly Edge Cache", "IndexNow Ping Worker"]
      },
      {
        title: "AI Extraction & Answer-First Layouts",
        description: "Answer Engine Optimization (AEO) formatting designed for direct citation by Perplexity, ChatGPT Search, and Google AI Overviews.",
        techHighlights: ["/llms.txt Standard", "/llms-full.txt Feed", "Markdown Transpilation"]
      },
      {
        title: "Crawl Budget & Hydration Optimization",
        description: "Pruning low-value query parameters, consolidating canonical targets, and eliminating client-side JavaScript hydration lag.",
        techHighlights: ["Robots.txt Directives", "Canonical Normalization", "Server Component Pre-rendering"]
      }
    ],
    deliveryPhases: [
      {
        phase: "Phase 1: Technical Crawl & Indexation Hygiene Audit",
        duration: "Week 1–2",
        focus: "Auditing sitemap health, server headers, canonical loops, duplicate content shingles, and mobile Core Web Vitals.",
        deliverables: ["Full crawl health scorecard", "Canonical & redirect cleanup plan", "Core Web Vitals remediation"]
      },
      {
        phase: "Phase 2: Schema Entity Graphs & Answer Engine Optimization",
        duration: "Week 3–4",
        focus: "Implementing rich JSON-LD graph architecture, adding /llms.txt endpoints, and structuring answer-first FAQ blocks.",
        deliverables: ["Validated Schema.org graph", "/llms.txt machine-readable feeds", "Answer-first heading structure"]
      },
      {
        phase: "Phase 3: Programmatic Architecture & Landing Page Templates",
        duration: "Week 5–7",
        focus: "Designing high-intent commercial landing page systems with strict quality controls and unique localized proof.",
        deliverables: ["Quality-filtered programmatic engine", "Automated metadata generator", "Conversion-focused CTA integration"]
      },
      {
        phase: "Phase 4: Search Console Monitoring & Compounding Growth",
        duration: "Week 8+",
        focus: "Tracking impression velocity, crawl frequency in server logs, non-branded keyword positions, and commercial conversion lift.",
        deliverables: ["Monthly Search Console reporting", "Continuous technical crawl audits", "Keyword expansion roadmap"]
      }
    ],
    faqs: [
      {
        q: "What is Answer Engine Optimization (AEO) and how does it help us?",
        a: "AEO structures your site's data and content so AI engines (like Google AI Overviews, ChatGPT Search, and Perplexity) cite your company as the authoritative answer to user queries, driving high-intent referrals.",
      },
      {
        q: "How long does technical SEO take to deliver measurable ROI?",
        a: "Technical crawl and performance fixes often show indexing improvements within 2 to 4 weeks, with compounding organic ranking and inquiry growth occurring over 3 to 6 months.",
      },
      {
        q: "How do you avoid programmatic SEO penalties?",
        a: "We enforce strict programmatic SEO quality gates: pruning low-value permutation pages, injecting unique client and workflow proof into every template, and only indexing pages with demonstrated commercial demand.",
      },
      {
        q: "Do you fix Core Web Vitals issues directly in the code?",
        a: "Yes. Unlike consulting agencies that only deliver PDF recommendations, our software engineering team writes the actual code to fix layout shifts (CLS), optimize bundle sizes (INP), and accelerate page paints (LCP).",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
