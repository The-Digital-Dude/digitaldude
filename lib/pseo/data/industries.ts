import { PseoIndustry } from "../types";

export const pseoIndustries: PseoIndustry[] = [
  {
    slug: "property",
    name: "Real Estate, Property & Compliance",
    iconName: "Building2",
    badge: "Property & Real Estate Tech",
    heroTagline: "Custom Multi-Portal CRMs for Real Estate Agencies, Strata & Property Compliance Operators",
    overview: "Property management and compliance inspection networks operate in high-friction environments: managing hundreds of estate agencies, thousands of properties, mobile inspectors, and strict statutory deadlines.",
    corePainPoints: [
      { title: "Statutory Deadline Slippage", desc: "Smoke alarm, gas safety, and electrical checks falling overdue because spreadsheets don't alert dispatchers in real time." },
      { title: "Manual Certificate Dispatch", desc: "Taking 3–7 business days to format, verify, and email safety certificates and invoices to real estate property managers." },
      { title: "Constant Agency Inquiries", desc: "Staff bombarded with calls and emails asking 'What is the compliance status of 14 Elm Street?'." },
      { title: "Zero Inspector Route Optimization", desc: "Technicians wasting hours zigzagging across the city without automated geo-clustered dispatch." }
    ],
    statutoryCompliance: ["UK Gas Safety Regulations 1998", "Electrical Safety Standards (EICR)", "Smoke and Carbon Monoxide Alarm Regulations", "NSW Residential Tenancies Act 2010", "VIC Residential Tenancies Regulations 2021"],
    recommendedTechStack: ["Next.js 16", "Supabase Multi-Tenant RLS", "PostgreSQL", "Tailwind CSS", "PDFKit Certificate Engine", "Twilio SMS"],
    featuredCaseStudySlug: "property-compliance-crm",
    keyWorkflows: [
      "Agency Self-Service Portal for 24/7 Certificate Downloads",
      "Field Inspector Mobile Web App with Mandatory Photo Verification",
      "Automated PDF Certificate & Invoice Generation within 60s of Sign-off",
      "Two-way SMS Tenant Booking & Reschedule Engine"
    ],
    faqs: [
      {
        q: "Why build a bespoke property CRM instead of using off-the-shelf software like Reapit or PropertyMe?",
        a: "Off-the-shelf property software is built for general tenancy records, not specialized field contractor dispatch, automated compliance tracking, or custom multi-agency certificate portals. Bespoke software eliminates monthly per-user licensing and molds 100% to your workflow."
      },
      {
        q: "Can real estate agency property managers download certificates without calling our office?",
        a: "Yes. Our client portals give every property manager an authenticated dashboard to view all their properties, filter compliance statuses, and download signed certificates and invoices with one click."
      }
    ],
    stats: [
      { metric: "4,000+", label: "Rental Properties Managed", detail: "Single platform running compliance for 30+ real estate agencies." },
      { metric: "4x", label: "Faster Turnaround", detail: "From job booking to issued certificate in under 48 hours." },
      { metric: "Zero", label: "Admin Inquiries", detail: "Agencies self-service certificates directly via portal." }
    ]
  },
  {
    slug: "logistics",
    name: "Logistics, Freight & Fleet Dispatch",
    iconName: "Truck",
    badge: "Logistics & Transport Systems",
    heroTagline: "Custom Fleet Dispatch, Driver Mobile Apps & Real-Time Tracking Platforms",
    overview: "Modern freight, courier, and mobile recovery networks require millisecond-level dispatch coordination between dispatchers, drivers on the road, and enterprise clients expecting live tracking.",
    corePainPoints: [
      { title: "WhatsApp & Radio Chaos", desc: "Dispatchers assigning jobs over unrecorded WhatsApp chats, leading to lost billing logs and disputed invoice claims." },
      { title: "No Live Driver Location Proof", desc: "Customers calling repeatedly asking where their delivery or recovery driver is." },
      { title: "Delayed Proof of Delivery (POD)", desc: "Drivers handing in paper PODs days later, delaying customer invoicing and cash flow." },
      { title: "Complex Subcontractor Billing", desc: "Hours spent calculating mileage rates, waiting time, and contractor payout splits at the end of the week." }
    ],
    statutoryCompliance: ["DVSA Driver Hours Rules (UK)", "Heavy Vehicle National Law (Australia)", "ADR Dangerous Goods Regulations", "GDPR Driver Location Logging"],
    recommendedTechStack: ["Next.js 16 App Router", "Supabase Realtime WebSockets", "Google Maps Matrix API", "Stripe Connect", "PWA Driver Offline Mode"],
    featuredCaseStudySlug: "logistics-platform",
    keyWorkflows: [
      "Dispatcher Interactive Kanban & Map Dispatch Board",
      "Driver Mobile App with Instant Digital POD & Signature Capture",
      "Client Live Tracking Link with Real-Time ETA",
      "Automated Mileage & Rate Calculation with Instant Invoicing"
    ],
    faqs: [
      {
        q: "How does the mobile app work for drivers with poor cellular signal?",
        a: "We engineer offline-first Progressive Web Apps (PWAs) that cache job instructions locally, capture photos and signatures offline, and automatically sync back to headquarters the moment connection is restored."
      },
      {
        q: "Can we integrate existing GPS hardware or telematics?",
        a: "Yes. We build custom API webhooks that ingest GPS coordinates from hardware units (e.g. Samsara, Geotab, Verizon Connect) directly into your centralized dispatch map."
      }
    ],
    stats: [
      { metric: "40%", label: "Faster Response Time", detail: "Automated nearest-driver assignment cuts dispatch delay." },
      { metric: "100%", label: "Digital POD Capture", detail: "Mandatory photo proof and signature before job closure." },
      { metric: "Same-Day", label: "Billing Cycle", detail: "Invoices generated immediately upon delivery sign-off." }
    ]
  },
  {
    slug: "travel",
    name: "Travel Agencies & Airline Ticketing",
    iconName: "Plane",
    badge: "Travel & Hospitality Tech",
    heroTagline: "Bespoke Multi-Channel Ticketing CRMs & Itinerary Platforms for High-Volume Travel Agencies",
    overview: "High-volume travel agencies deal with fragmented customer conversations across WhatsApp, Facebook, phone calls, and walk-ins. We build custom multi-agent ticketing CRMs with integrated GDS passenger data and automated payment links.",
    corePainPoints: [
      { title: "Lead Inquiries Slipping Away", desc: "Travelers inquiring on WhatsApp or Facebook being forgotten because agents manage chats on personal phones." },
      { title: "Manual Itinerary Formatting", desc: "Agents spending 45 minutes manually copying flight segments from Amadeus/Sabre into Word documents." },
      { title: "Payment Collection Friction", desc: "Unsecure credit card handling over phone calls leading to chargeback risks and booking delays." },
      { title: "Zero Rep Commission Visibility", desc: "Managers unable to track which travel consultants generated which ticket margins without manual spreadsheets." }
    ],
    statutoryCompliance: ["IATA Passenger Data Standards", "PCI-DSS Level 1 Payment Processing", "ATOL Compliance (UK)", "AFTA / ATAS Accreditation (AU)"],
    recommendedTechStack: ["Next.js App Router", "Supabase PostgreSQL", "Stripe Checkout & Payment Links", "Brevo Omnichannel API", "PDF Itinerary Builder"],
    featuredCaseStudySlug: "airline-ticketing-crm",
    keyWorkflows: [
      "Unified Inbox capturing WhatsApp, FB Messenger, Email, and Phone Inquiries",
      "One-Click PNR / Itinerary Parser with Branded PDF Generation",
      "Instant SMS & WhatsApp Secure Payment Links",
      "Consultant Commission & Margin Tracking Dashboard"
    ],
    faqs: [
      {
        q: "Can this CRM ingest PNR strings from Amadeus, Sabre, or Travelport?",
        a: "Yes. We build custom text parsers that let agents paste raw GDS PNR text to automatically populate flights, passenger names, fare rules, and baggage allowances into a beautiful branded itinerary."
      },
      {
        q: "How does the multi-channel WhatsApp integration work?",
        a: "We connect the official WhatsApp Business API into your team CRM so all customer conversations are visible to managers, assigned to specific agents, and logged with full chat history."
      }
    ],
    stats: [
      { metric: "10,000+", label: "Bookings Processed", detail: "High-volume multi-agent travel operations running seamlessly." },
      { metric: "3x", label: "Faster Quote Generation", detail: "Automated itinerary builders replace manual document formatting." },
      { metric: "100%", label: "Lead Traceability", detail: "Every WhatsApp message, email, and phone call logged to a lead record." }
    ]
  },
  {
    slug: "recruitment",
    name: "Recruitment, Staffing & Executive Search",
    iconName: "Users",
    badge: "Recruitment & Staffing Tech",
    heroTagline: "Bespoke ATS, Candidate CRM & Automated Outreach Portals for Staffing Agencies",
    overview: "Bespoke applicant tracking systems, candidate scorecard rubrics, and automated multi-stage email drip campaigns engineered for specialized headhunting and high-volume staffing firms.",
    corePainPoints: [
      { title: "Exorbitant Bullhorn / Vincere SaaS Costs", desc: "Paying £120–£200 per recruiter per month for bloated features your consultants never use." },
      { title: "Resume Parsing & Duplicate Headaches", desc: "Candidates applying multiple times without clean deduplication or unified communication history." },
      { title: "Unstandardized Interview Rubrics", desc: "Consultants evaluating candidates subjectively without clear skill scorecards." },
      { title: "Slow Client Shortlist Sharing", desc: "Emailing attachments back and forth instead of sending an interactive, branded client candidate portal." }
    ],
    statutoryCompliance: ["GDPR Candidate Consent & Right to Erasure", "Right to Work Checks (UK Home Office / AU VEVO)", "Conduct of Employment Agencies Regulations 2003"],
    recommendedTechStack: ["Next.js 16", "Supabase Database & Storage", "Tailwind CSS", "Brevo Drip Automation", "Resume Parser Worker"],
    featuredCaseStudySlug: "recruiting",
    keyWorkflows: [
      "Structured Candidate Pipeline (Applied → Screened → Interviewed → Placed)",
      "Interactive Client Shortlist Review Portal with One-Click Feedback",
      "Automated Candidate Outreach & Follow-up Drip Sequences",
      "Standardized Hiring Scorecards & Technical Rubrics"
    ],
    faqs: [
      {
        q: "Can clients review candidate shortlists online without viewing raw contact details?",
        a: "Yes. We build blinded client review portals where hiring managers can view candidate skills, experience highlights, and interview scorecards, and request an interview with one click."
      }
    ],
    stats: [
      { metric: "60%", label: "Time-to-Hire Reduction", detail: "Automated candidate screening and interactive client portals." },
      { metric: "£0", label: "Per-Seat Monthly Fees", detail: "Scale your recruiting team without recurring software license penalties." },
      { metric: "100%", label: "GDPR Compliant", detail: "Automated data retention and one-click candidate data purge." }
    ]
  },
  {
    slug: "home-services",
    name: "On-Demand Home Services & Trades",
    iconName: "Wrench",
    badge: "Field & Home Services Tech",
    heroTagline: "Three-Sided Marketplace & Dispatch Software for Cleaning, Trades & Maintenance Operators",
    overview: "On-demand domestic cleaning, plumbing, HVAC, and trade networks require customer self-booking with upfront payment, mobile contractor dispatch with photo verification, and master operations oversight.",
    corePainPoints: [
      { title: "Missed Appointments & No-Shows", desc: "Customers not being home or cleaners forgetting slots due to lack of automated SMS reminders." },
      { title: "Disputed Quality & Damage Claims", desc: "Customers disputing job completion without verifiable time-stamped before/after photos." },
      { title: "Cash Collection & Split Payouts", desc: "Chasing unpaid invoices and manually calculating contractor hourly pay every Friday." },
      { title: "No Dynamic Pricing by Postcode", desc: "Inability to apply surge rates or travel surcharges based on customer location." }
    ],
    statutoryCompliance: ["Consumer Rights Act 2015", "Public Liability Insurance Verification", "Australian Consumer Law", "HMRC CIS & Worker Status Rules"],
    recommendedTechStack: ["Next.js 16 App Router", "Stripe Connect Split Payouts", "Supabase Storage Photo Proof", "Twilio SMS", "Leaflet / Google Maps"],
    featuredCaseStudySlug: "cleaning-marketplace",
    keyWorkflows: [
      "Instant Customer Booking & Card Pre-Authorization Flow",
      "Worker Mobile Web App with GPS Check-in & Photo Proof Upload",
      "Automated Stripe Split Payout upon Customer Sign-off",
      "Live Dispatch Operations Board with Postcode Filtering"
    ],
    faqs: [
      {
        q: "How does payment security work for on-demand home jobs?",
        a: "The customer's card is authorized when they book online. Funds are captured and held in escrow, and contractor payouts are released automatically upon photo-verified job completion."
      }
    ],
    stats: [
      { metric: "3-in-1", label: "Unified Ecosystem", detail: "Customer booking, cleaner app, and admin desk in one repository." },
      { metric: "92%", label: "Zero Dispute Rate", detail: "Mandatory before/after photo uploads eliminate refund claims." },
      { metric: "100%", label: "Automated Payouts", detail: "Direct Stripe bank transfers eliminate manual contractor payroll." }
    ]
  },
  {
    slug: "community",
    name: "Matchmaking, Membership & Community Platforms",
    iconName: "Heart",
    badge: "Community & SaaS Platforms",
    heroTagline: "Premium Matchmaking, Verified Membership & Community SaaS Platforms",
    overview: "High-trust membership platforms, private community clubs, and matrimony portals demand rigorous multi-tier identity verification, private messaging, and recurring subscription monetization.",
    corePainPoints: [
      { title: "Fake Profiles & Trust Deficit", desc: "Open platforms overrun by fake accounts, spam bots, and unverified users destroying community trust." },
      { title: "Privacy & Data Leak Concerns", desc: "Members refusing to upload ID documents or contact details without end-to-end security guarantees." },
      { title: "Manual Verification Overhead", desc: "Admins spending 30 minutes manually inspecting passport scans and background checks per user." },
      { title: "Subscription Churn & Payment Failures", desc: "Inability to offer tiered memberships, add-on boosts, or automated renewal grace periods." }
    ],
    statutoryCompliance: ["GDPR Article 9 (Special Category Data)", "Australian Privacy Act 1988 (APPs)", "KYC / AML Identity Guidelines", "Online Safety Act"],
    recommendedTechStack: ["Next.js 16", "Supabase Auth & Storage", "Stripe Billing Subscriptions", "Tailwind CSS", "Encrypted Document Vault"],
    featuredCaseStudySlug: "matrimony-saas-platform",
    keyWorkflows: [
      "5-Tier Verification Workflow (Photo ID, Address Proof, Police Clearance)",
      "Smart Compatibility & Filter Matching Engine",
      "Encrypted Member-to-Member Messaging with Privacy Controls",
      "Tiered Stripe Subscriptions with Boosts and Add-ons"
    ],
    faqs: [
      {
        q: "How do you protect member privacy and ID documents?",
        a: "All government ID documents are stored in private encrypted Supabase storage buckets with time-limited signed URLs accessible only to authorized compliance administrators."
      }
    ],
    stats: [
      { metric: "5-Tier", label: "Verification System", detail: "Photo ID, phone, address, and police check verification." },
      { metric: "100%", label: "Verified Member Pool", detail: "Zero spam accounts or unverified profiles on the platform." },
      { metric: "Recurring", label: "Stripe Subscriptions", detail: "Automated monthly, quarterly, and annual billing tiers." }
    ]
  },
  {
    slug: "education",
    name: "EdTech, Training Academies & Certification",
    iconName: "GraduationCap",
    badge: "EdTech & Learning Portals",
    heroTagline: "Custom Learning Portals, Course Management & Automated Certification Systems",
    overview: "Vocational institutes, corporate training academies, and course creators need custom learning management systems with automated progress tracking, quizzes, and instant verifiable certificates.",
    corePainPoints: [
      { title: "High Moodle / Canvas Complexity", desc: "Legacy LMS packages requiring clunky navigation, outdated user interfaces, and expensive hosting." },
      { title: "Certificate Fraud & Verification", desc: "Inability for employers or students to verify digital certificate authenticity via a secure URL or QR code." },
      { title: "Disjointed Student Billing", desc: "Selling courses on one platform while hosting video content on another, causing student login confusion." },
      { title: "Lack of Custom Assessment Logic", desc: "Inability to build interactive case-study evaluations, coding sandboxes, or multi-step rubrics." }
    ],
    statutoryCompliance: ["CPD Standards Office Requirements", "SCORM / xAPI Export Standards", "FERPA & GDPR Student Privacy", "Ofqual / ASQA Guidelines"],
    recommendedTechStack: ["Next.js 16", "Supabase PostgreSQL", "Tailwind CSS", "PDF Certificate Generator", "Stripe Checkout"],
    featuredCaseStudySlug: "education",
    keyWorkflows: [
      "Modern Video & Lesson Delivery Player with Progress Resumption",
      "Interactive Quiz Engine with Timed Submissions",
      "Instant PDF Certificate Generator with Unique Verification Hash",
      "Corporate Team Management & Bulk License Purchasing Portal"
    ],
    faqs: [
      {
        q: "Can certificates be verified by third-party employers?",
        a: "Yes. Every issued certificate includes a unique verification URL and QR code that allows anyone to confirm the student's name, completion date, and credential status."
      }
    ],
    stats: [
      { metric: "1-Click", label: "Credential Verification", detail: "Instant public verification of student certificates." },
      { metric: "100%", label: "White-Label Brand", detail: "Zero third-party LMS branding or external redirects." },
      { metric: "Custom", label: "Assessment Logic", detail: "Tailored to your specific curriculum and testing standards." }
    ]
  }
];
