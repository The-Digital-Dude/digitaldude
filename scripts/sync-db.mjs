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
      slug: "how-to-build-a-three-sided-marketplace-app",
      title: "How to Build a 3-App Marketplace: Customer, Provider & Admin Architecture",
      excerpt:
        "From upfront customer payments to cleaner dispatch and commission payouts: the architecture behind building scalable on-demand service platforms.",
      content: `## The Anatomy of an On-Demand Marketplace

Building a successful marketplace requires synchronizing three distinct user experiences into a unified real-time engine:

### 1. The Customer Experience (Booking & Upfront Payment)
- Transparent pricing and service selection.
- Upfront payment authorization with Stripe to prevent unpaid work.
- Live job tracking and instant invoice generation upon completion.

### 2. The Provider Experience (Mobile Dispatch & Proof of Work)
- Job acceptance with distance and schedule matching.
- In-app check-in and check-out.
- Mandatory photo upload (before and after proof) to eliminate customer dispute claims.

### 3. The Central Admin Portal (Operations & Payouts)
- Automated commission calculation and provider payout tracking.
- Real-time heatmaps of active, scheduled, and delayed jobs.
- Role-based permissions for dispatchers and support staff.

---
*Planning an on-demand marketplace or app? [Talk to our team about architecture and delivery timelines](/contact).*`,
      category: "Marketplace Development",
      reading_time_minutes: 6,
      meta_title: "How to Build a 3-Sided Marketplace App | The Digital Dude",
      meta_description:
        "Learn the core architecture required to build a scalable on-demand marketplace connecting customers, providers, and central operations.",
      cover_image: "/blog/marketplace-architecture.jpg",
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

  // 3. Seed Case Studies
  const seedCaseStudies = [
    {
      slug: "property-compliance-crm",
      industry: "Property",
      tag: "Property · Australia",
      title: "Property compliance CRM",
      summary: "Five role-based portals managing 4,000+ rentals across 30+ agencies, 4x faster than before",
      status: "Live",
      image: "/images/case-studies/property-compliance.svg",
      image_alt: "Property compliance CRM interface managing smoke alarm, gas, and electrical safety inspections across Australian rental properties",
      headline: "From spreadsheet chaos to four times faster turnarounds",
      page_summary: "A bespoke multi-portal CRM connecting real estate agencies, field inspectors, tenants, landlords and ops team — currently managing compliance across 4,000+ Australian rental properties.",
      stats: [
        "4,000+ rental properties under management",
        "30+ real estate agencies active",
        "4x faster job completion turnaround",
        "Zero missed compliance deadlines since launch"
      ],
      challenge: "A growing Australian property compliance company was running inspections, technician dispatch, agency communications and certificate generation through shared spreadsheets, email chains and WhatsApp groups. As they scaled past 1,000 properties, jobs slipped, certificates took days to issue, and operations spent hours every day answering 'what is the status of property X?' from agency property managers.",
      what_we_built: [
        "Agency Portal: Real estate property managers log in, submit new properties, view live compliance statuses, and download safety certificates on demand.",
        "Field Inspector Mobile App: Inspectors view their daily route, complete digital inspection checklists, take mandatory photo proof, and collect digital signatures on-site.",
        "Operations Dashboard: Central dispatcher assigns jobs with location-based grouping, monitors delayed tasks, and reviews inspector submissions in real time.",
        "Automated Certificate & Invoicing Engine: Safety certificates and invoices are generated automatically as soon as an inspection is marked complete.",
        "Tenant & Landlord Notification Engine: Automated SMS and email booking reminders with self-service reschedule links to eliminate missed technician visits."
      ],
      what_changed: "The company expanded from managing 800 properties to over 4,000 across 30+ agencies without increasing their central admin headcount. Job turnaround dropped from 8 days to under 48 hours, and safety certificates are delivered within seconds of job completion.",
      what_changed_label: "What changed",
      built_with: "Next.js 16, TypeScript, Supabase PostgreSQL with RLS, Tailwind CSS, Google Maps Geocoding API, Brevo Transactional Email & SMS",
      related: ["cleaning-marketplace", "logistics-platform"]
    },
    {
      slug: "airline-ticketing-crm",
      industry: "Travel",
      tag: "Travel & Ticketing · Australia",
      title: "Travel agency CRM",
      summary: "A multi-channel CRM for an Australian ticketing agency bringing WhatsApp, Facebook, phone and walk-in leads into one place",
      status: "Live",
      image: "/images/case-studies/airline-ticketing.svg",
      image_alt: "Travel agency ticketing CRM dashboard tracking agent response times, booking conversions, and GDS flight ticket issuance",
      headline: "One dashboard for leads, quotes, bookings, and agent KPIs",
      page_summary: "A centralized ticketing CRM engineered for an Australian travel agency processing high volumes of custom itinerary requests across WhatsApp, Facebook Messenger, phone, and walk-in leads.",
      stats: [
        "100% centralized lead capture from 4 channels",
        "38% increase in lead-to-booking conversion rate",
        "Average quote turnaround reduced from 4 hours to 18 minutes",
        "Complete live visibility over agent sales performance"
      ],
      challenge: "An Australian travel agency had 15 agents handling hundreds of flight quote requests across personal WhatsApp chats, Facebook pages, phone calls, and walk-in consultations. Enquiries frequently fell through the cracks, management had zero visibility into quote status or conversion rates, and duplicate quotes were repeatedly sent to the same client.",
      what_we_built: [
        "Omnichannel Lead Capture: Auto-ingests leads from web forms, WhatsApp Business API, Facebook Messenger webhooks, and phone call logs into a unified queue.",
        "Rapid Itinerary & Quote Builder: Agents generate multi-leg flight comparisons, markup calculations, and client-ready branded PDF quotes in minutes.",
        "Smart Lead Routing: Distributes inbound leads based on agent availability, destination expertise, and historical conversion speed.",
        "GDS & Payment Tracking: Links PNR booking numbers to Stripe payment receipts and automated ticket issuance reminders.",
        "Executive KPI Dashboard: Live leaderboards tracking agent response times, active quotes, win rates, and daily gross revenue."
      ],
      what_changed: "Lead response times dropped from hours to minutes. Unassigned leads are automatically escalated if not contacted within 15 minutes, boosting overall booking conversion by 38%. Management can view real-time company-wide revenue metrics instantly from any device.",
      what_changed_label: "What changed",
      built_with: "Next.js, React, Node.js, PostgreSQL, WhatsApp Business Cloud API, Tailwind CSS, Stripe Payments",
      related: ["property-compliance-crm", "recruitment-crm"]
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

  // 4. Fetch all posts and case studies to verify
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
}

main().catch(console.error);
