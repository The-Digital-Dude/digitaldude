import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Connecting to Supabase at:", supabaseUrl);

  // 1. Ensure blog-images storage bucket exists and is public
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === "blog-images");
    if (!exists) {
      console.log("Creating 'blog-images' public storage bucket...");
      const { data: cbData, error: cbErr } = await supabase.storage.createBucket("blog-images", {
        public: true,
        fileSizeLimit: 10485760,
      });
      if (cbErr) console.warn("Bucket creation notice:", cbErr.message);
      else console.log("Created 'blog-images' bucket successfully!");
    } else {
      console.log("Storage bucket 'blog-images' is ready.");
    }
  } catch (err) {
    console.warn("Storage check:", err.message);
  }

  // 2. Seed/Update Blog Posts
  const seedPosts = [
    {
      slug: "why-growing-service-businesses-outgrow-spreadsheets",
      title: "Why Growing Service Businesses Outgrow Spreadsheets & Off-the-Shelf CRMs",
      excerpt:
        "Spreadsheets work when you start. But as your team and client volume scale, jobs slip and data scatters across WhatsApp and email. Here is why bespoke systems win.",
      content: `## The Inevitable Spreadsheet Ceiling

When a service business launches, spreadsheets and messaging apps are the ultimate tool: free, flexible, and instant. You track jobs in Google Sheets, dispatch updates over WhatsApp, and handle customer billing manually.

### Where the Patchwork Breaks Down

1. **No Single Source of Truth:** When five team members edit the same spreadsheet, versions conflict and customer status updates get lost.
2. **Scattered Communications:** Critical job notes get trapped inside individual WhatsApp chats rather than linked to the client record.
3. **Zero Visibility for Management:** Leadership cannot see live conversion rates, overdue jobs, or technician performance without hours of manual report compilation.

### The Problem With Generic CRMs (HubSpot, Salesforce)

Off-the-shelf CRMs are built for standard software sales pipelines (Lead → Demo → Closed). If your business manages field technicians, property compliance checks, or multi-portal scheduling, you end up paying thousands per month for features you do not use while building workarounds for the ones you need.

### The Custom System Advantage

A custom CRM is mapped directly to how your team operates from day one:
- **Role-based portals** for managers, field staff, and customers.
- **Automated job status transitions** with zero manual data entry.
- **Direct integration with payment and notification systems.**

---
*Ready to replace the spreadsheet patchwork with a system built around your team? [Book a 30-minute discovery call with our founder](/contact).*`,
      category: "CRM Development",
      reading_time_minutes: 4,
      meta_title: "Why Service Businesses Outgrow Spreadsheets | The Digital Dude",
      meta_description:
        "Discover why spreadsheets and generic CRMs hold growing service businesses back, and how custom systems solve operational bottlenecks.",
      cover_image: "/blog/crm-outgrow-spreadsheets.jpg",
      status: "published",
      author: "The Digital Dude Team",
    },
    {
      slug: "off-the-shelf-crm-vs-custom-crm",
      title: "Making the CRM Switch: Off-the-Shelf CRM vs Custom CRM Architecture",
      excerpt:
        "Thinking of making a CRM switch? Compare pre-built off-the-shelf software with a custom CRM. Discover total cost of ownership, role-based access, and true business workflow alignment.",
      content: `## The Modern Dilemma: Off-the-Shelf SaaS vs Building a Custom CRM

Every growing enterprise eventually faces the same operational crossroads: your sales pipeline is expanding, customer service inquiries are surging, and your team is wrestling with fragmented tools. At this inflection point, leaders frequently ask whether it is time to make a decisive **crm switch** from generic tools to an engine tailored to their operations.

Packaged CRM applications like Salesforce, HubSpot, and Zoho promise instant setup with drag and drop pipelines and pre built templates. But for specialized service companies, logistics operators, and multi-branch agencies, these off-the-shelf platforms quickly morph into expensive compromises filled with per-seat licensing penalties and rigid menus.

In this architectural guide, we evaluate when a **crm switch** is commercially justified, how a bespoke **custom crm** delivers 10x ROI, and what technical steps are required to execute a seamless migration.

---

## The Tipping Point: Why Service Companies Make the CRM Switch

When your business was small, standard lead stages (Prospect → Demo → Closed) were sufficient. However, as operational complexity scales, packaged tools exhibit predictable failure modes:

### 1. The Per-Seat Tax on Headcount Expansion
Pre built software charges between $120 and $300+ per user per month. As your team grows from 15 to 60 employees, field technicians, and subcontractors, your annual licensing bill escalates from $20,000 to over $150,000 per year. You find yourself restricting user licenses to save budget, which forces operators back onto rogue spreadsheets and unmonitored WhatsApp groups.

### 2. Generic Pipelines vs Unique Business Processes
Off-the-shelf software is architected for generic software sales funnels. If your unique processes involve field inspections, dispatching mobile vans, verifying compliance certificates, or managing multi-stage job approvals, generic CRM apps force you to purchase expensive third-party plugins or write brittle Zapier connectors that frequently fail silently.

### 3. Disconnected Customer Interactions & Data Entry Overhead
When customer interactions span WhatsApp, phone calls, portal messages, and site photos, generic systems require sales reps and support staff to perform tedious manual data entry. Operators spend 35% of their working day simply feeding the CRM instead of driving customer satisfaction and revenue.

---

## Architectural Comparison: Pre Built SaaS vs Bespoke Custom CRM

| Architectural Dimension | Off-the-Shelf CRM (Salesforce / HubSpot) | Bespoke Custom CRM Engine |
| :--- | :--- | :--- |
| **Licensing Cost** | $150 – $300 / user / mo recurring forever | **$0 / seat** (Fixed milestone build; owned IP) |
| **Workflow Fit** | 60–70% fit (forces process workarounds) | **100% custom-mapped** to your unique business goals |
| **Role-Based Access** | Basic permissions; extra tiers cost more | Granular **role based access control (RBAC)** across all portals |
| **Field Tech & Contractor Logins** | Costly Community / Partner seat licenses | Unlimited free contractor and technician web logins |
| **Data & Schema Ownership** | Vendor lock-in; proprietary SOQL/APIs | 100% dedicated PostgreSQL database on your cloud |
| **Speed & Usability** | Heavy 3–5MB enterprise page loads | Sub-second Next.js UI tailored for rapid execution |

---

## Summary & Next Steps

If your current CRM software is holding your team back with punitive per-seat licensing, clunky workarounds, or disconnected data silos, it is time to evaluate a custom solution.

[Book a 30-minute discovery consultation with our solutions architects](/contact) to map your workflow requirements, calculate your exact TCO savings, and outline a fixed-scope delivery plan.`,
      category: "CRM Development",
      reading_time_minutes: 8,
      meta_title: "Making the CRM Switch: Off-the-Shelf vs Custom CRM | The Digital Dude",
      meta_description:
        "Thinking of making a CRM switch? Compare pre-built off-the-shelf software with a custom CRM. Discover cost savings, role-based access, and true business workflow fit.",
      cover_image: "/blog/crm-switch-guide.jpg",
      status: "published",
      author: "The Digital Dude Team",
    },
    {
      slug: "how-to-build-a-three-sided-marketplace-app",
      title: "How to Build a 3 Sided Marketplace App: Architecture, Payments & Real-Time Dispatch",
      excerpt:
        "A complete architectural guide to building a scalable 3 sided marketplace app connecting buyers and sellers, service providers, and central operations dispatch.",
      content: `## The Architecture of a 3 Sided Marketplace App

In the on-demand economy, standard two-sided platforms (connecting simple buyers and sellers) are no longer enough for complex local services. Modern on-demand businesses—from domestic cleaning networks and breakdown recovery to medical staffing and freight dispatch—require a synchronized **3 sided marketplace app** architecture.

A true 3 sided marketplace coordinates three distinct, real-time user experiences:
1. **The Customer / Client**: Booking services, managing upfront payment holds, and tracking fulfillment.
2. **The Service Provider / Contractor**: Receiving proximity-based job alerts, submitting photo verification, and managing payouts.
3. **The Central Operations Dispatcher**: Monitoring active SLAs, resolving customer disputes, and adjusting platform take rates.

In this deep architectural breakdown, we outline the exact system design, database schemas, and payment infrastructure needed to engineer a high-concurrency **3 sided marketplace** that scales profitably.

---

## Financial Engineering: Escrow, Split Payments & Invoicing

Managing financial transactions between buyers and sellers in a **3 sided marketplace** requires strict regulatory compliance and fraud prevention:

1. **Pre-Authorization at Booking**: Avoid doing unpaid work by authorizing card funds upfront.
2. **Escrow Retention During Execution**: Hold funds in your platform escrow account until both parties satisfy verification milestones.
3. **Automated Split Payouts via Stripe Connect**: Automatically disburse funds to provider bank accounts while deducting your net commission take rate.
4. **Instant Self-Service Invoicing**: Generate compliant VAT/GST PDF invoices for both the customer and provider within seconds of job completion.

---
*Planning an on-demand marketplace or app? [Talk to our team about architecture and delivery timelines](/contact).*`,
      category: "Marketplace Development",
      reading_time_minutes: 7,
      meta_title: "How to Build a 3 Sided Marketplace App | The Digital Dude",
      meta_description:
        "A complete architectural guide to building a scalable 3 sided marketplace app connecting buyers and sellers, service providers, and central operations dispatch.",
      cover_image: "/blog/marketplace-architecture.jpg",
      status: "published",
      author: "The Digital Dude Team",
    },
    {
      slug: "ai-features-real-vs-pitch-line",
      title: "AI Features in Production Software: Real Operational ROI vs Pitch Deck Lines",
      excerpt:
        "Cut through the marketing hype: an architectural analysis of high-impact AI features in production software versus inflated pitch deck claims.",
      content: `## Separating Practical Engineering from Marketing Rhetoric

In recent years, artificial intelligence has dominated technology venture decks and product roadmaps. Almost every SaaS vendor claims to have revolutionized their platform with proprietary machine intelligence. Yet, when enterprise clients look under the hood, many of these touted capabilities amount to little more than a fragile wrapper around a generic chatbot API.

For serious operational businesses, evaluating genuine **ai features** requires looking past promotional pitch deck bullet points and measuring tangible operational velocity, error reduction, and unit economics.

### High-Impact Automated Capabilities in Production:
1. **Automated Unstructured Document Ingestion**: Parsing complex PDFs, invoices, and certificates against deterministic schemas.
2. **Intelligent Lead Triage**: Natural language extraction categorizing urgency and routing high-value prospects in < 60 seconds.
3. **Real-Time Telephony Summaries**: Whisper-powered incident notes that auto-populate job tickets without manual entry.

---
[Discuss your system requirements with our engineering studio](/contact) to evaluate high-ROI automation opportunities for your business.`,
      category: "AI Engineering",
      reading_time_minutes: 7,
      meta_title: "AI Features in Production: Real ROI vs Pitch Lines | The Digital Dude",
      meta_description:
        "Cut through the marketing hype: an architectural analysis of practical AI features in production software versus inflated pitch deck promises.",
      cover_image: "/blog/ai-features-guide.jpg",
      status: "published",
      author: "The Digital Dude Team",
    },
  ];

  for (const post of seedPosts) {
    console.log(`Upserting post: "${post.slug}"...`);
    const { data, error } = await supabase
      .from("posts")
      .upsert(post, { onConflict: "slug" })
      .select();

    if (error) {
      console.error(`Error upserting post ${post.slug}:`, error.message);
    } else {
      console.log(`Successfully upserted post: ${post.title}`);
    }
  }

  // 3. Seed All 7 Production Case Studies
  const seedCaseStudies = [
    {
      slug: "property-compliance-crm",
      industry: "Property",
      tag: "Property · Australia",
      title: "Property compliance CRM",
      summary: "Five role-based portals managing 4,000+ rentals across 30+ agencies, 4x faster than before",
      status: "Live",
      image: "/images/case-studies/property-compliance.svg",
      image_alt: "Property compliance CRM dashboard showing 4,000+ rentals managed across 30+ agencies",
      headline: "A compliance CRM now running 4,000+ rentals across 30+ agencies",
      page_summary: "One platform connecting agencies, property managers, technicians and the internal team, replacing spreadsheets and email threads.",
      stats: ["30+ agencies", "4,000+ rentals managed", "4x faster than the previous system", "5 role-based portals"],
      challenge: "The business was coordinating agencies, property managers, technicians and its own team across separate tools. Jobs slipped between scheduled, overdue and completed with no single view. Quotes, invoices and technician payments lived in spreadsheets and email, and management could not see performance across regions.",
      what_we_built: [
        "Five separate portals for admin, team members, agencies, property managers and technicians, each showing only what that person needs",
        "Full job tracking from creation to payment, with dedicated views for scheduled, overdue and completed work",
        "Quotes, invoices and technician payments linked directly to each job",
        "Lead management to bring in and convert new agencies and property managers",
        "A regional dashboard and reports for management, plus a public marketing website"
      ],
      what_changed: "Operations now run through one system instead of spreadsheets and email. The platform manages 4,000+ rentals for 30+ agencies and runs about 4x faster than the system it replaced. Overdue jobs are visible the moment they slip.",
      what_changed_label: "What changed",
      built_with: "React, TypeScript, Node.js, relational database, cloud hosting",
      related: ["airline-ticketing-crm", "logistics-platform"]
    },
    {
      slug: "airline-ticketing-crm",
      industry: "Travel",
      tag: "Travel · Australia",
      title: "Airline ticketing CRM",
      summary: "Every lead from WhatsApp, Facebook, phone and walk-ins in one place, with a live KPI dashboard",
      status: "Live",
      image: "/images/case-studies/air-travel-crm.svg",
      image_alt: "Airline ticketing CRM dashboard unifying WhatsApp, Facebook, phone and walk-in leads",
      headline: "One CRM for every lead, from every channel",
      page_summary: "A lead and customer management system for an airline ticketing agency, bringing WhatsApp, Facebook, phone and walk-in enquiries into one place.",
      stats: ["4 lead channels in one system", "7 live KPIs", "Conversion tracking per agent", "In daily use"],
      challenge: "Enquiries arrived through WhatsApp, Facebook, phone calls and walk-ins, with nowhere to manage them together. It was hard to tell who owned each lead, there was no live view of conversions or lost sales, and management could not see how each agent was performing.",
      what_we_built: [
        "Lead capture for WhatsApp, Facebook and manual entry, organised without duplicates",
        "A booking pipeline matched to how agents sell: in progress, itinerary sent, payment made",
        "A dashboard showing total leads, follow-ups, conversions, lost sales and progress against the monthly target, for any date range",
        "My leads and my follow-ups views so every agent knows what to do next",
        "Agent performance showing leads collected, conversions and conversion rate, plus customer history and quick search"
      ],
      what_changed: "The agency has one source of truth for every lead instead of scattered chats and spreadsheets. Management sees performance against target in real time, and every agent owns their own pipeline.",
      what_changed_label: "What changed",
      built_with: "React, TypeScript, Vite, REST APIs",
      related: ["property-compliance-crm", "recruitment-crm"]
    },
    {
      slug: "matrimony-saas-platform",
      industry: "Community",
      tag: "Community · Australia",
      title: "Premium matrimony SaaS",
      summary: "AI matchmaking, 5-tier identity and police check verification, and subscription billing",
      status: "Live",
      image: "/images/case-studies/matrimony-saas.svg",
      image_alt: "Matrimony SaaS platform dashboard showing AI matchmaking and 5-tier verification",
      headline: "A matchmaking platform built on trust",
      page_summary: "A premium subscription platform for a community matchmaking service, combining AI matching with strict identity verification.",
      stats: ["AI matchmaking engine", "5-tier verification", "Subscription billing", "Live in production"],
      challenge: "In matchmaking, trust is the product. The client needed members to feel safe that every profile was real, while still making it easy to find a good match and to charge for premium access.",
      what_we_built: [
        "An AI matchmaking engine that suggests compatible members",
        "Five levels of verification, up to identity and police checks",
        "Subscription plans with recurring billing via Stripe",
        "Private messaging between members with photo privacy controls",
        "Community rooms for group conversation"
      ],
      what_changed: "The community runs on one platform that verifies members, suggests matches and handles payments, giving members confidence in who they are talking to.",
      what_changed_label: "What changed",
      built_with: "Next.js 16, TypeScript, Supabase PostgreSQL, Stripe Billing",
      related: ["ai-tutoring-platform", "recruitment-crm"]
    },
    {
      slug: "cleaning-marketplace",
      industry: "Home services",
      tag: "Home services",
      title: "Cleaning marketplace",
      summary: "Customer app, cleaner app and admin CRM with upfront payment and photo proof",
      status: "Delivered",
      image: "/images/case-studies/cleaning-marketplace.svg",
      image_alt: "Cleaning marketplace apps showing customer booking, cleaner job flow and admin CRM",
      headline: "A three-app platform that runs a cleaning business end to end",
      page_summary: "A customer booking app, a cleaner mobile app and an admin CRM, connected by one system with upfront payment and photo proof on every job.",
      stats: ["3 connected apps", "Payment before every job", "Before and after photos", "4 user roles"],
      challenge: "Bookings came in by phone and message, payments were chased after the job, and there was no proof of work when a customer complained. More cleaners meant more admin, and commission was tracked by hand.",
      what_we_built: [
        "Customer app to choose a service, see the price, pay upfront and track the job",
        "Cleaner app to accept jobs, check in, upload before and after photos and mark jobs complete",
        "Admin CRM to approve cleaners, assign jobs, and track revenue, commission and payouts",
        "Automatic notifications at booking, assignment and completion, with invoice and photos sent to the customer",
        "A full history for every job, plus reports on revenue, job volume and cleaner performance"
      ],
      what_changed: "Payment is collected before work starts, every job has photo evidence, and new cleaners and areas can be added without adding admin staff.",
      what_changed_label: "What it makes possible",
      built_with: "Mobile apps, REST API, Stripe payments, cloud image storage",
      related: ["logistics-platform", "recruitment-crm"]
    },
    {
      slug: "logistics-platform",
      industry: "Logistics",
      tag: "Logistics",
      title: "Logistics coordination platform",
      summary: "Mobile-first breakdown management for drivers and dispatch, 40% faster response coordination",
      status: "Live",
      image: "/images/case-studies/truck-breakdown.svg",
      image_alt: "Logistics coordination platform showing live breakdown incidents and driver status",
      headline: "Breakdowns handled in minutes, not phone calls",
      page_summary: "A mobile-first platform that connects drivers and dispatch the moment something goes wrong on the road.",
      stats: ["40% faster response coordination", "Mobile-first PWA", "Driver and admin apps", "Live in production"],
      challenge: "When a truck broke down, coordination happened over phone calls and messages. Dispatch lost time finding out where the driver was, what had happened and who could help.",
      what_we_built: [
        "A mobile app for drivers to report a breakdown with the details dispatch needs",
        "An admin view showing every active incident and its status",
        "Coordination tools so admins can assign help and keep drivers updated"
      ],
      what_changed: "Response coordination improved by 40%, and the team has one place to see every incident instead of chasing calls.",
      what_changed_label: "What changed",
      built_with: "Next.js 16, TypeScript, Tailwind CSS, Google Maps Geocoding",
      related: ["property-compliance-crm", "cleaning-marketplace"]
    },
    {
      slug: "recruitment-crm",
      industry: "Recruitment",
      tag: "Recruitment · Staffing",
      title: "Recruitment CRM",
      summary: "Real-time candidate portal, document tracking and automated status updates",
      status: "Delivered",
      image: "/images/case-studies/recruitment-crm.svg",
      image_alt: "Recruitment CRM dashboard showing candidate pipeline and document tracking",
      headline: "Every candidate, document and status update in one place",
      page_summary: "A recruitment system with a real-time candidate portal, covering everything from application to post-placement tracking.",
      stats: ["Real-time candidate portal", "Document tracking", "Automated status messages", "Role-based access"],
      challenge: "Recruiters were juggling candidate documents, status updates and communication across email, spreadsheets and WhatsApp. Candidates kept asking for updates, and tracking people after placement was almost impossible.",
      what_we_built: [
        "A candidate website to apply, upload documents and see application status in real time",
        "A CRM for admins and agents with role-based access, candidate filtering and interview approval",
        "Document checks for visas, clearances and agreements",
        "Automatic status updates by WhatsApp and email, plus an AI assistant for common candidate questions",
        "Post-placement tracking of start dates, salary, leave and employment status"
      ],
      what_changed: "Candidates see where they stand without calling, agents spend less time on updates, and the business can track every placement long after the start date.",
      what_changed_label: "What it makes possible",
      built_with: "Next.js, Node.js, Supabase PostgreSQL, Twilio, OpenAI GPT API",
      related: ["airline-ticketing-crm", "cleaning-marketplace"]
    },
    {
      slug: "ai-tutoring-platform",
      industry: "Education",
      tag: "Education",
      title: "AI tutoring platform",
      summary: "AI-generated quizzes, automatic grading and a parent and student portal",
      status: "Delivered",
      image: "/images/case-studies/ai-education.svg",
      image_alt: "AI tutoring platform dashboard showing quiz generation and student progress",
      headline: "A tutoring platform where quizzes, marking and reports run themselves",
      page_summary: "A student and parent portal with AI-generated quizzes, automatic grading and personalised feedback, plus an admin system for the tutoring centre.",
      stats: ["AI quiz generation", "Instant grading", "Parent and student portal", "Subscription billing"],
      challenge: "Tutors were spending hours every week writing quizzes, marking them and updating parents. Parents wanted more visibility, and the centre wanted to spot struggling students earlier.",
      what_we_built: [
        "AI-generated quizzes matched to each student subject and level, on a weekly, fortnightly or monthly cycle",
        "Instant grading with feedback on strengths, weak spots and what to practise next",
        "A portal where students and parents see results, reports, attendance and schedules",
        "An admin dashboard for classes, student progress and at-risk alerts",
        "Subscription billing and automatic reminders"
      ],
      what_changed: "Quizzes and progress reports go out without manual work, parents stay informed, and tutors can focus on teaching.",
      what_changed_label: "What it makes possible",
      built_with: "Next.js, Node.js, Supabase PostgreSQL, OpenAI GPT-4o, Stripe",
      related: ["matrimony-saas-platform", "recruitment-crm"]
    }
  ];

  try {
    for (const cs of seedCaseStudies) {
      console.log(`Upserting case study: "${cs.slug}"...`);
      const { data, error } = await supabase
        .from("case_studies")
        .upsert(cs, { onConflict: "slug" })
        .select();

      if (error) {
        console.warn(`Notice upserting case study ${cs.slug}:`, error.message);
      } else {
        console.log(`Successfully upserted case study: ${cs.title}`);
      }
    }
  } catch (err) {
    console.warn("Case study sync notice:", err.message);
  }

  // 4. Seed Demo Proposal
  const demoProposal = {
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
      }
    ],
    status: "sent",
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  };

  try {
    const { error: pErr } = await supabase
      .from("proposals")
      .upsert(demoProposal, { onConflict: "slug" });

    if (pErr) {
      console.warn("Proposals notice (migration 0005 might need running):", pErr.message);
    } else {
      console.log(`Successfully upserted demo proposal: ${demoProposal.slug}`);
    }
  } catch (err) {
    console.warn("Proposal sync notice:", err.message);
  }

  // 5. Seed Demo CRM Bookings if none exist
  const seedBookings = [
    {
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
    },
    {
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
    }
  ];

  try {
    for (const b of seedBookings) {
      const { error: bErr } = await supabase
        .from("bookings")
        .upsert(b, { onConflict: "slot_start" });
      if (!bErr) {
        console.log(`Synced booking for ${b.company_name}`);
      }
    }
  } catch (err) {
    console.warn("Bookings seed notice:", err.message);
  }

  // 6. Fetch all posts, case studies, proposals, and bookings to verify
  const { data: allPosts } = await supabase
    .from("posts")
    .select("id, slug, title, status, cover_image, reading_time_minutes");

  console.log("\nCurrent Database Posts in Supabase:");
  console.table(allPosts);

  const { data: allCaseStudies, error: csErr } = await supabase
    .from("case_studies")
    .select("id, slug, title, status, industry");

  if (csErr) {
    console.warn("Case studies query notice (table might need migration run):", csErr.message);
  } else {
    console.log("\nCurrent Database Case Studies in Supabase:");
    console.table(allCaseStudies);
  }

  const { data: allProposals, error: propErr } = await supabase
    .from("proposals")
    .select("id, slug, client_name, company_name, status, budget_range");

  if (propErr) {
    console.warn("Proposals query notice:", propErr.message);
  } else {
    console.log("\nCurrent Database Proposals in Supabase:");
    console.table(allProposals);
  }

  const { data: allBookingsList, error: bListErr } = await supabase
    .from("bookings")
    .select("id, company_name, name, stage, deal_value, lead_score");

  if (bListErr) {
    console.warn("Bookings query notice:", bListErr.message);
  } else {
    console.log("\nCurrent Database CRM Leads & Deals in Supabase:");
    console.table(allBookingsList);
  }
}

main().catch(console.error);

