import type { Faq } from "@/lib/content/services";

export type IndustryComparison = {
  dimension: string;
  bespokeSolution: string;
  genericOrSpreadsheet: string;
};

export type IndustryPage = {
  slug: string;
  navLabel: string;
  displayLabel: string;
  headline: string;
  intro: string;
  painPoints: string[];
  whatWeBuild: string[];
  caseStudySlug: string;
  relatedServiceSlugs: string[];
  faqs: Faq[];
  stats?: Array<{ metric: string; label: string; detail: string }>;
  comparison?: IndustryComparison[];
};

export const industries: IndustryPage[] = [
  {
    slug: "property",
    navLabel: "Property",
    displayLabel: "Property, Real Estate & Compliance",
    headline: "Custom Multi-Portal CRMs for Property Management & Compliance Inspection Agencies",
    intro:
      "Property management and compliance companies operate in high-complexity environments: coordinating hundreds of real estate agencies, thousands of rental properties, field technicians, landlords, and tenants across tight statutory deadlines. We build bespoke multi-portal CRMs that automate work order dispatch, mobile inspection checklists, photo-verified compliance certificates, and instant agency billing.",
    painPoints: [
      "Fragmented Communications: Agencies, property managers, field inspectors, and central operations communicating through unlinked email chains, WhatsApp groups, and spreadsheets.",
      "Compliance Bottlenecks: Safety inspections (smoke alarms, gas safety, electrical checks) slipping past statutory deadlines due to lack of a unified real-time tracking matrix.",
      "Delayed Certificate Delivery: Taking 3 to 7 business days to manually type up, verify, and email safety certificates and invoices to real estate property managers.",
      "Lack of Regional Ops Visibility: Leadership unable to assess inspector efficiency, job turnaround times, or gross margin per agency without hours of manual report compilation.",
    ],
    whatWeBuild: [
      "Agency Self-Service Portal: Real estate property managers log in, submit new properties, view live compliance statuses, and download safety certificates on demand.",
      "Field Inspector Mobile App: Turn-by-turn route optimization, mandatory digital checklists, required photo proof of serial numbers, and digital on-site signatures.",
      "Operations Dispatch Command Center: Central dispatcher assigns jobs with location-based grouping, monitors delayed tasks, and reviews inspector submissions in real time.",
      "Automated Certificate & Invoicing Engine: Safety certificates and invoices are generated and emailed automatically within seconds of inspection sign-off.",
      "Automated Tenant & Landlord SMS Notification Flow: Interactive booking confirmations with self-service reschedule links to eliminate missed technician visits.",
    ],
    caseStudySlug: "property-compliance-crm",
    relatedServiceSlugs: ["crm-development", "erp-hrm-systems"],
    stats: [
      { metric: "4,000+", label: "Rental Properties", detail: "Actively managed on a single multi-tenant compliance platform." },
      { metric: "30+", label: "Real Estate Agencies", detail: "Self-servicing certificate downloads with zero phone calls to admin." },
      { metric: "4x", label: "Faster Turnaround", detail: "From booking to issued certificate in under 48 hours." }
    ],
    comparison: [
      {
        dimension: "Agency Experience",
        bespokeSolution: "Dedicated branded agency portal where property managers download certificates anytime without emailing you.",
        genericOrSpreadsheet: "Constant phone calls and emails asking 'what is the status of property X?'."
      },
      {
        dimension: "Field Tech Dispatch",
        bespokeSolution: "Mobile web app with digital checklists and mandatory photo proof before completing a job.",
        genericOrSpreadsheet: "Paper job sheets or messy WhatsApp photos with no timestamp audit trail."
      },
      {
        dimension: "Certificate Issuance",
        bespokeSolution: "Instant automated PDF generation and email delivery upon inspector sign-off.",
        genericOrSpreadsheet: "Days of manual Word/PDF drafting by central office staff."
      }
    ],
    faqs: [
      {
        q: "Can this system handle multiple real estate agency branches and separate portfolios?",
        a: "Yes. Our architecture utilizes strict multi-tenant data isolation. Each real estate agency and individual property manager logs into their own portal view, seeing only their designated rental portfolio, active work orders, and historical certificates.",
      },
      {
        q: "How does the mobile app work for field inspectors in areas with poor reception?",
        a: "We engineer Progressive Web Applications (PWAs) with local caching. Inspectors can complete digital inspection checklists, capture mandatory photos, and collect signatures offline; the data automatically syncs once connection is restored.",
      },
      {
        q: "Can it replace our spreadsheets, WhatsApp groups, and invoicing software?",
        a: "Yes. The custom CRM serves as your single operational source of truth, automating communication, dispatch, photo storage, and invoicing.",
      },
      {
        q: "How long does a property compliance CRM take to build and deploy?",
        a: "A multi-portal property CRM (covering Agency Portal, Mobile Inspector App, and Ops Dashboard) is typically delivered in 8 to 12 weeks with phased sprint milestones.",
      },
    ],
  },
  {
    slug: "travel",
    navLabel: "Travel",
    displayLabel: "Travel & Flight Ticketing Agencies",
    headline: "Custom CRMs & Automated Lead Quotation Engines for Travel Agencies",
    intro:
      "Travel and flight ticketing agencies lose thousands in revenue every month because inbound inquiries scatter across personal agent WhatsApp chats, Facebook pages, phone calls, and walk-ins. We engineer centralized ticketing CRMs that auto-ingest leads from all channels, enforce 15-minute response SLAs, calculate multi-leg flight markups, and deliver real-time sales leaderboards.",
    painPoints: [
      "Unassigned Inbound Inquiries: High-intent leads sitting unanswered in Facebook DMs or WhatsApp chats while agents handle manual tasks.",
      "Slow Quotation Turnaround: Agents taking 3 to 5 hours to construct multi-leg flight comparisons and manually draft quotes.",
      "Zero Sales Pipeline Visibility: Management having no live visibility into active quotes, conversion rates, or individual agent revenue performance.",
      "Duplicate & Conflicting Quotes: Multiple agents unknowingly contacting the same client with conflicting pricing.",
    ],
    whatWeBuild: [
      "Omnichannel Ingestion Queue: Auto-captures inquiries from WhatsApp Business API, Facebook Messenger webhooks, web forms, and phone logs into a unified queue.",
      "Rapid Itinerary & Quote Builder: Agents assemble multi-leg flight options, calculate markups, and generate branded PDF quotes in minutes.",
      "Intelligent Lead Distribution: Automatically routes inbound inquiries based on agent destination specialty, historical conversion speed, and active workload.",
      "GDS & Stripe Booking Synchronization: Links PNR booking records directly with Stripe deposit links and automated ticket issuance alerts.",
      "Executive KPI Leaderboard: Live analytics tracking agent response velocity, active quote pipeline values, win rates, and gross margin.",
    ],
    caseStudySlug: "airline-ticketing-crm",
    relatedServiceSlugs: ["crm-development"],
    stats: [
      { metric: "18 Min", label: "Average Quote Speed", detail: "Down from 4+ hours, capturing travel buyers while intent is highest." },
      { metric: "+38%", label: "Conversion Lift", detail: "Automated escalation for uncontacted inquiries within 15 minutes." },
      { metric: "100%", label: "Channel Centralization", detail: "WhatsApp, Facebook, phone, and walk-in leads managed in one place." }
    ],
    comparison: [
      {
        dimension: "Lead Centralization",
        bespokeSolution: "Omnichannel queue auto-ingesting WhatsApp, Facebook, phone, and website leads.",
        genericOrSpreadsheet: "Leads trapped inside individual agent personal phones and messy spreadsheets."
      },
      {
        dimension: "Management Visibility",
        bespokeSolution: "Real-time executive dashboard showing gross sales, agent win rates, and overdue follow-ups.",
        genericOrSpreadsheet: "No visibility until end-of-month accounting spreadsheets are compiled."
      }
    ],
    faqs: [
      {
        q: "Can this system integrate directly with WhatsApp Business Cloud API?",
        a: "Yes. Inbound WhatsApp messages instantly create leads in the CRM, allowing agents to respond directly through the centralized interface with automated conversation logs.",
      },
      {
        q: "How does the system prevent duplicate quotes from being sent to the same client?",
        a: "The CRM automatically matches inbound phone numbers, email addresses, and names against existing active records, alerting agents if an itinerary is already being prepared.",
      },
      {
        q: "Can we track individual agent sales targets and commissions?",
        a: "Yes. The platform includes customizable commission calculation rules and real-time leaderboards showing individual agent revenue progress against monthly targets.",
      },
    ],
  },
  {
    slug: "home-services",
    navLabel: "Home services",
    displayLabel: "Cleaning & Home Services",
    headline: "On-Demand Booking, Dispatch & Mobile Proof-of-Work Platforms for Home Services",
    intro:
      "Home service and commercial cleaning operations struggle to scale because taking bookings over the phone, chasing post-job payments, and handling customer quality disputes creates immense administrative overhead. We engineer unified 3-sided platforms: customer booking with upfront Stripe authorization, provider mobile app with mandatory photo proof, and a central dispatcher command center.",
    painPoints: [
      "Chasing Unpaid Invoices: Performing jobs and having to follow up for payment days or weeks later.",
      "Customer Dispute Claims: Dealing with quality complaints or damage claims with zero verifiable on-site evidence.",
      "Manual Contractor Dispatch: Dispatchers spending hours coordinating cleaner schedules over phone calls and WhatsApp.",
      "Admin Overhead Scaling Linearly: Needing to hire more office staff every time you expand into a new territory.",
    ],
    whatWeBuild: [
      "Customer Booking & Payment Flow: Upfront service pricing, automated calendar availability, and pre-authorized Stripe payments.",
      "Provider Mobile Web App: Turn-by-turn navigation, job checklist, mandatory before/after photo uploads, and earnings tracking.",
      "Admin Operations CRM: Live heatmap of active jobs, automated split payouts, customer dispute manager, and territory management.",
      "Automated Customer Notifications: SMS reminders, cleaner en-route alerts, and post-job review collection.",
    ],
    caseStudySlug: "cleaning-marketplace",
    relatedServiceSlugs: ["marketplace-development"],
    stats: [
      { metric: "100%", label: "Upfront Payment", detail: "Zero unpaid jobs through pre-authorized card holds." },
      { metric: "0%", label: "Dispute Losses", detail: "Mandatory timestamped photo proof protects against fraudulent claims." },
      { metric: "3x", label: "Territory Expansion", detail: "Scale cleaner network without increasing central dispatch headcount." }
    ],
    faqs: [
      {
        q: "How does the upfront payment flow work?",
        a: "Customers enter their payment details at booking. Stripe authorizes and holds the funds. Once the cleaner completes the job and uploads verified before/after photos, the payment is captured automatically.",
      },
      {
        q: "How does photo proof protect our business against customer disputes?",
        a: "Cleaners cannot mark a job complete without uploading required timestamped photos of key areas. If a customer questions the work, dispatch can immediately review high-resolution proof in the admin console.",
      },
    ],
  },
  {
    slug: "logistics",
    navLabel: "Logistics",
    displayLabel: "Transport, Fleet & Logistics",
    headline: "Mobile-First Fleet Coordination & Incident Breakdown Management Platforms",
    intro:
      "In commercial transport and logistics, fleet breakdowns and roadside incidents cost thousands per hour in lost driver productivity and delivery penalties. We engineer mobile-first breakdown management and fleet dispatch systems that connect drivers, dispatchers, and recovery technicians in real time.",
    painPoints: [
      "Protracted Phone Call Coordination: Dispatchers spending 30+ minutes collecting basic vehicle breakdown details over unstable phone calls.",
      "No Central Visibility: Management having no live map view of disabled vehicles, tow truck ETAs, or delayed cargo.",
      "Inaccurate Location Reporting: Drivers struggling to convey exact motorway marker posts or depot locations.",
    ],
    whatWeBuild: [
      "Driver Incident Mobile Interface: 1-click GPS location sharing, vehicle defect photo capture, and instant ticket logging.",
      "Dispatcher Incident Matrix: Real-time map view of disabled units, nearby certified recovery partners, and live status progress.",
      "Automated SLA & Cargo Delay Alerts: Instant automated notifications to client logistics managers regarding revised delivery estimates.",
    ],
    caseStudySlug: "logistics-platform",
    relatedServiceSlugs: ["erp-hrm-systems", "marketplace-development"],
    stats: [
      { metric: "40%", label: "Faster Coordination", detail: "Cut driver roadside incident turnaround from 90 to 54 minutes." },
      { metric: "GPS", label: "Pinpoint Dispatch", detail: "Instant location capture eliminates driver positioning errors." },
      { metric: "Live", label: "Status Telemetry", detail: "Real-time visibility across all active fleet breakdowns." }
    ],
    faqs: [
      {
        q: "Can drivers submit breakdown reports without installing a native app store app?",
        a: "Yes. We build Progressive Web Applications (PWAs) that drivers open instantly in their mobile browser with 1-click GPS sharing and photo upload capabilities.",
      },
      {
        q: "Can this system integrate with our existing telematics or ERP software?",
        a: "Yes. We build RESTful API and webhook synchronizations with fleet telematics, fuel card systems, and ERP accounting software.",
      },
    ],
  },
  {
    slug: "recruitment",
    navLabel: "Recruitment",
    displayLabel: "Recruitment & Staffing Agencies",
    headline: "Candidate Self-Service Portals & Automated Compliance Recruitment CRMs",
    intro:
      "Recruitment agencies waste hundreds of hours chasing candidate identity documents, police checks, certifications, and application status updates across email and WhatsApp. We build recruitment CRMs featuring real-time candidate portals, automated compliance verification, and post-placement tracking.",
    painPoints: [
      "Document Chasing Chaos: Visas, right-to-work checks, and certificates scattered across recruiter inboxes and hard drives.",
      "Candidate Phone Inquiries: Candidates calling repeatedly just to ask where their application stands in the review process.",
      "Zero Post-Placement Tracking: Losing visibility into placed candidate contract durations, renewal dates, and billing milestones.",
    ],
    whatWeBuild: [
      "Candidate Self-Service Portal: Candidates apply, upload required compliance documents, and view live application status.",
      "Recruiter Compliance Dashboard: Fast-action document verification, interview scheduling, and automated candidate WhatsApp triggers.",
      "Post-Placement Tracking Engine: Monitors contract start dates, billing rates, milestone renewals, and client satisfaction.",
    ],
    caseStudySlug: "recruitment-crm",
    relatedServiceSlugs: ["crm-development"],
    stats: [
      { metric: "70%", label: "Fewer Status Calls", detail: "Candidates track their application progress directly online." },
      { metric: "100%", label: "Compliance Audit", detail: "Zero missing right-to-work documents before placement." },
      { metric: "Instant", label: "WhatsApp Triggers", detail: "Automated status alerts keep candidates engaged." }
    ],
    faqs: [
      {
        q: "Can candidates upload documents directly from their mobile phones?",
        a: "Yes. The candidate portal is mobile-optimized with camera integration, allowing candidates to photograph and upload passports, visas, and certificates in seconds.",
      },
      {
        q: "Can we track contract renewals and post-placement milestones?",
        a: "Yes. The platform includes automated alerts 30 and 60 days prior to contract expiration so recruiters can initiate extension negotiations early.",
      },
    ],
  },
  {
    slug: "education",
    navLabel: "Education",
    displayLabel: "Education & Tutoring Platforms",
    headline: "AI-Powered Learning Platforms, Instant Quiz Grading & Parent Progress Hubs",
    intro:
      "Tutoring centers and education companies lose valuable teaching time creating manual homework assignments, grading quizzes, and compiling progress reports for parents. We build intelligent education platforms featuring AI-generated question banks, instant grading with feedback, and dedicated parent progress portals.",
    painPoints: [
      "Hours Lost Marking Work: Tutors spending 10+ hours every week hand-marking repetitive homework papers.",
      "Lack of Parent Visibility: Parents feeling disconnected from their child's curriculum progress and test scores.",
      "Late Intervention for At-Risk Students: Failing to identify knowledge gaps until term exams reveal the issue.",
    ],
    whatWeBuild: [
      "AI Curriculum Quiz Engine: Generates dynamic quizzes and practice questions matched to student grade level and subject.",
      "Instant Automated Grading & Feedback: Evaluates answers immediately, highlighting conceptual misconceptions.",
      "Parent & Student Progress Portal: Visual dashboards showing test score trajectories, homework completion, and attendance.",
      "Tutor Alert Dashboard: Identifies struggling students early and suggests targeted intervention topics.",
    ],
    caseStudySlug: "ai-tutoring-platform",
    relatedServiceSlugs: ["saas-development"],
    stats: [
      { metric: "10+ Hrs", label: "Saved Weekly", detail: "Per tutor on manual quiz creation and grading." },
      { metric: "Instant", label: "Automated Feedback", detail: "Students learn from mistakes immediately rather than waiting days." },
      { metric: "100%", label: "Parent Transparency", detail: "Live visibility into test scores and learning progress." }
    ],
    faqs: [
      {
        q: "How does the AI quiz generation and grading work?",
        a: "The system integrates fine-tuned LLM APIs with your syllabus parameters to generate varied practice questions and accurately evaluate student explanations with actionable feedback.",
      },
      {
        q: "Can parents access the system from their smartphones?",
        a: "Yes. Parents have their own secure portal showing historical test trends, attendance logs, and upcoming lesson schedules.",
      },
    ],
  },
  {
    slug: "community",
    navLabel: "Community",
    displayLabel: "High-Trust Community & Matchmaking Platforms",
    headline: "High-Trust Community Platforms with Tiered Identity Verification & AI Matching",
    intro:
      "In community and matchmaking platforms, trust is the fundamental product. If users encounter fake profiles or unvetted members, engagement collapses. We build high-trust platforms featuring 5-tier identity verification, AI compatibility algorithms, encrypted messaging, and recurring Stripe subscriptions.",
    painPoints: [
      "Fake Profiles & Safety Concerns: Weak registration processes resulting in spam, fraudulent accounts, and damaged user trust.",
      "Manual Matchmaking Bottlenecks: Admins spending hours manually pairing members without intelligent compatibility logic.",
      "Monetization Friction: Clunky payment gateways causing high subscription churn and failed renewals.",
    ],
    whatWeBuild: [
      "5-Tier Verification Engine: Identity document validation, phone verification, social verification, and police background checks.",
      "AI Compatibility Matchmaker: Semantic scoring evaluating multi-dimensional lifestyle, cultural, and personal preferences.",
      "Encrypted Member Communications: Direct 1-on-1 messaging, photo privacy controls, and community discussion spaces.",
      "Tiered Stripe Monetization: Free trial tiers, monthly/annual premium subscriptions, and paid profile boosts.",
    ],
    caseStudySlug: "matrimony-saas-platform",
    relatedServiceSlugs: ["saas-development"],
    stats: [
      { metric: "5-Tier", label: "Verification", detail: "Police check and ID validation ensures 100% genuine member base." },
      { metric: "AI-Powered", label: "Compatibility Engine", detail: "Multi-factor matching boosts member conversation rates." },
      { metric: "Recurring", label: "Stripe Subscriptions", detail: "Automated renewal billing with zero payment friction." }
    ],
    faqs: [
      {
        q: "How secure is user identity data and verification documents?",
        a: "All sensitive identity documents and police check verification records are encrypted at rest using AES-256 and stored in private Supabase buckets accessible only by authenticated compliance reviewers.",
      },
      {
        q: "Can members control their profile privacy and photo visibility?",
        a: "Yes. Members can blur photos, toggle profile visibility, and grant viewing permissions only to verified mutual matches.",
      },
    ],
  },
];

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}
