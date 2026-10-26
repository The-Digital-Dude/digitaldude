import { PseoComparison } from "../types";

/**
 * Two build-vs-buy guides added from the October 2026 keyword plan ("shopify alternative", "airtable alternative"). Competitor prices are
 * approximate published list prices and change often; the cost models are illustrative and state their assumptions.
 */
export const newPseoComparisons: PseoComparison[] = [
  {
    slug: "custom-ecommerce-vs-shopify",
    competitorName: "Shopify",
    category: "E-Commerce",
    targetNiche: "Online Retailers, Wholesalers & Marketplaces Outgrowing a Standard Storefront",
    summary:
      "Shopify is the right answer for most online shops, and this guide says so. It stops being the right answer when your checkout, payments, couriers or catalogue rules are so specific that you spend more on workarounds and apps than a purpose-built system would cost.",
    pricingModel:
      "Monthly plan (roughly $29 to $299/mo on standard plans, Shopify Plus from roughly $2,300/mo) + app subscriptions + payment processing fees, plus a transaction fee if you use a third-party payment gateway. Prices are approximate list prices; confirm current pricing.",
    typicalMonthlyExpense: "$400–$1,200 / month on standard plans with a typical app stack; Plus plans start far higher",
    competitorDrawbacks: [
      "App stack creep: subscriptions, B2B, bundles, advanced shipping and loyalty are often separate paid apps, each with its own fee and failure mode.",
      "Checkout and payment flows are customisable only within Shopify's rules, which is hard for cash on delivery, manual mobile-wallet payments, or unusual local couriers.",
      "Catalogue and pricing logic that depends on your own rules (customer-specific pricing, measured or configured products) pushes you into apps or custom code on the platform.",
      "You rent the platform: your storefront, data model and theme code live on infrastructure you cannot move elsewhere.",
    ],
    bespokeAdvantages: [
      "Checkout, payments and fulfilment modelled exactly on how you sell, including local payment methods and courier APIs.",
      "One database for orders, stock, customers and finance, with no sync between a store and add-on tools.",
      "No per-plan revenue tiers or app subscriptions that rise as you grow.",
      "Full ownership of the code and data, so you can move host or agency without rebuilding.",
    ],
    featureMatrix: [
      { dimension: "Time to first sale", bespoke: "Weeks to months, depending on scope", competitorOrOffTheShelf: "Days. A working store can be live almost immediately." },
      { dimension: "Standard retail features", bespoke: "Built only if you need them, at build cost", competitorOrOffTheShelf: "Included and well tested: themes, cart, discounts, SEO basics" },
      { dimension: "Unusual checkout or payments", bespoke: "Designed in from day one (COD, wallets, manual verification)", competitorOrOffTheShelf: "Limited to platform rules; often needs apps or workarounds" },
      { dimension: "Monthly cost as you grow", bespoke: "Hosting and usage; no plan tiers", competitorOrOffTheShelf: "Plan tier and apps rise with revenue and needs" },
      { dimension: "Code and data ownership", bespoke: "You own the code and the database", competitorOrOffTheShelf: "Data is exportable; storefront and logic stay on the platform" },
      { dimension: "Ongoing responsibility", bespoke: "You are responsible for security updates and uptime (or pay for it)", competitorOrOffTheShelf: "The platform maintains hosting, security and checkout" },
    ],
    migrationTimeline: "10 to 16 weeks for a focused custom store, longer for multi-tenant or marketplace builds",
    whoShouldSwitch:
      "Retailers whose checkout, payments, couriers or pricing rules are poorly served by Shopify, or businesses paying for a high plan plus many apps to approximate behaviour a purpose-built system would give them directly.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership (illustrative)",
        competitorEstimate: "$25,000 – $42,000",
        competitorDetails: [
          "Advanced-tier plan at roughly $299/mo (about $10,800 over 3 years)",
          "App subscriptions at roughly $250–$600/mo (about $9,000–$21,600)",
          "One-off theme and setup work of roughly $5,000–$10,000",
        ],
        bespokeEstimate: "$40,000 – $60,000",
        bespokeDetails: [
          "Custom build of roughly $30,000–$45,000, depending on scope",
          "Hosting and database at roughly $100–$200/mo (about $3,600–$7,200)",
          "Maintenance allowance of roughly 10–15% of build cost per year",
        ],
        netDifference: "Shopify is usually cheaper over 3 years unless you need behaviour it cannot provide",
      },
      {
        timeline: "5-Year Total Cost of Ownership at Shopify Plus scale (illustrative)",
        competitorEstimate: "$140,000 – $170,000",
        competitorDetails: [
          "Plus-tier plan at roughly $2,300/mo (about $138,000 over 5 years)",
          "App and integration costs on top",
        ],
        bespokeEstimate: "$55,000 – $85,000",
        bespokeDetails: [
          "Custom build of roughly $30,000–$45,000",
          "Hosting at roughly $100–$200/mo (about $6,000–$12,000)",
          "Maintenance allowance of roughly 10–15% of build cost per year",
        ],
        netDifference: "Custom can cost materially less once you would otherwise be on a Plus plan for years",
      },
    ],
    whenToChoose: [
      { scenario: "Standard online shop with card payments and mainstream couriers", recommendation: "competitor", rationale: "Shopify gives you a proven checkout, themes and an app ecosystem with almost no build cost. Building your own rarely pays back here." },
      { scenario: "You need to be selling within days", recommendation: "competitor", rationale: "A hosted platform is the fastest route to your first order while you learn what customers want." },
      { scenario: "Cash on delivery, manual mobile wallets or local couriers are core to how you sell", recommendation: "bespoke", rationale: "When payment verification, courier booking and fraud checks define your margins, a system built around them removes manual work and app fees." },
      { scenario: "Customer-specific pricing, configured products or wholesale rules", recommendation: "bespoke", rationale: "Heavy pricing logic is easier to model and test in your own database than to patch onto a storefront through apps." },
      { scenario: "You want to run many stores or a marketplace", recommendation: "bespoke", rationale: "Multi-tenant platforms and marketplaces need data isolation and commission logic that a single-store platform is not designed for." },
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 storefront and admin, server-rendered for speed on mobile connections",
      backend: "Server actions with strict TypeScript validation; prices recalculated on the server",
      database: "PostgreSQL with row-level security for multi-store isolation",
      cloud: "Vercel with managed Postgres, queued background jobs and nightly encrypted backups",
      integrations: ["Stripe and local payment providers", "Courier APIs", "SMS and email providers", "Meta Conversions API and GA4", "Accounting export"],
    },
    migrationRoadmap: [
      { phase: "Phase 1: Requirements and data audit", duration: "Weeks 1–2", focus: "Map your checkout, payment and fulfilment rules and audit products, customers and orders to move.", deliverables: ["Feature and workflow specification", "Product and customer export review", "Fixed-scope milestone plan"] },
      { phase: "Phase 2: Core store build", duration: "Weeks 3–8", focus: "Catalogue, cart, checkout, payments and order management.", deliverables: ["Working checkout on staging", "Order and stock management", "Payment and courier integrations"] },
      { phase: "Phase 3: Migration and testing", duration: "Weeks 9–12", focus: "Import products and customers, test orders end to end, and keep your redirects so SEO is protected.", deliverables: ["Data import and reconciliation report", "301 redirect map", "Load and accessibility testing"] },
      { phase: "Phase 4: Parallel run and cutover", duration: "Weeks 13–16", focus: "Run both stores briefly, then switch DNS with monitoring.", deliverables: ["Production launch", "Source code and database handover", "30-day warranty support"] },
    ],
    checklistItems: [
      { id: "shop-standard", question: "Is your checkout a standard card payment with mainstream couriers?", target: "competitor", description: "Shopify handles this very well and quickly." },
      { id: "shop-speed", question: "Do you need to start selling within the next few weeks?", target: "competitor", description: "A hosted platform is far faster to launch." },
      { id: "shop-team", question: "Do you have nobody to look after hosting, security updates and uptime?", target: "competitor", description: "A hosted platform carries that responsibility for you." },
      { id: "shop-apps", question: "Does a handful of well-reviewed apps cover everything else you need?", target: "competitor", description: "If apps solve it cleanly, there is little reason to build." },
      { id: "bespoke-checkout", question: "Do cash on delivery, manual wallet verification or local couriers drive your operations?", target: "bespoke", description: "A system built around them removes manual work." },
      { id: "bespoke-pricing", question: "Do you need customer-specific pricing or configured products?", target: "bespoke", description: "Complex pricing is easier to model in your own database." },
      { id: "bespoke-apps", question: "Are you paying for many apps to approximate one workflow?", target: "bespoke", description: "Consolidating into one system can lower cost and failure points." },
      { id: "bespoke-multi", question: "Do you plan to run many stores or a marketplace?", target: "bespoke", description: "Multi-tenant isolation and commission logic need purpose-built architecture." },
    ],
    faqs: [
      { q: "What is the best Shopify alternative for a growing business?", a: "For most shops the best alternative is another hosted platform. A custom-built store is the right alternative only when your checkout, payments, couriers or pricing rules are specific enough that Shopify needs many paid apps or workarounds to approximate them." },
      { q: "Is a custom ecommerce site cheaper than Shopify?", a: "Usually not in the first three years. Shopify is cheaper for standard stores. A custom build can cost less over five years if you would otherwise stay on a high-tier plan with many app subscriptions. The cost models on this page show both, with their assumptions." },
      { q: "Can I keep my products, customers and SEO if I leave Shopify?", a: "Yes. Products, customers and orders can be exported and imported, and a redirect map from every old URL to its new page protects your search rankings through the move." },
      { q: "How long does a custom ecommerce build take?", a: "A focused custom store typically takes 10 to 16 weeks including migration and testing. Multi-store or marketplace platforms take longer and are best delivered in phases." },
    ],
  },
  {
    slug: "custom-software-vs-airtable",
    competitorName: "Airtable",
    category: "No-Code / Low-Code",
    targetNiche: "Teams Running Operations, Projects or Customer Data on Spreadsheet-Style Databases",
    summary:
      "Airtable is an excellent way to prove a workflow with a handful of people. It starts to hurt when permissions, record limits, per-seat cost and the need for customer-facing portals meet a process that has become the business.",
    pricingModel:
      "Per-seat monthly subscription (roughly $20/seat/mo on Team and $45/seat/mo on Business, billed annually) + paid automation and sync limits + extensions. Prices are approximate list prices; confirm current pricing.",
    typicalMonthlyExpense: "$500–$1,150 / month for about 25 seats, rising with every new user",
    competitorDrawbacks: [
      "Per-seat pricing grows with headcount, and anyone who needs to edit counts as a seat.",
      "Permissions are table- and view-based, which is difficult to stretch into real role-based access across staff, partners and customers.",
      "Record and automation limits by plan make large or busy bases a planning constraint.",
      "Customer-facing portals and branded interfaces are limited, and the logic lives in a proprietary builder you cannot move.",
    ],
    bespokeAdvantages: [
      "A real relational database with proper access control, audit trails and no per-seat licence.",
      "Portals for staff, partners and customers, each seeing only what applies to them.",
      "Business rules enforced in code and the database, rather than relying on people to follow a convention.",
      "Standard TypeScript and PostgreSQL that you own and can host anywhere.",
    ],
    featureMatrix: [
      { dimension: "Speed to a working tool", bespoke: "Weeks", competitorOrOffTheShelf: "Hours to days. Ideal for prototyping a workflow." },
      { dimension: "Cost per additional user", bespoke: "No per-user licence", competitorOrOffTheShelf: "Every editor is a paid seat" },
      { dimension: "Access control", bespoke: "Role-based, enforced at the database level", competitorOrOffTheShelf: "View- and table-based sharing with plan limits" },
      { dimension: "Customer or partner portals", bespoke: "Built to your design and brand", competitorOrOffTheShelf: "Limited interface options" },
      { dimension: "Scale and data integrity", bespoke: "Relational constraints and transactions", competitorOrOffTheShelf: "Record limits and softer data rules" },
      { dimension: "Portability", bespoke: "Standard code and Postgres you own", competitorOrOffTheShelf: "Data exports; logic stays in the platform" },
    ],
    migrationTimeline: "6 to 10 weeks from workflow mapping to production, usually running alongside Airtable until cutover",
    whoShouldSwitch:
      "Teams of around 15 or more where Airtable has become the system of record, where customers or partners need access, or where per-seat cost and permission workarounds are growing every quarter.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership for 25 users (illustrative)",
        competitorEstimate: "$18,000 – $40,500",
        competitorDetails: [
          "Team tier at roughly $20/seat/mo: about $18,000 over 3 years",
          "Business tier at roughly $45/seat/mo: about $40,500 over 3 years",
          "Extensions and any consultant time are extra",
        ],
        bespokeEstimate: "$11,000 – $23,000",
        bespokeDetails: [
          "Operations-platform build of roughly $9,000–$19,000, in line with our published bands",
          "Hosting at roughly $50–$150/mo (about $1,800–$5,400)",
          "Maintenance allowance for small changes",
        ],
        netDifference: "Roughly break-even on the Team tier; custom is clearly cheaper against the Business tier",
      },
      {
        timeline: "5-Year Total Cost of Ownership for 40 users (illustrative)",
        competitorEstimate: "$48,000 – $108,000",
        competitorDetails: [
          "Team tier: about $48,000 over 5 years for 40 seats",
          "Business tier: about $108,000 over 5 years for 40 seats",
        ],
        bespokeEstimate: "$14,000 – $30,000",
        bespokeDetails: [
          "Build as above",
          "Hosting and a modest maintenance allowance over 5 years",
          "No change in cost as seats grow",
        ],
        netDifference: "The gap widens with headcount because custom has no per-seat cost",
      },
    ],
    whenToChoose: [
      { scenario: "A small team proving or running a simple workflow", recommendation: "competitor", rationale: "Airtable is fast, flexible and inexpensive for under about 10 users. Do not build until the workflow is stable." },
      { scenario: "You are still discovering how the process should work", recommendation: "competitor", rationale: "Changing a base is easier than changing code. Learn first, then build what you now know you need." },
      { scenario: "Customers or partners need to log in and see their own records", recommendation: "bespoke", rationale: "A proper portal with real role-based access is hard to do safely in a spreadsheet-style tool." },
      { scenario: "Per-seat cost and permission workarounds are rising each quarter", recommendation: "bespoke", rationale: "Once most of the team needs editing rights, a fixed-cost system usually wins." },
      { scenario: "The data has legal, financial or compliance weight", recommendation: "bespoke", rationale: "Audit trails, validation and controlled access matter more than flexibility at that point." },
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 with role-specific views for staff, partners and customers",
      backend: "Server actions with strict validation and an audit log of changes",
      database: "PostgreSQL with relational constraints and row-level security",
      cloud: "Vercel with managed Postgres and automated backups",
      integrations: ["Email and SMS", "Accounting export", "File storage", "Webhooks to the tools you already use"],
    },
    migrationRoadmap: [
      { phase: "Phase 1: Map the workflow", duration: "Weeks 1–2", focus: "Document the bases, fields, views and automations your team relies on, and decide what to keep.", deliverables: ["Entity relationship diagram", "Role and permission matrix", "Field-mapping specification"] },
      { phase: "Phase 2: Build the core", duration: "Weeks 3–6", focus: "Build the data model, roles and the screens the team uses every day.", deliverables: ["Working system on staging", "Role-based views", "Audit log"] },
      { phase: "Phase 3: Migrate and test", duration: "Weeks 7–8", focus: "Export from Airtable, clean and import, then reconcile the counts and test with real users.", deliverables: ["Import scripts", "Reconciliation report", "User acceptance testing"] },
      { phase: "Phase 4: Run alongside, then switch", duration: "Weeks 9–10", focus: "Run both in parallel, then cut over and retire the old base.", deliverables: ["Production launch", "Source code and database handover", "30-day warranty support"] },
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "$",
      defaultSeats: 25,
      minSeats: 5,
      maxSeats: 100,
      tiers: [
        { name: "Airtable Team (about $20/seat)", monthlyPerSeat: 20, description: "Approximate list price, billed annually" },
        { name: "Airtable Business (about $45/seat)", monthlyPerSeat: 45, description: "Approximate list price, billed annually" },
      ],
      competitorOnboardingFee: 0,
      competitorSupportAnnual: 0,
      bespokeBuildCost: 14000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1500,
    },
    checklistItems: [
      { id: "air-small", question: "Is your team smaller than about 10 people?", target: "competitor", description: "Per-seat cost is small and flexibility is high." },
      { id: "air-learning", question: "Are you still working out how the process should run?", target: "competitor", description: "Change is cheap in a no-code tool, so learn there first." },
      { id: "air-internal", question: "Is the tool used only by your own staff?", target: "competitor", description: "Internal-only use avoids the portal and permission limits." },
      { id: "air-fine", question: "Is it working well and costing little?", target: "competitor", description: "If so, do not change it." },
      { id: "bespoke-portal", question: "Do customers or partners need their own login and view?", target: "bespoke", description: "A custom portal gives each audience only their own data." },
      { id: "bespoke-seat", question: "Is per-seat cost growing as you hire?", target: "bespoke", description: "Custom software has no per-user licence." },
      { id: "bespoke-rules", question: "Do mistakes in the data cost you money or compliance risk?", target: "bespoke", description: "Database-level validation and audit trails prevent them." },
      { id: "bespoke-limits", question: "Are you working around record, automation or permission limits?", target: "bespoke", description: "Workarounds are a sign the process has outgrown the tool." },
    ],
    faqs: [
      { q: "What is a good Airtable alternative for a growing company?", a: "If you want to stay no-code, other no-code databases exist. If the workflow has become core to the business, or customers and partners need access, a custom system on PostgreSQL gives you proper roles, audit trails and no per-seat licence." },
      { q: "Is custom software cheaper than Airtable?", a: "For small teams, no. Airtable's Team tier is hard to beat under about 10 users. As headcount and permission needs grow, or against the Business tier, a custom system usually costs less over three to five years. The cost models on this page show the assumptions." },
      { q: "Can I move my Airtable data into a custom system?", a: "Yes. Bases export to CSV or can be read through the API. The data is cleaned, mapped to a relational model, imported and reconciled record by record before cutover." },
      { q: "Should I build before I am sure of the process?", a: "No. Use Airtable to learn what the process really is, then build once it has stabilised. Building too early means rebuilding." },
    ],
  },
];
