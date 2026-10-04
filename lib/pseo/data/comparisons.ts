import { PseoComparison } from "../types";

export const pseoComparisons: PseoComparison[] = [
  {
    slug: "custom-crm-vs-salesforce",
    competitorName: "Salesforce",
    category: "CRM",
    targetNiche: "High-Growth Service & Field Operations Businesses",
    summary: "Salesforce is the enterprise titan of sales CRMs, but for specialized service businesses, it often turns into a money pit of $150–$300/user/month licensing fees, endless consultant retainers, and overly complex menus.",
    pricingModel: "Per-seat monthly subscription (£150–£300/user/mo) + Mandatory Enterprise Support + Third-Party Consultant Fees",
    typicalMonthlyExpense: "£3,000–£12,000 / month (for 20–40 seats) recurring forever",
    competitorDrawbacks: [
      "Punitive per-seat pricing that taxes team growth.",
      "Generic sales pipeline that requires months of Apex development to match service workflows.",
      "Clunky mobile experience for field technicians or external contractors.",
      "Vendor lock-in with zero ownership of the underlying IP or code."
    ],
    bespokeAdvantages: [
      "Zero monthly seat licensing fees: Add 50, 500, or 5,000 users at zero marginal software cost.",
      "100% customized to your actual business operational flow (quotes, dispatch, compliance certificates).",
      "Modern, ultra-fast Next.js interface that employees actually enjoy using.",
      "Complete IP and codebase ownership deployed directly to your own cloud infrastructure."
    ],
    featureMatrix: [
      {
        dimension: "Per-User Monthly Cost",
        bespoke: "£0 / seat (Fixed one-time build, minor cloud hosting)",
        competitorOrOffTheShelf: "£150 – £300+ / user / month (escalates yearly)"
      },
      {
        dimension: "Workflow Alignment",
        bespoke: "100% custom-mapped to your exact industry steps & rules",
        competitorOrOffTheShelf: "Generic CRM requiring heavy customization plugins"
      },
      {
        dimension: "External Client & Contractor Access",
        bespoke: "Unlimited free client portals and contractor logins",
        competitorOrOffTheShelf: "Requires expensive Salesforce Community licenses"
      },
      {
        dimension: "Code & Data Ownership",
        bespoke: "You own 100% of the proprietary code and PostgreSQL database",
        competitorOrOffTheShelf: "100% vendor lock-in; proprietary SOQL/Apex environment"
      },
      {
        dimension: "Speed & Usability",
        bespoke: "Sub-second Next.js / Tailwind UI tailored to key tasks",
        competitorOrOffTheShelf: "Heavy enterprise UI with multi-second page loads"
      }
    ],
    migrationTimeline: "6 to 10 weeks from architectural discovery to production rollout",
    whoShouldSwitch: "Companies with 10+ employees spending over £15,000/year on Salesforce or feeling constrained by its generic objects and consultant dependency.",
    faqs: [
      {
        q: "How do we migrate our existing Salesforce data?",
        a: "We extract your historical Salesforce accounts, contacts, opportunities, and custom objects, deduplicate the records, and cleanly migrate them into your bespoke PostgreSQL database with zero downtime."
      },
      {
        q: "What is the ongoing maintenance cost of a custom CRM?",
        a: "Unlike Salesforce which costs thousands per month in license fees, a modern serverless Next.js + Supabase backend typically costs £50–£200/month in cloud hosting, representing a 90%+ ongoing cost reduction."
      }
    ]
  },
  {
    slug: "custom-crm-vs-hubspot",
    competitorName: "HubSpot",
    category: "CRM",
    targetNiche: "B2B Service Agencies & Operations Teams",
    summary: "HubSpot excels at inbound marketing and simple B2B pipelines, but its tiered pricing steeply punishes growing contact lists, and it lacks the relational flexibility needed for complex field operations or custom client portals.",
    pricingModel: "Tiered seat + contact volume pricing (£800–£3,500/mo) + Annual contract lock-in",
    typicalMonthlyExpense: "£1,500–£4,500 / month",
    competitorDrawbacks: [
      "Aggressive pricing tiers as your contact list scales past 10,000–50,000 leads.",
      "Inability to build complex custom operational workflows (e.g. driver dispatch, digital certificate generation).",
      "Restricted client portal capabilities that lack bespoke branding and deep database integration.",
      "Custom reporting locked behind expensive Enterprise Hub tiers."
    ],
    bespokeAdvantages: [
      "Unlimited contacts and unlimited user seats at zero extra cost.",
      "Native integrations with your exact billing, dispatch, and compliance rules.",
      "Dedicated client-facing portals with custom permissions and instant document generation.",
      "High performance Next.js web app with zero per-contact fees."
    ],
    featureMatrix: [
      {
        dimension: "Contact List Scaling",
        bespoke: "Millions of records at zero extra software cost",
        competitorOrOffTheShelf: "Steep price increases as contact database grows"
      },
      {
        dimension: "Operational Workflows",
        bespoke: "Built for dispatch, work orders, invoicing & certificates",
        competitorOrOffTheShelf: "Optimized for marketing emails, weak for complex ops"
      },
      {
        dimension: "Client Portals",
        bespoke: "Branded self-service portal for your clients & partners",
        competitorOrOffTheShelf: "Basic ticket portal with strict HubSpot styling"
      },
      {
        dimension: "API & Database Control",
        bespoke: "Direct SQL queries, webhooks, and unlimited custom endpoints",
        competitorOrOffTheShelf: "Rate-limited REST API with strict payload constraints"
      }
    ],
    migrationTimeline: "4 to 8 weeks",
    whoShouldSwitch: "Agencies and service companies facing sudden HubSpot price renewals or outgrowing HubSpot's marketing-centric limitations.",
    faqs: [
      {
        q: "Can we still use HubSpot for marketing and our custom CRM for operations?",
        a: "Yes. We can build bi-directional webhooks so top-of-funnel marketing leads flow from HubSpot into your custom operational CRM, giving you the best of both worlds."
      }
    ]
  },
  {
    slug: "custom-marketplace-vs-sharetribe",
    competitorName: "Sharetribe",
    category: "Marketplace",
    targetNiche: "Two-Sided Service & Rental Marketplaces",
    summary: "Sharetribe is a quick way to prototype a generic marketplace, but once you need custom transaction splits, photo verification, complex booking logic, or native mobile apps, you hit hard platform limitations.",
    pricingModel: "Monthly SaaS fee ($99–$499/mo) + Transaction fee percentages (up to 2%) + Restricted customization",
    typicalMonthlyExpense: "$500–$2,000 / month + Transaction revenue cut",
    competitorDrawbacks: [
      "Generic booking flow that cannot accommodate complex multi-step inspections or custom contracts.",
      "Ongoing transaction fee take-rates eating into your platform margin.",
      "Limited frontend flexibility constrained to Sharetribe templates.",
      "Inability to deploy native mobile apps or offline-capable contractor PWAs."
    ],
    bespokeAdvantages: [
      "0% platform transaction take-rate (you keep 100% of your commission).",
      "Tailored 3-sided experience (Customer booking, Provider mobile app, Master Admin desk).",
      "Custom Stripe Connect split payouts, escrow release, and automated tax calculations.",
      "Full IP ownership, allowing you to raise venture capital or sell the business without platform risk."
    ],
    featureMatrix: [
      {
        dimension: "Transaction Cut",
        bespoke: "0% platform fee (standard Stripe processing only)",
        competitorOrOffTheShelf: "Monthly subscription + 1-2% platform fee"
      },
      {
        dimension: "Booking & Workflow Logic",
        bespoke: "100% custom (photo proof, checklists, custom milestones)",
        competitorOrOffTheShelf: "Restricted to standard calendar day/hour rental model"
      },
      {
        dimension: "Mobile Experience",
        bespoke: "High-performance Progressive Web App with offline photo capture",
        competitorOrOffTheShelf: "Standard responsive template"
      },
      {
        dimension: "Investor & Acquisition Value",
        bespoke: "Proprietary software asset on your company balance sheet",
        competitorOrOffTheShelf: "Rented SaaS with zero enterprise IP value"
      }
    ],
    migrationTimeline: "8 to 12 weeks",
    whoShouldSwitch: "Marketplace founders whose transaction volume is scaling or whose user experience requires bespoke booking and payout logic.",
    faqs: [
      {
        q: "Can we migrate our existing providers and listings from Sharetribe?",
        a: "Yes. We export your Sharetribe listing catalog, user accounts, and historical reviews, and migrate them cleanly to your custom Next.js + PostgreSQL platform."
      }
    ]
  },
  {
    slug: "bespoke-erp-vs-netsuite",
    competitorName: "Oracle NetSuite",
    category: "ERP & Operations",
    targetNiche: "Mid-Market Service, Logistics & Manufacturing Companies",
    summary: "NetSuite is a powerhouse for large public corporations, but mid-market service businesses often find it overwhelmingly complex, requiring $50k+ implementation consultants and months of training for staff just to complete simple tasks.",
    pricingModel: "Base license (£1,000+/mo) + £100–£200/user/month + Mandatory annual support contracts + Expensive implementation partners",
    typicalMonthlyExpense: "£4,000–£15,000 / month + £50,000+ upfront setup",
    competitorDrawbacks: [
      "High implementation failure rate and 6–18 month rollout timelines.",
      "Complex 1990s-style user interface that causes high user error and requires extensive employee retraining.",
      "Massive annual contract renewals with rigid cancellation policies.",
      "Overengineered for service businesses that need agile job dispatch rather than multi-currency international consolidation."
    ],
    bespokeAdvantages: [
      "Streamlined UI tailored only to the tools and metrics your team uses daily.",
      "Shipped in 8–14 weeks with high team adoption from Day 1.",
      "Seamless real-time synchronization with Xero, QuickBooks, Stripe, and modern cloud APIs.",
      "Zero per-seat licensing penalties."
    ],
    featureMatrix: [
      {
        dimension: "Implementation Time",
        bespoke: "8 to 12 weeks to live deployment",
        competitorOrOffTheShelf: "6 to 18 months of consultant billing"
      },
      {
        dimension: "User Adoption & UI",
        bespoke: "Clean modern web UI requiring minutes of onboarding",
        competitorOrOffTheShelf: "Clunky legacy interface requiring certified consultants"
      },
      {
        dimension: "Annual Recurring Cost",
        bespoke: "£1,000 – £3,000/year (cloud hosting only)",
        competitorOrOffTheShelf: "£30,000 – £120,000+/year in recurring licensing"
      }
    ],
    migrationTimeline: "10 to 14 weeks",
    whoShouldSwitch: "Companies frustrated by bloated enterprise ERP quotes or seeking a purpose-built operational nerve center for their service workforce.",
    faqs: [
      {
        q: "How does bespoke ERP connect with our existing accounting software?",
        a: "We integrate directly with Xero, QuickBooks, or Sage via modern APIs, syncing sales invoices, purchase orders, and bank reconciliation in real time."
      }
    ]
  },
  {
    slug: "custom-software-vs-bubble-no-code",
    competitorName: "Bubble & No-Code Tools",
    category: "No-Code / Low-Code",
    targetNiche: "Startups & Scaling B2B Businesses",
    summary: "Bubble is great for launching a prototype over a weekend, but as soon as you hit real user concurrency, complex database queries, or compliance audits, performance collapses and workload unit pricing skyrockets.",
    pricingModel: "Workload Units (WU) usage-based tiers that spike dramatically with database queries",
    typicalMonthlyExpense: "$300–$2,500 / month (with high risk of sudden usage spikes)",
    competitorDrawbacks: [
      "Severe performance bottlenecks with large relational datasets or high concurrency.",
      "Unpredictable workload unit (WU) pricing that spikes unexpectedly.",
      "Vendor lock-in: You cannot export Bubble code to run on standard AWS/Vercel infrastructure.",
      "Security and compliance limitations when pitching to enterprise or government clients."
    ],
    bespokeAdvantages: [
      "Pure, production-grade Next.js 16 + PostgreSQL: Ultra-fast load times and infinite scalability.",
      "Predictable serverless cloud costs that don't penalize your database size.",
      "Complete code portability: Host on Vercel, AWS, Supabase, or private on-prem servers.",
      "Enterprise security with Row Level Security (RLS) and full auditability."
    ],
    featureMatrix: [
      {
        dimension: "Performance & Latency",
        bespoke: "Sub-second server-rendered pages and instant SQL queries",
        competitorOrOffTheShelf: "Multi-second latency on complex database filters"
      },
      {
        dimension: "Code Portability",
        bespoke: "100% standard TypeScript/React code on your own GitHub",
        competitorOrOffTheShelf: "Locked inside proprietary Bubble visual engine"
      },
      {
        dimension: "Enterprise Readiness",
        bespoke: "Meets enterprise security, SOC2, and GDPR requirements",
        competitorOrOffTheShelf: "Difficult to pass strict corporate IT security audits"
      }
    ],
    migrationTimeline: "4 to 8 weeks",
    whoShouldSwitch: "Founders whose Bubble apps are getting slow, facing steep workload bills, or preparing for institutional funding/enterprise customer onboarding.",
    faqs: [
      {
        q: "Can you rebuild our existing Bubble app in Next.js without losing data?",
        a: "Yes. We export your Bubble database via CSV or API, design an optimized PostgreSQL schema, and recreate your application in Next.js with superior speed, mobile responsiveness, and reliability."
      }
    ]
  }
];
