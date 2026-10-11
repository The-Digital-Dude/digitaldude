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
    displayLabel: "Property, Real Estate & Deeds Management",
    headline: "Deeds Management Software & Custom Multi-Portal Property CRMs",
    intro:
      "For real estate professionals, conveyancing practices, and agency networks, managing title deeds, lease contracts, and statutory compliance across large portfolios creates critical bottlenecks. We engineer secure deeds management software, document management software, and bespoke property CRMs that automate deed processing, reduce manual data entry, streamline search and retrieval, and deliver encrypted document workflows.",
    painPoints: [
      "Fragmented Deed Document Workflows: Real estate professionals managing title deeds, conveyancing records, and lease covenants across disconnected physical folders and email chains.",
      "Manual Data Entry & Filing Errors: Operations staff wasting dozens of hours re-keying financial data and deed processing records, increasing the risk of boundary or title errors.",
      "Slow Search and Retrieval: Taking hours or days to locate deed documents, land records management history, and compliance certificates during urgent transactions.",
      "Lack of Multi-Agency Management Support: Inability for external law firms, conveyancers, and property managers to collaborate securely within a unified management platform.",
    ],
    whatWeBuild: [
      "Deeds Management Software & Document Workflow Hub: AI-powered search and retrieval for title deeds, mortgage records, and covenant restrictions with instant OCR indexing.",
      "Agency & Landlord Self-Service Portal: Real estate professionals and landlords log in, review deed document status, and download certificates from secure storage.",
      "Automated Deed Processing & Compliance Tracking: Automated land records management validation reducing manual admin and eliminating statutory compliance lapses.",
      "Mobile Field Inspection & Condition App: Inspectors record property condition, capture photo evidence, and link reports directly to deed records.",
      "Secure Financial Data & Accounting Integration: Direct software integrate pipelines connecting property registers with Xero, QuickBooks, and client billing.",
    ],
    caseStudySlug: "property-compliance-crm",
    relatedServiceSlugs: ["crm-development", "erp-hrm-systems"],
    stats: [
      { metric: "4,000+", label: "Rental & Deed Records", detail: "Actively managed with instant search and retrieval." },
      { metric: "30+", label: "Real Estate Agencies", detail: "Self-servicing title deeds and certificates securely." },
      { metric: "4x", label: "Faster Turnaround", detail: "Automated document workflows cut turnaround to under 48 hours." }
    ],
    comparison: [
      {
        dimension: "Deed & Document Storage",
        bespokeSolution: "Cloud-native deeds management software with encrypted secure storage and instant keyword search.",
        genericOrSpreadsheet: "Unsecured file shares or physical deed cabinets with painful manual retrieval."
      },
      {
        dimension: "Data Entry & Filing",
        bespokeSolution: "AI-powered optical recognition auto-extracting deed processing details with zero duplicate work.",
        genericOrSpreadsheet: "Hundreds of hours spent on manual data entry across multiple unlinked spreadsheets."
      },
      {
        dimension: "Stakeholder Collaboration",
        bespokeSolution: "Role-based portals where conveyancers, agents, and landlords access verified records in real time.",
        genericOrSpreadsheet: "Endless email attachments and unencrypted files prone to security vulnerabilities."
      }
    ],
    faqs: [
      {
        q: "What is deeds management software and how does it integrate with our existing property systems?",
        a: "Deeds management software is a specialized document management software solution that digitizes title deeds, property covenants, and conveyancing contracts. Our software integrate capabilities connect directly with your existing property management tools and accounting software, reducing the risk of compliance errors.",
      },
      {
        q: "How does AI-powered deed processing reduce manual data entry?",
        a: "Our management platform uses AI-powered optical character recognition to extract deed document boundaries, registration IDs, and financial data automatically, slashing manual data entry by over 80% and ensuring secure storage.",
      },
      {
        q: "How secure is client and landlord access to title deeds?",
        a: "We engineer bank-grade encryption with granular role-based permissions. Real estate professionals, solicitors, and property managers only access documents authorized for their specific agency or portfolio.",
      },
      {
        q: "What is the typical timeline to deploy a deeds management platform?",
        a: "A full deeds management software deployment—including legacy document migration, custom portals, and automated document workflow rules—typically launches within 8 to 12 weeks.",
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
    displayLabel: "Transport, Fleets & Dispatch",
    headline: "Fleet Manager Dispatch Software & Real-Time Logistics Coordination Systems",
    intro:
      "In commercial road haulage, incident recovery, and multi-depot transport, dispatchers and fleet managers operate under relentless margin pressure. We engineer bespoke fleet manager dispatch software, truck dispatch software, and transportation management systems that empower dispatchers to assign drivers, monitor GPS tracking on mobile devices, optimize routes, and provide clients with accurate ETAs and instant digital proof of delivery (POD).",
    painPoints: [
      "Fragmented Fleet Dispatch & Driver Assignment: Fleet manager dispatch teams wasting hours coordinating load information and drivers assign routines over unstable phone calls and messaging chats.",
      "Inaccurate ETAs & Blind Spots: Dispatchers having zero live map visibility of fleet tracking, vehicle breakdown status, or delivery status across regional routes.",
      "Paper-Based Proof of Delivery & Slow Driver Pay: Field drivers carrying physical paper manifests, causing 5-day invoice delays and dispute friction over driver pay calculations.",
      "Disconnected Accounting Software: Double-entry between transport dispatch boards, fuel card logs, and accounting software packages like Xero or Sage.",
    ],
    whatWeBuild: [
      "Fleet Manager Dispatch Software Console: High-density interactive matrix to assign drivers, balance load information, and review real time status updates on one screen.",
      "Driver Mobile App & Digital Proof of Delivery: Mobile web application with turn-by-turn route optimization, one-tap GPS tracking, barcode scanning, and instant photo proof of delivery.",
      "Real-Time Fleet Tracking & Incident Management: Live telemetry showing vehicle status, tow truck coordination, and automated customer notifications with accurate ETAs.",
      "Automated Driver Pay & Billing Engine: Automated rate calculation factoring mileage, waiting time, and load weight, generating instant invoices for accounting software sync.",
      "Client Self-Service Tracking Portal: Shippers and freight customers track delivery status and download signed proof of delivery certificates without calling dispatch.",
    ],
    caseStudySlug: "logistics-platform",
    relatedServiceSlugs: ["erp-hrm-systems", "marketplace-development"],
    stats: [
      { metric: "40%", label: "Faster Coordination", detail: "Cut roadside dispatch turnaround from 90 to 54 minutes." },
      { metric: "100%", label: "Digital PODs", detail: "Instant photo proof of delivery captured on driver mobile devices." },
      { metric: "Live", label: "Fleet Tracking", detail: "Real time status updates and route optimization across all units." }
    ],
    comparison: [
      {
        dimension: "Fleet Dispatch Board",
        bespokeSolution: "Bespoke fleet manager dispatch software tailored to your specific fleet types, trailers, and driver rosters.",
        genericOrSpreadsheet: "Static whiteboards, clunky generic tools, or chaotic spreadsheets requiring manual refreshing."
      },
      {
        dimension: "Driver Communication",
        bespokeSolution: "Mobile web interface with one-tap job acceptance, route optimization, and digital proof of delivery.",
        genericOrSpreadsheet: "Endless telephone calls, messy text messages, and lost paper delivery slips."
      },
      {
        dimension: "Delivery Status & Invoicing",
        bespokeSolution: "Real time status updates with automated invoicing directly synced to your accounting software.",
        genericOrSpreadsheet: "Days of manual administrative delay verifying paperwork before invoices can be sent."
      }
    ],
    faqs: [
      {
        q: "What is fleet manager dispatch software and how does it optimize transportation operations?",
        a: "Fleet manager dispatch software is an operational software solution and transportation management system designed to assign drivers, monitor GPS tracking on mobile devices, balance load information, and automate route optimization. It cuts fuel costs and provides customers with accurate ETAs.",
      },
      {
        q: "How does digital proof of delivery work on driver mobile devices?",
        a: "Drivers open our mobile application without app store friction, navigate via built-in GPS routing, capture customer signatures and photo verification on site, and instantly trigger digital proof of delivery (POD) back to dispatch.",
      },
      {
        q: "Can the fleet dispatch software calculate driver pay and integrate with accounting software?",
        a: "Yes. Our software calculates driver pay automatically based on completed routes, tonnage, and hours, feeding clean transaction batches directly into your accounting software (Xero, QuickBooks, or custom ERP).",
      },
      {
        q: "Can this system coordinate both standard truck dispatch and emergency breakdown incidents?",
        a: "Yes. Our architecture supports dual dispatch modes: scheduled freight load logistics and urgent on-demand breakdown recovery with live partner map clustering.",
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
