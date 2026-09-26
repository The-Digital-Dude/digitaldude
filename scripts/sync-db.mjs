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
      console.error(`Error upserting ${post.slug}:`, error.message);
    } else {
      console.log(`Successfully upserted: ${post.title}`);
    }
  }

  // 3. Fetch all posts to verify
  const { data: allPosts, error: fErr } = await supabase
    .from("posts")
    .select("id, slug, title, status, cover_image, reading_time_minutes");

  if (fErr) {
    console.error("Fetch error:", fErr.message);
  } else {
    console.log("\nCurrent Database Posts in Supabase:");
    console.table(allPosts);
  }
}

main().catch(console.error);
