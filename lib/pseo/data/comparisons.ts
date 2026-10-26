import { PseoComparison } from "../types";
import { newPseoComparisons } from "./comparisonsNew";

export const pseoComparisons: PseoComparison[] = [
  {
    slug: "custom-crm-vs-salesforce",
    competitorName: "Salesforce",
    category: "CRM",
    targetNiche: "High-Growth Service, Logistics & Field Operations Businesses",
    summary: "Salesforce is the enterprise titan of sales CRMs, but for specialized service businesses, it often turns into a money pit of $150–$300/user/month licensing fees, endless consultant retainers, and overly complex menus.",
    pricingModel: "Per-seat monthly subscription ($150–$300/user/mo) + Mandatory Enterprise Support + Third-Party Consultant Retainers",
    typicalMonthlyExpense: "$3,500–$12,000 / month (for 20–40 seats) recurring forever",
    competitorDrawbacks: [
      "Punitive per-seat pricing that taxes team growth as you hire more operators or contractors.",
      "Generic sales pipeline that requires months of Apex development to match specialized operational workflows.",
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
        bespoke: "$0 / seat (Fixed one-time build, minor cloud hosting)",
        competitorOrOffTheShelf: "$150 – $300+ / user / month (escalates yearly)"
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
    whoShouldSwitch: "Companies with 10+ employees spending over $18,000/year on Salesforce or feeling constrained by its generic objects and consultant dependency.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "$144,000+",
        competitorDetails: [
          "25 users @ $165/user/mo Enterprise Edition ($49,500/yr = $148,500 over 3 yrs)",
          "$24,000 initial implementation partner onboarding & customization fee",
          "$6,000/yr mandatory Premier Support contracts ($18,000 over 3 yrs)"
        ],
        bespokeEstimate: "$29,600",
        bespokeDetails: [
          "$25,000 fixed milestone build proposal (custom CRM + portals)",
          "$100/mo cloud hosting & automated PostgreSQL backups ($3,600 over 3 yrs)",
          "$1,000 annual maintenance buffer ($3,000 over 3 yrs)"
        ],
        netDifference: "Save ~$114,400 (79% total cost reduction)"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "$264,000+",
        competitorDetails: [
          "35 users with growth @ escalating contract rates ($69,300/yr)",
          "Ongoing Apex developer retainers for workflow updates ($15,000/yr)",
          "Community license expansion for contractor logins"
        ],
        bespokeEstimate: "$34,400",
        bespokeDetails: [
          "Core software asset fully amortized; owned outright",
          "Zero marginal seat license fees as headcount grows from 25 to 75+",
          "$120/mo scalable cloud hosting"
        ],
        netDifference: "Save ~$229,600 (87% total cost reduction)"
      }
    ],
    whenToChoose: [
      {
        scenario: "Enterprise Sales Pipeline & AppExchange Ecosystem",
        recommendation: "competitor",
        rationale: "If you have 200+ dedicated B2B SDRs/Account Executives running standardized outbound funnels and rely heavily on existing AppExchange enterprise integrations, Salesforce's ecosystem is hard to beat."
      },
      {
        scenario: "Rapid 48-Hour Out-of-the-Box Setup",
        recommendation: "competitor",
        rationale: "If you need a working sales pipeline active by Friday and have standard lead-deal requirements, packaged SaaS delivers immediate provisioning."
      },
      {
        scenario: "Specialized Operational Workflows & Job Dispatch",
        recommendation: "bespoke",
        rationale: "When your CRM must handle multi-step field dispatch, compliance certificates, driver manifests, or custom operational milestones, custom PostgreSQL architecture outperforms Salesforce hacks."
      },
      {
        scenario: "Large Contractor Network or Free Client Portals",
        recommendation: "bespoke",
        rationale: "Salesforce charges per login/seat for Community portals. A custom Next.js system provides unlimited client self-service and contractor logins at zero incremental software cost."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 (App Router) with Tailwind CSS and role-tailored dispatcher dashboards",
      backend: "Next.js Server Actions with strict TypeScript schema validation",
      database: "PostgreSQL on Supabase with Row Level Security (RLS) & daily WAL point-in-time recovery",
      cloud: "Vercel / AWS with Cloudflare enterprise DDoS protection and edge caching",
      integrations: ["Xero / QuickBooks Online", "Stripe Invoicing & Billing", "Twilio SMS Dispatch", "SendGrid Email", "DocuSign / Custom PDF Generation"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Architecture & Object Mapping",
        duration: "Weeks 1–2",
        focus: "Audit current Salesforce custom objects, formulas, user roles, and data relationships.",
        deliverables: ["Entity relationship diagram (ERD)", "Field-mapping specification", "Data cleanup checklist"]
      },
      {
        phase: "Phase 2: Core Platform & Pipeline Engineering",
        duration: "Weeks 3–5",
        focus: "Build the bespoke Next.js interface, role permissions, and custom dispatch engine.",
        deliverables: ["Role-based portal prototypes", "Automated document generators", "Staging environment access"]
      },
      {
        phase: "Phase 3: Data ETL & Historical Migration",
        duration: "Weeks 6–7",
        focus: "Extract historical Salesforce records, deduplicate contacts, and import into PostgreSQL.",
        deliverables: ["Automated migration scripts", "Record reconciliation reports", "Sandbox acceptance testing"]
      },
      {
        phase: "Phase 4: Parallel Testing & Production Cutover",
        duration: "Weeks 8–9",
        focus: "14-day parallel run, user adoption training, final DNS switch with zero data loss.",
        deliverables: ["Live production deployment", "Full source code handover", "30-day warranty support"]
      }
    ],
    faqs: [
      {
        q: "How do we migrate our existing Salesforce data?",
        a: "We extract your historical Salesforce accounts, contacts, opportunities, and custom objects, deduplicate the records, and cleanly migrate them into your bespoke PostgreSQL database with zero downtime."
      },
      {
        q: "What is the ongoing maintenance cost of a custom CRM?",
        a: "Unlike Salesforce which costs thousands per month in license fees, a modern serverless Next.js + Supabase backend typically costs $50–$200/month in cloud hosting, representing a 90%+ ongoing cost reduction."
      },
      {
        q: "Can we still connect third-party tools like Slack, Xero, or WhatsApp?",
        a: "Yes. Our bespoke CRMs feature open REST/webhook architectures, allowing bi-directional synchronization with your accounting, communications, and marketing stacks without paying extra Salesforce API connector fees."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "$",
      defaultSeats: 25,
      minSeats: 5,
      maxSeats: 120,
      tiers: [
        {
          name: "Salesforce Enterprise ($165/seat)",
          monthlyPerSeat: 165,
          description: "Core sales automation, workflow rules & custom objects"
        },
        {
          name: "Salesforce Unlimited ($330/seat)",
          monthlyPerSeat: 330,
          description: "Predictive AI features, 24/7 support & full sandboxes"
        }
      ],
      competitorOnboardingFee: 24000,
      competitorSupportAnnual: 6000,
      bespokeBuildCost: 25000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1000
    },
    checklistItems: [
      {
        id: "sfdc-sdr",
        question: "Does your team have 50+ dedicated SDRs/AEs running standardized outbound sequences?",
        target: "competitor",
        description: "Salesforce's ecosystem is tuned for high-volume, conventional sales pipelines."
      },
      {
        id: "sfdc-appexchange",
        question: "Do you rely heavily on pre-built enterprise AppExchange vendor packages?",
        target: "competitor",
        description: "AppExchange provides turnkey enterprise connectors for large enterprise software suites."
      },
      {
        id: "sfdc-governance",
        question: "Does corporate IT require an established enterprise vendor with SOC2 and global SLAs?",
        target: "competitor",
        description: "Vendor platforms offload core hosting, compliance certifications, and disaster recovery."
      },
      {
        id: "sfdc-speed",
        question: "Do you need standard lead/opportunity tracking working by the end of the week?",
        target: "competitor",
        description: "Standard sales pipeline tools can be provisioned in days before customizing."
      },
      {
        id: "bespoke-dispatch",
        question: "Does your CRM need to handle field technician dispatch, routes, or statutory certs?",
        target: "bespoke",
        description: "Bespoke PostgreSQL architecture maps directly to physical operations without Apex hacks."
      },
      {
        id: "bespoke-portals",
        question: "Do external clients, subcontractors, or partners need branded self-service portals?",
        target: "bespoke",
        description: "Unlimited external logins without paying $50/user Community licensing fees."
      },
      {
        id: "bespoke-data",
        question: "Is your specialized operational relational data model part of your competitive moat?",
        target: "bespoke",
        description: "Model properties, vehicle fleets, job manifests, and escrow logic natively in SQL."
      },
      {
        id: "bespoke-licensing",
        question: "Is paying $150–$300/mo per seat turning your headcount expansion into a software penalty?",
        target: "bespoke",
        description: "Eliminate recurring seat tax forever: add 10 or 100 staff with zero marginal license cost."
      }
    ]
  },
  {
    slug: "custom-crm-vs-hubspot",
    competitorName: "HubSpot",
    category: "CRM",
    targetNiche: "B2B Service Agencies & Operations Teams",
    summary: "HubSpot excels at inbound marketing and simple B2B pipelines, but its tiered pricing steeply punishes growing contact lists, and it lacks the relational flexibility needed for complex field operations or custom client portals.",
    pricingModel: "Tiered seat + contact volume pricing ($800–$3,500/mo) + Annual contract lock-in",
    typicalMonthlyExpense: "$1,500–$4,500 / month",
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
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "$62,000+",
        competitorDetails: [
          "Sales + Service Pro ($1,200/mo = $43,200 over 3 yrs)",
          "Marketing Hub contact tier escalations past 20k contacts ($350/mo = $12,600)",
          "Mandatory initial onboarding fees ($6,000)"
        ],
        bespokeEstimate: "$28,600",
        bespokeDetails: [
          "$25,000 fixed milestone build proposal",
          "$100/mo cloud hosting on Vercel & Supabase ($3,600 over 3 yrs)"
        ],
        netDifference: "Save ~$33,400 (54% cost reduction) with unlimited contacts"
      }
    ],
    whenToChoose: [
      {
        scenario: "Inbound Content Marketing & Automated Email Sequences",
        recommendation: "competitor",
        rationale: "HubSpot is unmatched for drag-and-drop landing page builders, lead nurturing sequences, and social publishing in a unified marketing team."
      },
      {
        scenario: "Operational Service Fulfillment & Client Portals",
        recommendation: "bespoke",
        rationale: "When deals close and turn into complex service execution, customer document uploads, and multi-team handoffs, bespoke software is vastly superior."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 with Tailwind CSS and responsive customer portals",
      backend: "TypeScript Server Actions with bi-directional HubSpot webhook sync",
      database: "Supabase PostgreSQL with unlimited contact storage",
      cloud: "Vercel / AWS with Cloudflare CDN",
      integrations: ["HubSpot Marketing API", "Stripe Billing", "Xero", "Resend Transactional Email"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Workflow & Contact Sync Strategy",
        duration: "Weeks 1–2",
        focus: "Determine hybrid or full migration boundary, mapping properties and webhooks.",
        deliverables: ["Data schema mapping", "Webhook integration architecture"]
      },
      {
        phase: "Phase 2: Bespoke Portal Engineering",
        duration: "Weeks 3–5",
        focus: "Build custom customer portal, fulfillment pipelines, and document generation.",
        deliverables: ["Operational portal UI", "Direct SQL reporting views"]
      },
      {
        phase: "Phase 3: Migration & Cutover",
        duration: "Weeks 6–7",
        focus: "Sync contacts, verify webhook triggers, train internal team.",
        deliverables: ["Zero-downtime deployment", "Staff training documentation"]
      }
    ],
    faqs: [
      {
        q: "Can we still use HubSpot for marketing and our custom CRM for operations?",
        a: "Yes. We frequently build hybrid setups: marketing leads stay in HubSpot Free or Starter, and upon qualification, webhooks instantly push records into your bespoke operational CRM for project management, dispatch, and billing."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "$",
      defaultSeats: 20,
      minSeats: 5,
      maxSeats: 80,
      tiers: [
        {
          name: "Sales Hub Professional ($90/seat)",
          monthlyPerSeat: 90,
          description: "Billed annually, up to 5 teams, sequences & custom reports"
        },
        {
          name: "Sales Hub Enterprise ($150/seat)",
          monthlyPerSeat: 150,
          description: "Custom objects, recurring revenue tracking & permissions"
        }
      ],
      competitorOnboardingFee: 1500,
      competitorSupportAnnual: 0,
      bespokeBuildCost: 22000,
      bespokeMonthlyHosting: 90,
      bespokeAnnualMaintenance: 800
    },
    checklistItems: [
      {
        id: "hs-pipeline",
        question: "Is your process recognizably a conventional sales pipeline (leads, deals, sequences)?",
        target: "competitor",
        description: "HubSpot is unmatched for inbound lead nurturing and deal pipeline tracking."
      },
      {
        id: "hs-marketing",
        question: "Do marketing and sales teams need to share one unified, out-of-the-box platform?",
        target: "competitor",
        description: "HubSpot Marketing, Sales, and Content Hubs share unified attribution out of the box."
      },
      {
        id: "hs-speed",
        question: "Do you need to launch and onboard your sales reps immediately?",
        target: "competitor",
        description: "Packaged SaaS provides immediate account provisioning and familiar UI."
      },
      {
        id: "hs-maintenance",
        question: "Does your organization prefer vendor-managed maintenance over software asset ownership?",
        target: "competitor",
        description: "SaaS vendors handle platform patches, mobile apps, and continuous infrastructure updates."
      },
      {
        id: "bespoke-ops",
        question: "Does your system coordinate field technicians, compliance inspections, or dispatch?",
        target: "bespoke",
        description: "Operational workflows with non-standard roles require custom relational schemas."
      },
      {
        id: "bespoke-portals",
        question: "Do external clients, contractors, or agencies need dedicated, branded self-service portals?",
        target: "bespoke",
        description: "Bespoke software provides unlimited client logins without expensive per-portal tiers."
      },
      {
        id: "bespoke-contacts",
        question: "Are contact tier limits and database size escalations becoming a punitive tax?",
        target: "bespoke",
        description: "Store millions of contacts, accounts, and audit records in PostgreSQL at zero extra seat cost."
      },
      {
        id: "bespoke-moat",
        question: "Is your workflow and relational data structure central to your enterprise valuation?",
        target: "bespoke",
        description: "Own 100% of your source code, database tables, and infrastructure accounts as balance sheet equity."
      }
    ]
  },
  {
    slug: "custom-marketplace-vs-sharetribe",
    competitorName: "Sharetribe",
    category: "Marketplace",
    targetNiche: "Two-Sided Service, Booking, Rental & B2B Procurement Marketplaces",
    summary: "Sharetribe is a quick way to prototype a generic marketplace, but once you need custom transaction splits, photo verification, complex booking logic, or native mobile apps, you hit hard platform limitations and punitive revenue take-rates.",
    pricingModel: "Monthly SaaS fee ($99–$499/mo) + Transaction fee percentages (up to 1.5–2% GMV) + Custom developer hosting",
    typicalMonthlyExpense: "$500–$2,500 / month + Transaction revenue cut",
    competitorDrawbacks: [
      "Ongoing platform take-rates (1–2% of GMV) that directly eat into your marketplace take margin as transaction volume grows.",
      "Generic booking flow that cannot accommodate multi-step inspections, milestone escrow, or custom contractor contracts.",
      "Limited frontend flexibility constrained by Sharetribe template boundaries.",
      "Inability to deploy native mobile apps, progressive web apps with offline camera capture, or custom geo-radius search."
    ],
    bespokeAdvantages: [
      "0% platform transaction take-rate: You retain 100% of your commission fees (paying only standard Stripe interchange).",
      "Tailored 3-sided experience: Customer self-booking, Provider mobile desk, and Master Admin oversight console.",
      "Custom Stripe Connect split payouts, escrow milestones, and automated sales tax / 1099 calculations.",
      "Full IP ownership, allowing you to raise venture capital or sell the business without platform risk."
    ],
    featureMatrix: [
      {
        dimension: "Transaction Cut",
        bespoke: "0% platform fee (standard Stripe processing only)",
        competitorOrOffTheShelf: "Monthly subscription + 1-2% platform fee on all GMV"
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
    whoShouldSwitch: "Marketplace founders whose transaction volume is scaling past $30k/month or whose user experience requires bespoke booking and payout logic.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "$68,000+",
        competitorDetails: [
          "Sharetribe Build tier subscription ($399/mo = $14,364 over 3 yrs)",
          "1.5% platform take-rate on $1,000,000 annual GMV ($15,000/yr = $45,000 over 3 yrs)",
          "Third-party custom code hosting & developer maintenance retainers ($9,000)"
        ],
        bespokeEstimate: "$31,600",
        bespokeDetails: [
          "$28,000 fixed milestone build proposal (customer app + vendor desk + admin)",
          "$100/mo serverless cloud hosting on Vercel & Supabase ($3,600 over 3 yrs)",
          "Zero platform take-rate; pay only standard Stripe processing fees"
        ],
        netDifference: "Save ~$36,400 + retain 100% of marketplace commissions"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "$135,000+",
        competitorDetails: [
          "Escalating transaction fee cuts as marketplace scales to $2.5M+ annual GMV",
          "Ongoing monthly SaaS charges across multiple regional domains",
          "Costly hacks to work around core database schema constraints"
        ],
        bespokeEstimate: "$37,000",
        bespokeDetails: [
          "Asset owned outright with 100% code control",
          "$150/mo cloud infrastructure scaling smoothly to 500k+ monthly page views",
          "Zero revenue share taken by the software provider"
        ],
        netDifference: "Save ~$98,000+ while building enterprise balance-sheet equity"
      }
    ],
    whenToChoose: [
      {
        scenario: "Rapid 14-Day MVP Validation with Zero Budget",
        recommendation: "competitor",
        rationale: "If you have less than $5,000 total capital and need to test whether buyers and sellers will transact in a standard rental/booking model, Sharetribe's no-code builder is the fastest launchpad."
      },
      {
        scenario: "Custom Multi-Tier Payouts & Milestone Escrow",
        recommendation: "bespoke",
        rationale: "When your platform requires complex funds holding, release on digital signature, split deposits between multiple suppliers, or custom dispute arbitration, bespoke Stripe Connect architecture is required."
      },
      {
        scenario: "Geo-Spatial Radius Search & Real-Time Availability",
        recommendation: "bespoke",
        rationale: "Service marketplaces requiring real-time driver/provider radius matching via PostGIS and instant availability dispatch need custom relational schemas."
      },
      {
        scenario: "Seeking Venture Capital or Strategic Acquisition",
        recommendation: "bespoke",
        rationale: "Institutional investors and strategic buyers heavily discount marketplaces built on closed proprietary platforms where code cannot be ported or independently audited."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 App Router responsive web app & PWA with instant search and vendor mobile portal",
      backend: "Next.js Route Handlers and Server Actions with optimistic booking state updates",
      database: "PostgreSQL on Supabase with PostGIS for geo-spatial radius matching",
      cloud: "Vercel / AWS with Cloudflare Images CDN for instant provider portfolio uploads",
      integrations: ["Stripe Connect Custom (automated split payments, KYC, and 1099 tax filing)", "Twilio SMS Instant Booking Alerts", "Mapbox Search & Geocoding", "Resend Transactional Email"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Marketplace Model & Escrow Discovery",
        duration: "Weeks 1–2",
        focus: "Map buyer booking journeys, provider payout schedules, fee splits, and dispute workflows.",
        deliverables: ["Marketplace ERD schema", "Stripe Connect flow diagrams", "UI wireframes for all 3 portals"]
      },
      {
        phase: "Phase 2: Core Platform & Stripe Connect Engineering",
        duration: "Weeks 3–6",
        focus: "Build listing catalog, search filters, booking calendar, and split payout infrastructure.",
        deliverables: ["Interactive marketplace staging", "Secure payment flow with sandbox testing", "Vendor onboarding flow"]
      },
      {
        phase: "Phase 3: Provider & Listing Data Migration",
        duration: "Weeks 7–8",
        focus: "Export Sharetribe listing catalog, user accounts, and reviews into PostgreSQL.",
        deliverables: ["Data migration scripts", "Listing verification suite", "Merchant KYC transition"]
      },
      {
        phase: "Phase 4: Beta Launch & Merchant Verification",
        duration: "Weeks 9–10",
        focus: "Invite founding suppliers, run test transactions, perform final security audit, and go live.",
        deliverables: ["Production launch", "Full Git repository transfer", "Comprehensive architecture documentation"]
      }
    ],
    faqs: [
      {
        q: "Can we migrate our existing providers and listings from Sharetribe?",
        a: "Yes. We export your Sharetribe listing catalog, user accounts, and historical reviews, and migrate them cleanly to your custom Next.js + PostgreSQL platform without losing historical rankings."
      },
      {
        q: "How do Stripe Connect split payments work in custom software?",
        a: "We configure Stripe Connect Custom or Express accounts. When a customer pays, funds are automatically split: your platform commission is retained in your company bank account, while the net payment is transferred directly to the provider upon job completion."
      },
      {
        q: "Who pays for server hosting as our marketplace grows?",
        a: "You host the application on your own AWS, Vercel, or Supabase accounts. A marketplace handling hundreds of thousands of monthly visits typically costs $80–$250/month in serverless cloud infrastructure."
      }
    ],
    calculatorConfig: {
      mode: "gmv",
      currencySymbol: "£",
      defaultGmv: 1000000,
      minGmv: 100000,
      maxGmv: 5000000,
      competitorTakeRatePercent: 1.5,
      competitorMonthlyBasePlan: 399,
      bespokeBuildCost: 28000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1000
    },
    checklistItems: [
      {
        id: "st-prototype",
        question: "Are you a solo founder prototyping a standard rental concept with under £5k?",
        target: "competitor",
        description: "Sharetribe's no-code template is the fastest way to validate basic buyer/seller interest."
      },
      {
        id: "st-standard-booking",
        question: "Does your marketplace fit a conventional calendar-day or hourly booking model?",
        target: "competitor",
        description: "Standard property or equipment rentals work out of the box with zero custom code."
      },
      {
        id: "st-template",
        question: "Are you comfortable using standard pre-built responsive marketplace templates?",
        target: "competitor",
        description: "Avoids engineering spend when unique branding or bespoke UI is not a differentiator."
      },
      {
        id: "st-low-volume",
        question: "Is your annual transaction volume currently under £100k?",
        target: "competitor",
        description: "At low volumes, paying 1.5% take-rate is cheaper than funding a full custom build."
      },
      {
        id: "bespoke-splits",
        question: "Do you require complex multi-party payouts, escrow milestones, or custom dispute logic?",
        target: "bespoke",
        description: "Bespoke Stripe Connect Custom architecture handles automated split disbursements and holds."
      },
      {
        id: "bespoke-take-rate",
        question: "Is your marketplace scaling past £30k/mo where 1.5% take-rate wastes tens of thousands?",
        target: "bespoke",
        description: "0% platform take-rate: retain 100% of your commission margins with zero platform fees."
      },
      {
        id: "bespoke-3-sided",
        question: "Do you need tailored 3-sided experiences (Customer PWA, Provider mobile desk, Admin oversight)?",
        target: "bespoke",
        description: "Next.js 16 PWAs with offline camera capture, geofencing, and driver dispatch."
      },
      {
        id: "bespoke-ip-value",
        question: "Are you seeking venture capital or strategic acquisition that demands balance-sheet IP?",
        target: "bespoke",
        description: "Investors heavily discount marketplaces built on rented platforms where code cannot be ported."
      }
    ]
  },
  {
    slug: "bespoke-erp-vs-netsuite",
    competitorName: "Oracle NetSuite",
    category: "ERP & Operations",
    targetNiche: "Mid-Market Wholesale, Field Operations, Logistics & Multi-Location Service Providers",
    summary: "NetSuite is a powerhouse for large public corporations, but mid-market service businesses often find it overwhelmingly complex, requiring $50k+ implementation consultants and months of training for staff just to complete simple daily tasks.",
    pricingModel: "Base license ($999+/mo) + $120–$250/user/month + Mandatory annual support contracts + Expensive third-party implementation partners",
    typicalMonthlyExpense: "$3,500–$14,000 / month + $35,000–$75,000 upfront setup",
    competitorDrawbacks: [
      "High implementation failure rate and grueling 6–18 month rollout timelines before staff can use the tool.",
      "Complex 1990s-style user interface that causes high user error rates and requires extensive ongoing employee retraining.",
      "Massive annual contract renewals with rigid cancellation policies and automatic price escalations.",
      "Overengineered for mid-market service companies that need agile job dispatch rather than multi-subsidiary multinational consolidation."
    ],
    bespokeAdvantages: [
      "Streamlined UI tailored strictly to the tools and metrics your team uses daily—zero clutter.",
      "Shipped in 8–14 weeks with near-instant employee adoption and zero certified consultant fees.",
      "Seamless real-time synchronization with Xero, QuickBooks, Stripe, and modern cloud APIs.",
      "Zero per-seat licensing penalties: Give your entire warehouse, field crew, and management access."
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
        bespoke: "$1,200 – $3,600 / year (cloud hosting only)",
        competitorOrOffTheShelf: "$40,000 – $150,000+ / year in recurring licensing"
      },
      {
        dimension: "Customization Agility",
        bespoke: "Deploy workflow modifications in hours via standard Git",
        competitorOrOffTheShelf: "Expensive SuiteScript consultants on multi-week retainers"
      }
    ],
    migrationTimeline: "10 to 14 weeks",
    whoShouldSwitch: "Companies frustrated by bloated enterprise ERP quotes or seeking a purpose-built operational nerve center for their service workforce.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "$195,000+",
        competitorDetails: [
          "Base ERP license + 20 operational user seats ($3,200/mo = $115,200 over 3 yrs)",
          "$45,000 initial SuiteSuccess implementation partner fee",
          "$11,600/yr mandatory Oracle Silver/Gold support contracts ($34,800 over 3 yrs)"
        ],
        bespokeEstimate: "$38,200",
        bespokeDetails: [
          "$32,000 modular ERP build proposal (tailored inventory, dispatch, job billing)",
          "$150/mo cloud infrastructure & high-availability database ($5,400 over 3 yrs)",
          "$800 annual maintenance buffer ($2,400 over 3 yrs)"
        ],
        netDifference: "Save ~$156,800 (80% total cost reduction)"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "$340,000+",
        competitorDetails: [
          "NetSuite annual price indexation (typically 5–9% increase upon renewal)",
          "Additional user seats as company grows from 20 to 50 employees ($60,000/yr)",
          "Ongoing SuiteScript consulting retainers for workflow changes"
        ],
        bespokeEstimate: "$45,000",
        bespokeDetails: [
          "Owned proprietary software asset with zero license renewals",
          "Unlimited employee seats across all warehouse and field locations",
          "$180/mo scalable cloud hosting"
        ],
        netDifference: "Save ~$295,000 (86% total cost reduction)"
      }
    ],
    whenToChoose: [
      {
        scenario: "Multinational Enterprise with Public Stock Reporting (SOX)",
        recommendation: "competitor",
        rationale: "If your firm operates across 15+ countries, requires complex multi-currency ledger consolidation, and must pass Sarbanes-Oxley (SOX) compliance audits, NetSuite's established enterprise accounting engine is necessary."
      },
      {
        scenario: "Agile Mid-Market Operations & Service Dispatch",
        recommendation: "bespoke",
        rationale: "If your revenue is driven by rapid job dispatch, warehouse workflows, driver tracking, and custom field job sheets, bespoke software eliminates enterprise bloat and speeds up daily execution."
      },
      {
        scenario: "Low Staff Technical Literacy or High Turnover",
        recommendation: "bespoke",
        rationale: "NetSuite's complicated menus lead to data entry errors and long training cycles. A bespoke Next.js system designed specifically for your operators requires minutes of onboarding."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 modular operational dashboard with multi-role permissions (Dispatch, Warehouse, Finance, Executive)",
      backend: "High-performance TypeScript micro-actions with optimistic database state updates",
      database: "PostgreSQL with strict ACID transactional integrity for double-entry inventory locks and billing records",
      cloud: "Supabase Enterprise / AWS RDS with automated multi-region daily snapshots",
      integrations: ["Xero / QuickBooks Online (real-time reconciliation)", "ShipEngine / Freight Carrier APIs", "Stripe Corporate Payments", "Barcode Scanning / Zebra hardware integration"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Process Architecture & Ledger Alignment",
        duration: "Weeks 1–3",
        focus: "Map inventory SKUs, customer records, job dispatch flows, and chart of accounts.",
        deliverables: ["ERP workflow specifications", "Accounting integration design", "Master data cleanup plan"]
      },
      {
        phase: "Phase 2: Core Engine & Multi-Portal Development",
        duration: "Weeks 4–8",
        focus: "Develop custom inventory, job dispatch, technician mobile views, and invoicing modules.",
        deliverables: ["Working modular ERP staging", "Real-time accounting sync integration", "Field technician mobile view"]
      },
      {
        phase: "Phase 3: Data Migration & Accounting Reconciliation",
        duration: "Weeks 9–11",
        focus: "Verify historical ledger integrity, check opening trial balances, and run stress tests.",
        deliverables: ["Data verification reports", "End-to-end reconciliation audit", "User acceptance testing sign-off"]
      },
      {
        phase: "Phase 4: Phased Deployment & Team Onboarding",
        duration: "Weeks 12–14",
        focus: "Department-by-department rollout, role-tailored team training, and live production cutover.",
        deliverables: ["Live production deployment", "Complete source code transfer", "Ongoing maintenance documentation"]
      }
    ],
    faqs: [
      {
        q: "How does bespoke ERP connect with our existing accounting software?",
        a: "We integrate directly with Xero, QuickBooks, or Sage via modern APIs, syncing sales invoices, purchase orders, inventory valuations, and bank reconciliation in real time without manual re-keying."
      },
      {
        q: "Can warehouse staff use handheld barcode scanners with custom ERP?",
        a: "Yes. Our web interfaces support direct camera scanning or hardware Bluetooth/USB barcode scanners (Zebra, Honeywell), updating inventory counts and dispatch statuses instantly."
      },
      {
        q: "What happens if our business processes change next year?",
        a: "Because you own 100% of the TypeScript codebase, any modern React/Node developer can adjust rules, add modules, or integrate new partners in days without paying NetSuite consultant rates."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "$",
      defaultSeats: 20,
      minSeats: 10,
      maxSeats: 100,
      tiers: [
        {
          name: "NetSuite Mid-Market ($120/seat)",
          monthlyPerSeat: 120,
          description: "Operational user license for dispatch, warehouse & purchasing"
        },
        {
          name: "NetSuite Premium ($250/seat)",
          monthlyPerSeat: 250,
          description: "Full accounting, manufacturing & multi-entity access"
        }
      ],
      competitorBaseMonthly: 999,
      competitorOnboardingFee: 45000,
      competitorSupportAnnual: 11600,
      bespokeBuildCost: 32000,
      bespokeMonthlyHosting: 150,
      bespokeAnnualMaintenance: 1200
    },
    checklistItems: [
      {
        id: "ns-sox",
        question: "Is your firm a multi-national corporation requiring SOX compliance & multi-currency ledgers?",
        target: "competitor",
        description: "NetSuite's core financial engine excels at multi-subsidiary global statutory consolidation."
      },
      {
        id: "ns-finance",
        question: "Does your company have an established corporate finance team trained on NetSuite?",
        target: "competitor",
        description: "Enterprise controllers often mandate proven ERP platforms for audited financial statements."
      },
      {
        id: "ns-budget",
        question: "Does your budget accommodate a $40k–$75k upfront SuiteSuccess partner fee?",
        target: "competitor",
        description: "NetSuite rollouts require certified implementation partners to configure custom workflows."
      },
      {
        id: "ns-timeline",
        question: "Can your organization tolerate an 8–18 month enterprise rollout cycle?",
        target: "competitor",
        description: "Complex ERP deployments require extended change management and team training."
      },
      {
        id: "bespoke-agile",
        question: "Is daily revenue driven by rapid job dispatch, warehouse manifests, and field crew workflows?",
        target: "bespoke",
        description: "Bespoke software eliminates 1990s enterprise menu clutter and accelerates operator execution."
      },
      {
        id: "bespoke-velocity",
        question: "Do you need a live, operational nerve center launched in 8–12 weeks instead of 18 months?",
        target: "bespoke",
        description: "Fixed-scope agile delivery gets working software into your operators' hands fast."
      },
      {
        id: "bespoke-integrations",
        question: "Do you need real-time API sync with modern platforms (Xero, Stripe, ShipEngine, Zebra scanners)?",
        target: "bespoke",
        description: "Connect warehouse scanners and modern accounting APIs directly without expensive SuiteScripts."
      },
      {
        id: "bespoke-seat-freedom",
        question: "Do you want your entire warehouse, field crew, and management on one system without seat penalties?",
        target: "bespoke",
        description: "Give 100+ team members role-tailored dashboards at £0 incremental software license fees."
      }
    ]
  },
  {
    slug: "custom-software-vs-bubble-no-code",
    competitorName: "Bubble & No-Code Tools",
    category: "No-Code / Low-Code",
    targetNiche: "Startups, SaaS Founders & Scaling Operations Teams",
    summary: "Bubble is great for launching a prototype over a weekend, but as soon as you hit real user concurrency, complex database queries, or institutional compliance audits, performance collapses and workload unit pricing skyrockets.",
    pricingModel: "Workload Units (WU) usage-based tiers ($32–$399/mo base + $0.30 per 1k extra WU + steep dedicated server tiers at $2k–$5k/mo)",
    typicalMonthlyExpense: "$300–$3,500 / month (with high risk of sudden usage spikes)",
    competitorDrawbacks: [
      "Severe performance bottlenecks with large relational datasets, causing multi-second page loads that frustrate users.",
      "Unpredictable workload unit (WU) pricing that spikes unexpectedly when running background calculations or data imports.",
      "Vendor lock-in: You cannot export Bubble code to run on standard AWS, Google Cloud, or Vercel infrastructure.",
      "Security and compliance limitations that cause failures during enterprise or government IT due diligence."
    ],
    bespokeAdvantages: [
      "Pure, production-grade Next.js 16 + PostgreSQL: Sub-second load times and infinite horizontal scalability.",
      "Predictable serverless cloud costs that don't penalize your database size or concurrent user spikes.",
      "Complete code portability: Host on Vercel, AWS, Supabase, or private on-prem servers with full Git version control.",
      "Enterprise security with Row Level Security (RLS), automated audit logging, and full GDPR compliance."
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
      },
      {
        dimension: "Cost Predictability",
        bespoke: "Flat serverless hosting ($50–$150/mo) regardless of queries",
        competitorOrOffTheShelf: "Surprise Workload Unit bills during heavy usage"
      }
    ],
    migrationTimeline: "4 to 8 weeks",
    whoShouldSwitch: "Founders whose Bubble apps are getting slow, facing steep workload bills, or preparing for institutional funding/enterprise customer onboarding.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "$52,000+",
        competitorDetails: [
          "Bubble Production / Team plan ($399/mo base = $14,364 over 3 yrs)",
          "Workload Unit overages on growing active user base ($600/mo = $21,600 over 3 yrs)",
          "Specialized Bubble developer retainers to optimize bloated visual workflows ($16,000)"
        ],
        bespokeEstimate: "$28,600",
        bespokeDetails: [
          "$25,000 fixed milestone rebuild proposal (Next.js 16 + PostgreSQL)",
          "$100/mo predictable hosting on Vercel & Supabase ($3,600 over 3 yrs)",
          "Zero workload unit charges or artificial database query penalties"
        ],
        netDifference: "Save ~$23,400 + gain institutional-grade code ownership"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "$110,000+",
        competitorDetails: [
          "Forced upgrade to Bubble Dedicated Instance ($1,500–$3,000/mo) to solve database latency",
          "Constant firefighting of plugin incompatibilities after Bubble core updates",
          "Diminished company valuation due to tech debt and platform dependency"
        ],
        bespokeEstimate: "$34,000",
        bespokeDetails: [
          "Clean, maintainable TypeScript codebase that any senior React engineer can extend",
          "Predictable serverless infrastructure scaling to hundreds of thousands of users",
          "Valuable proprietary intellectual property asset on your company balance sheet"
        ],
        netDifference: "Save ~$76,000+ while eliminating technical debt"
      }
    ],
    whenToChoose: [
      {
        scenario: "Solo Non-Technical Founder Prototyping Over a Weekend",
        recommendation: "competitor",
        rationale: "If you have zero coding experience and want to test a concept with 20 beta users without hiring engineers, Bubble's visual drag-and-drop editor is ideal."
      },
      {
        scenario: "Scalable SaaS Application with Concurrent Users",
        recommendation: "bespoke",
        rationale: "As soon as multiple users perform simultaneous database searches, exports, or transactions, standard Next.js + PostgreSQL architecture delivers 10x faster response times."
      },
      {
        scenario: "Enterprise Sales, SOC2 Audits & Tech Due Diligence",
        recommendation: "bespoke",
        rationale: "Institutional investors and corporate clients demand proof of proprietary code ownership, database audit logs, and independent hosting capabilities."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 with React 19, Tailwind CSS, and zero third-party plugin bloat",
      backend: "Next.js Route Handlers and Server Actions with strict Zod TypeScript validation",
      database: "PostgreSQL on Supabase with direct SQL indexing, foreign keys, and Row Level Security",
      cloud: "Vercel / AWS Amplify with global edge distribution",
      integrations: ["Stripe Checkout & Billing", "Resend Transactional Email", "Sentry Error Monitoring", "PostHog Analytics"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Schema Re-Architecture & Data Audit",
        duration: "Weeks 1–2",
        focus: "Extract Bubble data types, normalize relational schema into clean PostgreSQL tables.",
        deliverables: ["Relational ERD diagram", "API contract documentation", "Database export plan"]
      },
      {
        phase: "Phase 2: Production UI & Logic Re-Implementation",
        duration: "Weeks 3–5",
        focus: "Rebuild visual workflows in modern TypeScript & React with sub-second page performance.",
        deliverables: ["Full Next.js responsive application staging", "Optimized SQL queries", "Zero plugin dependency"]
      },
      {
        phase: "Phase 3: Data Migration & User Password Transition",
        duration: "Weeks 6–7",
        focus: "Secure CSV/API data import with seamless password resets for existing accounts.",
        deliverables: ["Complete data reconciliation", "Automated user migration triggers", "Security review"]
      },
      {
        phase: "Phase 4: DNS Switch & Performance Benchmarking",
        duration: "Week 8",
        focus: "Transition domain, verify sub-second load times, and decommission Bubble subscription.",
        deliverables: ["Live production switchover", "100% Git repository transfer", "Zero ongoing Bubble fees"]
      }
    ],
    faqs: [
      {
        q: "Can you rebuild our existing Bubble app in Next.js without losing data?",
        a: "Yes. We export your Bubble database via CSV or API, design an optimized PostgreSQL schema, and recreate your application in Next.js with superior speed, mobile responsiveness, and reliability."
      },
      {
        q: "How will our existing users log in after the migration?",
        a: "Because Bubble encrypts passwords with proprietary salts, we implement a seamless magic-link or one-time password reset email on their first login, securely updating their credentials to modern bcrypt/Argon2 hashes."
      },
      {
        q: "Is Next.js cheaper to host than Bubble's workload unit pricing?",
        a: "Yes. A Next.js application on Vercel paired with a Supabase PostgreSQL database typically costs $20–$100/month in total cloud hosting, regardless of how many database queries or background jobs your users run."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "$",
      defaultSeats: 15,
      minSeats: 5,
      maxSeats: 80,
      tiers: [
        {
          name: "Team Plan + Usage ($45/user equiv)",
          monthlyPerSeat: 45,
          description: "Base subscription plus expected workload unit (WU) consumption"
        },
        {
          name: "Dedicated Instance ($135/user equiv)",
          monthlyPerSeat: 135,
          description: "Dedicated server tiers ($2,000–$4,000/mo) required for high database concurrency"
        }
      ],
      competitorBaseMonthly: 399,
      competitorOnboardingFee: 6000,
      competitorSupportAnnual: 4000,
      bespokeBuildCost: 24000,
      bespokeMonthlyHosting: 80,
      bespokeAnnualMaintenance: 800
    },
    checklistItems: [
      {
        id: "bubble-weekend",
        question: "Are you a non-technical founder prototyping a concept over a weekend with no budget?",
        target: "competitor",
        description: "Bubble's visual drag-and-drop editor allows rapid MVP validation without hiring engineers."
      },
      {
        id: "bubble-concurrency",
        question: "Is your app primarily used by few concurrent users where multi-second latency is fine?",
        target: "competitor",
        description: "Internal tools with low database complexity perform acceptably on no-code engines."
      },
      {
        id: "bubble-fluid-scope",
        question: "Are your core product requirements still changing daily during initial ideation?",
        target: "competitor",
        description: "Visual builders let founders rapidly tweak UI layouts before locking down architecture."
      },
      {
        id: "bubble-hobby",
        question: "Is the project a side-project with no strict institutional compliance requirements?",
        target: "competitor",
        description: "Avoids upfront engineering investment when enterprise security is not a factor."
      },
      {
        id: "bespoke-wu-costs",
        question: "Are unpredictable Workload Unit (WU) invoice spikes making software costs unmanageable?",
        target: "bespoke",
        description: "Flat, predictable serverless hosting ($50–$150/mo) regardless of complex background SQL queries."
      },
      {
        id: "bespoke-speed",
        question: "Are users experiencing database latency, query bottlenecks, or slow visual page loads?",
        target: "bespoke",
        description: "Sub-second Next.js 16 + PostgreSQL queries with native database indexing and edge caching."
      },
      {
        id: "bespoke-due-diligence",
        question: "Are enterprise clients or institutional investors demanding SOC2, GDPR, and code ownership?",
        target: "bespoke",
        description: "100% clean TypeScript code hosted on your own GitHub and AWS/Vercel cloud accounts."
      },
      {
        id: "bespoke-portability",
        question: "Do you want complete platform independence with zero vendor lock-in?",
        target: "bespoke",
        description: "Own your code outright: any React/Node engineer can extend it without proprietary visual tools."
      }
    ]
  },
  {
    slug: "custom-crm-vs-zoho",
    competitorName: "Zoho CRM",
    category: "CRM",
    targetNiche: "Mid-Market Field Services, Contracting & Relational B2B Operations",
    summary: "Zoho CRM is frequently chosen as a budget alternative to Salesforce, but businesses quickly encounter messy Deluge scripting, disconnected modular silos, sluggish page loads, and fragile third-party integrations that slow down operations.",
    pricingModel: "Per-seat monthly subscription ($20–$52/user/mo) + Zoho One add-on apps + Third-party Deluge developer fees",
    typicalMonthlyExpense: "$900–$3,200 / month (for 20–50 seats) + ongoing script maintenance",
    competitorDrawbacks: [
      "Fragmented suite architecture: Zoho Books, Desk, CRM, and Creator operate on separate databases requiring complex sync rules that frequently desynchronize.",
      "Proprietary Deluge programming language: Difficult to find competent engineers, creating developer lock-in for simple workflow changes.",
      "Sluggish UI with multi-second load times that frustrates dispatchers, call operators, and field engineers.",
      "Rigid role permissions that require expensive Creator licenses just to grant external contractors limited job visibility."
    ],
    bespokeAdvantages: [
      "Unified PostgreSQL database: Single source of truth for leads, job tickets, dispatch routes, invoices, and certificates.",
      "Zero monthly seat licensing fees: Add 25, 100, or 500 team members and field technicians with £0 marginal software cost.",
      "Modern Next.js 16 App Router interface: Instantaneous sub-second page transitions optimized for high-volume dispatch.",
      "Complete IP and codebase ownership: Hosted on dedicated serverless infrastructure you control directly."
    ],
    featureMatrix: [
      {
        dimension: "Per-User Monthly Cost",
        bespoke: "£0 / user / month (One-time build, minimal cloud hosting)",
        competitorOrOffTheShelf: "£20 – £52 / user / month (Zoho Enterprise or Zoho One)"
      },
      {
        dimension: "Database Architecture",
        bespoke: "Relational PostgreSQL on Supabase with ACID transactions & instant queries",
        competitorOrOffTheShelf: "Siloed Zoho proprietary schema with API rate limits & sync lag"
      },
      {
        dimension: "Custom Scripting & Maintainability",
        bespoke: "100% standard TypeScript/React code on your private GitHub repository",
        competitorOrOffTheShelf: "Proprietary Zoho Deluge scripting language with limited testing tooling"
      },
      {
        dimension: "Subcontractor & Client Portals",
        bespoke: "Unlimited branded client and contractor portals at zero extra cost",
        competitorOrOffTheShelf: "Requires expensive Zoho Creator or Portal add-on licenses"
      },
      {
        dimension: "System Speed & Polish",
        bespoke: "Sub-second Next.js interface tailored precisely to daily operator workflows",
        competitorOrOffTheShelf: "Heavy multi-module enterprise dashboard with noticeable latency"
      }
    ],
    migrationTimeline: "6 to 8 weeks from initial technical mapping to production rollout",
    whoShouldSwitch: "Growing service, maintenance, or logistics companies spending £800+/month on Zoho licenses who feel constrained by Deluge scripting and syncing bugs between Zoho apps.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "£48,600+",
        competitorDetails: [
          "30 users @ £40/user/mo Zoho Enterprise (£14,400/yr = £43,200 over 3 yrs)",
          "£5,400 initial Zoho consulting partner setup & Deluge workflow integration"
        ],
        bespokeEstimate: "£27,600",
        bespokeDetails: [
          "£24,000 fixed milestone build proposal (custom CRM, portal & automated billing)",
          "£100/mo serverless cloud hosting & database backups (£3,600 over 3 yrs)"
        ],
        netDifference: "Save ~£21,000 (43% cost reduction) + eliminate Deluge dependency"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "£91,200+",
        competitorDetails: [
          "Headcount expansion to 45 users (£21,600/yr = £64,800 over final 3 yrs)",
          "Ongoing Deluge developer retainers for workflow patches (£3,600/yr)"
        ],
        bespokeEstimate: "£32,000",
        bespokeDetails: [
          "Core software asset 100% amortized; zero per-seat penalty as team grows to 45+",
          "£120/mo scalable cloud hosting"
        ],
        netDifference: "Save ~£59,200 (65% cost reduction)"
      }
    ],
    whenToChoose: [
      {
        scenario: "Budget Solopreneur or Micro-Team (< 5 Staff)",
        recommendation: "competitor",
        rationale: "If you have fewer than 5 people and basic contact management needs, Zoho's entry-tier plans offer cheap out-of-the-box utility before workflow friction appears."
      },
      {
        scenario: "Heavy Dependency on the Complete Zoho 40+ App Suite",
        recommendation: "competitor",
        rationale: "If your company already runs Zoho Mail, Zoho Cliq, Zoho People, and Zoho Inventory and doesn't mind the Deluge scripting quirks, staying in their walled garden may be convenient."
      },
      {
        scenario: "Specialized Field Operations & Multi-Step Job Workflows",
        recommendation: "bespoke",
        rationale: "When jobs require real-time dispatch, equipment telemetry, vehicle tracking, or custom compliance certifications, purpose-built PostgreSQL architecture radically outperforms Zoho."
      },
      {
        scenario: "Fast-Growing Operational Headcount",
        recommendation: "bespoke",
        rationale: "Bespoke eliminates the per-seat growth tax. Onboard 50 field operatives or 200 external subcontractors without paying an extra penny in monthly software licenses."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 (App Router) with Tailwind CSS and role-tailored dispatcher dashboards",
      backend: "Next.js Server Actions with strict TypeScript schema validation",
      database: "PostgreSQL on Supabase with Row Level Security (RLS) & daily WAL point-in-time recovery",
      cloud: "Vercel / AWS with Cloudflare enterprise DDoS protection and edge caching",
      integrations: ["Xero / QuickBooks Online", "Stripe Invoicing & Billing", "Twilio SMS Dispatch", "SendGrid Email", "DocuSign / Custom PDF Generation"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Workflow Audit & Schema Design",
        duration: "Weeks 1–2",
        focus: "Audit current Zoho CRM modules, custom Deluge scripts, and Xero/accounting links.",
        deliverables: ["Entity relationship diagram (ERD)", "API sync specification", "Data deduplication plan"]
      },
      {
        phase: "Phase 2: Bespoke UI & Operations Engine",
        duration: "Weeks 3–4",
        focus: "Build high-speed Next.js interfaces for dispatchers, managers, and mobile field staff.",
        deliverables: ["Staging environment access", "Role-based permission matrix", "Client portal preview"]
      },
      {
        phase: "Phase 3: Data ETL & Verification Sandbox",
        duration: "Weeks 5–6",
        focus: "Export Zoho module data, clean historical contacts, and import into PostgreSQL.",
        deliverables: ["Automated migration scripts", "Reconciliation verification report", "Staff training sessions"]
      },
      {
        phase: "Phase 4: Production Cutover",
        duration: "Weeks 7–8",
        focus: "Parallel run, zero-downtime cutover, Zoho cancellation handover, and full source code transfer.",
        deliverables: ["Live production deployment", "Full GitHub code repository ownership", "30-day warranty support"]
      }
    ],
    faqs: [
      {
        q: "Why do companies outgrow Zoho CRM?",
        a: "Most businesses outgrow Zoho because of syncing delays between disparate Zoho modules, slow page loading, and the difficulty of finding reliable developers who write proprietary Deluge code."
      },
      {
        q: "Can we migrate our historical Zoho customer records and deals?",
        a: "Yes. We extract all accounts, contacts, opportunities, and activities from Zoho via API or CSV exports, sanitize the relational data, and import it into your clean PostgreSQL database with zero data loss."
      },
      {
        q: "How does bespoke software eliminate monthly license fees?",
        a: "Instead of renting software by user seat, a custom CRM is an intellectual property asset built on open modern frameworks (Next.js & PostgreSQL). You only pay minimal cloud server costs (typically £50–£120/mo)."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "£",
      defaultSeats: 25,
      minSeats: 5,
      maxSeats: 100,
      tiers: [
        {
          name: "Zoho Professional (£28/seat)",
          monthlyPerSeat: 28,
          description: "Standard CRM, blueprint workflows & inventory"
        },
        {
          name: "Zoho Enterprise (£40/seat)",
          monthlyPerSeat: 40,
          description: "Advanced customization, multi-user portals & Zia AI"
        },
        {
          name: "Zoho One Enterprise (£52/seat)",
          monthlyPerSeat: 52,
          description: "Full suite bundle with Books, Desk & Creator modules"
        }
      ],
      competitorOnboardingFee: 5000,
      competitorSupportAnnual: 2000,
      bespokeBuildCost: 24000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1000
    },
    checklistItems: [
      {
        id: "zoho-budget-team",
        question: "Is your team under 5 people with minimal operational complexity?",
        target: "competitor",
        description: "Small teams can utilize basic out-of-the-box Zoho modules at modest initial cost."
      },
      {
        id: "zoho-suite-bundle",
        question: "Does your company already use 10+ different Zoho applications daily?",
        target: "competitor",
        description: "If your operations are already deeply coupled with Zoho's native ecosystem, switching may require broader planning."
      },
      {
        id: "zoho-deluge-friction",
        question: "Are buggy Deluge scripts or sync errors between Zoho modules causing operational delays?",
        target: "bespoke",
        description: "Replace fragile scripts with unified TypeScript Server Actions and relational PostgreSQL integrity."
      },
      {
        id: "zoho-speed-frustration",
        question: "Are staff complaining about sluggish page loads and clunky menus during busy hours?",
        target: "bespoke",
        description: "Modern Next.js 16 provides sub-second page rendering and ultra-responsive mobile dashboards."
      },
      {
        id: "zoho-field-portals",
        question: "Do you need customized portals for clients, contractors, or mobile engineers?",
        target: "bespoke",
        description: "Deploy branded self-service portals with unlimited logins at £0 incremental software fee."
      },
      {
        id: "zoho-license-tax",
        question: "Is paying £28–£52 per user per month penalizing your headcount expansion?",
        target: "bespoke",
        description: "Eliminate recurring seat licenses forever and build an owned corporate software asset."
      }
    ]
  },
  {
    slug: "custom-crm-vs-monday",
    competitorName: "Monday.com CRM",
    category: "CRM",
    targetNiche: "Fast-Paced Service Agencies, Project Firms & Operations Teams",
    summary: "Monday.com Sales CRM provides colorful Kanban boards and quick visual setups, but growing operational businesses frequently hit strict monthly automation caps, sluggish board loading at 10,000+ items, and an inability to model true relational databases.",
    pricingModel: "Per-seat monthly subscription ($14–$28/user/mo, 3-seat minimum) + Strict automation action tiers + Enterprise governance charges",
    typicalMonthlyExpense: "$700–$2,800 / month (escalating with user seats and automation limits)",
    competitorDrawbacks: [
      "Strict monthly automation & integration caps: Exceeding your plan's actions shuts down critical workflows until you upgrade.",
      "Spreadsheet-board architecture: Not a true relational SQL database; multi-board lookups and cross-entity rollups become sluggish and fragile.",
      "3-seat minimum purchase increments: Inflexible seat purchasing that forces you to pay for unused licenses.",
      "Restricted client access: External guest accounts face strict view/edit limitations unless upgraded to paid user seats."
    ],
    bespokeAdvantages: [
      "True Relational SQL Database: PostgreSQL handles millions of rows, complex joins, and instant audits with zero slowdown.",
      "Unlimited automations & webhook triggers: Trigger infinite email sequences, dispatch alerts, and Xero syncs with zero action billing.",
      "100% custom operational portals: Give clients, contractors, and field staff bespoke interfaces tailored to their exact job roles.",
      "Fixed cost ownership: Own the complete source code, host on serverless infrastructure, and eliminate recurring per-seat inflation."
    ],
    featureMatrix: [
      {
        dimension: "Per-User Monthly Cost",
        bespoke: "£0 / user / month (Fixed milestone build proposal)",
        competitorOrOffTheShelf: "£14 – £28 / user / month (Monday Standard or Pro CRM)"
      },
      {
        dimension: "Automation & Integration Caps",
        bespoke: "Unlimited automated background actions & webhook events",
        competitorOrOffTheShelf: "Strict monthly limits (e.g. 250 to 25,000 actions/mo) with hard shutoffs"
      },
      {
        dimension: "Data Model Architecture",
        bespoke: "PostgreSQL on Supabase with ACID transactions & full relational joins",
        competitorOrOffTheShelf: "Proprietary board/column structure with performance degradation past 10k items"
      },
      {
        dimension: "External Client & Contractor Access",
        bespoke: "Unlimited branded self-service client portals & contractor logins",
        competitorOrOffTheShelf: "Strict guest permissions; full access requires paid seat upgrades"
      },
      {
        dimension: "Source Code Ownership",
        bespoke: "100% proprietary code ownership deployed to your private cloud",
        competitorOrOffTheShelf: "100% vendor lock-in governed by Monday.com SaaS terms"
      }
    ],
    migrationTimeline: "6 to 8 weeks from data mapping to production deployment",
    whoShouldSwitch: "Businesses hitting Monday.com automation caps, struggling with slow board loads, or needing custom relational workflows that spreadsheet boards cannot support.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "£36,200+",
        competitorDetails: [
          "25 users @ £24/user/mo Pro CRM tier (£7,200/yr = £21,600 over 3 yrs)",
          "Automation limit top-ups & premium integration add-ons (£3,600/yr = £10,800)",
          "Initial onboarding & consultant board configuration (£3,800)"
        ],
        bespokeEstimate: "£26,600",
        bespokeDetails: [
          "£23,000 fixed milestone build proposal (custom CRM & client portal)",
          "£100/mo cloud hosting on Vercel & Supabase (£3,600 over 3 yrs)"
        ],
        netDifference: "Save ~£9,600 (26% savings) + remove all monthly automation action limits"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "£72,000+",
        competitorDetails: [
          "Headcount expansion to 40 users (£11,520/yr)",
          "Escalating automation action overages as transaction volume triples",
          "Mandatory Enterprise tier upgrade for security & audit requirements"
        ],
        bespokeEstimate: "£31,000",
        bespokeDetails: [
          "Core software asset 100% owned; zero seat licensing penalties as team scales to 40+",
          "£120/mo serverless cloud hosting"
        ],
        netDifference: "Save ~£41,000 (57% long-term savings)"
      }
    ],
    whenToChoose: [
      {
        scenario: "Lightweight Task & Project Management (< 100 Deals/mo)",
        recommendation: "competitor",
        rationale: "If your workflow is primarily internal project coordination with modest deal volume, Monday's visual Kanban boards are simple and fast to configure."
      },
      {
        scenario: "Non-Technical Team Needing No-Code Drag-and-Drop Changes",
        recommendation: "competitor",
        rationale: "Monday allows non-technical managers to create new visual status columns and boards in minutes without writing code."
      },
      {
        scenario: "High-Volume Transaction Automation & Webhook Pipelines",
        recommendation: "bespoke",
        rationale: "If you run thousands of monthly quote calculations, automated dispatch notifications, and accounting syncs, Monday's action caps become a costly administrative bottleneck."
      },
      {
        scenario: "Complex Relational Data & Large Historic Datasets",
        recommendation: "bespoke",
        rationale: "When dealing with multi-location properties, complex supply inventories, or multi-party contracts, true PostgreSQL relational schema vastly outperforms Monday boards."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 (App Router) with Tailwind CSS and role-tailored dispatcher dashboards",
      backend: "Next.js Server Actions with strict TypeScript schema validation",
      database: "PostgreSQL on Supabase with Row Level Security (RLS) & daily WAL point-in-time recovery",
      cloud: "Vercel / AWS with Cloudflare enterprise DDoS protection and edge caching",
      integrations: ["Xero / QuickBooks Online", "Stripe Invoicing & Billing", "Twilio SMS Dispatch", "SendGrid Email", "DocuSign / Custom PDF Generation"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Board Structure & Relational Modeling",
        duration: "Weeks 1–2",
        focus: "Convert Monday.com flat boards and mirror columns into normalized SQL relational tables.",
        deliverables: ["Database ERD", "Workflow mapping specification", "Automation inventory audit"]
      },
      {
        phase: "Phase 2: Custom Operations Dashboard Build",
        duration: "Weeks 3–4",
        focus: "Develop custom Next.js operational views, Kanban boards, and role-based permissions.",
        deliverables: ["Interactive staging preview", "Mobile-optimized views", "Real-time webhook handlers"]
      },
      {
        phase: "Phase 3: Board Data ETL & Testing",
        duration: "Weeks 5–6",
        focus: "Extract Monday board items, status logs, and attached files into Supabase PostgreSQL.",
        deliverables: ["Migration scripts", "Historical record audit", "User acceptance validation"]
      },
      {
        phase: "Phase 4: Seamless Cutover & Code Transfer",
        duration: "Weeks 7–8",
        focus: "Live cutover, team onboarding, and complete source code repository handover.",
        deliverables: ["Production launch", "Full GitHub repository access", "30-day post-launch warranty"]
      }
    ],
    faqs: [
      {
        q: "Why do growing companies hit bottlenecks with Monday.com CRM?",
        a: "Monday is fundamentally built on a board/spreadsheet architecture. When datasets exceed 10,000 items or require complex relational joins between customers, jobs, vehicles, and invoices, boards slow down significantly and monthly automation action caps trigger costly upgrades."
      },
      {
        q: "How does bespoke software handle automations differently than Monday?",
        a: "Unlike Monday which charges based on monthly automation action limits (e.g. 250 to 25,000 actions), bespoke software uses serverless event-driven functions running on your cloud infrastructure with unlimited triggers at zero marginal cost."
      },
      {
        q: "Can we still have visual Kanban pipeline views in a custom CRM?",
        a: "Yes. We engineer intuitive, high-performance drag-and-drop Kanban boards using modern React and Tailwind CSS, giving you the visual ease of Monday with the underlying power and speed of PostgreSQL."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "£",
      defaultSeats: 20,
      minSeats: 3,
      maxSeats: 80,
      tiers: [
        {
          name: "Monday Standard CRM (£14/seat)",
          monthlyPerSeat: 14,
          description: "Basic pipeline management & 250 automations/mo"
        },
        {
          name: "Monday Pro CRM (£24/seat)",
          monthlyPerSeat: 24,
          description: "Sales forecasting, mass email & 25,000 automations/mo"
        },
        {
          name: "Monday Enterprise CRM (£38/seat)",
          monthlyPerSeat: 38,
          description: "Enterprise governance, audit logs & tailored onboarding"
        }
      ],
      competitorOnboardingFee: 3500,
      competitorSupportAnnual: 1500,
      bespokeBuildCost: 23000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1000
    },
    checklistItems: [
      {
        id: "monday-small-pipeline",
        question: "Is your pipeline modest (< 50 active deals/mo) with simple single-stage tracking?",
        target: "competitor",
        description: "Monday's visual boards are quick to configure for light internal sales tracking."
      },
      {
        id: "monday-no-code-layout",
        question: "Do non-technical managers need to add new visual columns without engineering help?",
        target: "competitor",
        description: "Monday allows rapid layout changes via drag-and-drop interfaces."
      },
      {
        id: "monday-automation-caps",
        question: "Are strict monthly automation action limits restricting your email, SMS, or dispatch triggers?",
        target: "bespoke",
        description: "Bespoke systems execute unlimited automated workflows with zero action-based billing."
      },
      {
        id: "monday-board-lag",
        question: "Are large boards (5,000+ items) experiencing lag, broken mirror columns, or sync delays?",
        target: "bespoke",
        description: "PostgreSQL databases easily handle millions of rows with millisecond query speeds."
      },
      {
        id: "monday-relational-data",
        question: "Does your workflow require relational joins across jobs, equipment, inventory, and invoices?",
        target: "bespoke",
        description: "True relational databases avoid fragile cross-board mirror column dependencies."
      },
      {
        id: "monday-guest-restrictions",
        question: "Do you need customized portals for clients or contractors with role-specific views?",
        target: "bespoke",
        description: "Provide unlimited client and contractor portal logins at £0 extra seat licensing cost."
      }
    ]
  },
  {
    slug: "custom-crm-vs-pipedrive",
    competitorName: "Pipedrive",
    category: "CRM",
    targetNiche: "B2B Sales Teams, Field Service Companies & Consultancies",
    summary: "Pipedrive is renowned for clean, visual sales deal tracking, but when service businesses need operational job dispatch, inventory tracking, custom client portals, or multi-role permission hierarchies, Pipedrive requires an expensive patchwork of add-ons.",
    pricingModel: "Per-seat monthly subscription ($14–$99/user/mo) + Add-ons (LeadBooster $32.50/mo, Projects $6.70/user/mo, Smart Docs)",
    typicalMonthlyExpense: "$600–$2,400 / month (escalating with add-ons and seat growth)",
    competitorDrawbacks: [
      "Strict sales pipeline limitation: Pipedrive is engineered for winning deals, not fulfilling jobs, managing inventory, or scheduling mobile technicians.",
      "Costly modular add-on pricing: Essential capabilities like LeadBooster, web forms, and document tracking require extra monthly subscription add-ons.",
      "Lack of client self-service portals: No native mechanism for external customers to log in, review quotes, or download certificates.",
      "Rigid permission controls: Granular role-based security is locked behind expensive Power and Enterprise tiers ($64–$99/user/mo)."
    ],
    bespokeAdvantages: [
      "End-to-End Operational Lifecycle: Unifies lead acquisition $\rightarrow$ quotation $\rightarrow$ dispatch $\rightarrow$ fulfillment $\rightarrow$ invoicing in one platform.",
      "Zero per-seat licensing fees: Add your entire sales, operational, and field workforce at zero marginal software cost.",
      "Dedicated Client & Partner Portals: Branded client self-service for instant job tracking, digital approvals, and invoice payments.",
      "100% intellectual property ownership: Build an owned corporate software asset that adds tangible balance sheet valuation."
    ],
    featureMatrix: [
      {
        dimension: "Per-User Monthly Cost",
        bespoke: "£0 / user / month (Fixed milestone build proposal)",
        competitorOrOffTheShelf: "£14 – £99 / user / month + paid modular add-ons"
      },
      {
        dimension: "Operational Scope",
        bespoke: "Full end-to-end lifecycle (Leads, Dispatch, Inventory, Certificates, Invoicing)",
        competitorOrOffTheShelf: "Strictly deal stage management; requires third-party tools for fulfillment"
      },
      {
        dimension: "Client & Subcontractor Portals",
        bespoke: "Unlimited branded client self-service portals & contractor logins",
        competitorOrOffTheShelf: "No native client portal support; requires expensive third-party plugins"
      },
      {
        dimension: "Accounting & ERP Integration",
        bespoke: "Direct two-way synchronization with Xero, Stripe, and custom payment gateways",
        competitorOrOffTheShelf: "Basic sync via third-party marketplace connectors with sync rate limits"
      },
      {
        dimension: "Code & Data Ownership",
        bespoke: "100% proprietary code ownership with dedicated PostgreSQL database",
        competitorOrOffTheShelf: "100% rented SaaS with vendor lock-in"
      }
    ],
    migrationTimeline: "6 to 8 weeks from discovery to production launch",
    whoShouldSwitch: "Service and consulting companies using Pipedrive for sales who are forced to use disconnected spreadsheets or tools for fulfillment, client portals, and job dispatch.",
    tcoModels: [
      {
        timeline: "3-Year Total Cost of Ownership",
        competitorEstimate: "£34,800+",
        competitorDetails: [
          "20 users @ £34/user/mo Professional tier (£8,160/yr = £24,480 over 3 yrs)",
          "LeadBooster + Web Visitors + Projects add-on suite (£1,800/yr = £5,400 over 3 yrs)",
          "Third-party portal and integration subscription plugins (£1,640/yr = £4,920)"
        ],
        bespokeEstimate: "£25,600",
        bespokeDetails: [
          "£22,000 fixed milestone build proposal (custom CRM, dispatch & client portal)",
          "£100/mo cloud hosting on Vercel & Supabase (£3,600 over 3 yrs)"
        ],
        netDifference: "Save ~£9,200 (26% savings) + unify sales & operations into one app"
      },
      {
        timeline: "5-Year Total Cost of Ownership",
        competitorEstimate: "£68,400+",
        competitorDetails: [
          "Headcount expansion to 35 users (£14,280/yr)",
          "Ongoing plugin subscriptions for client access and automated document generation",
          "Enterprise tier upgrades for security governance"
        ],
        bespokeEstimate: "£29,800",
        bespokeDetails: [
          "Core software asset 100% amortized; zero per-seat growth penalty",
          "£120/mo serverless cloud hosting"
        ],
        netDifference: "Save ~£38,600 (56% long-term savings)"
      }
    ],
    whenToChoose: [
      {
        scenario: "Pure Outbound B2B Sales Team (< 10 Reps)",
        recommendation: "competitor",
        rationale: "If your company solely needs outbound deal stage tracking and hands off won deals to a separate division, Pipedrive's visual deal pipelines are excellent."
      },
      {
        scenario: "Immediate 24-Hour Deployment Needed",
        recommendation: "competitor",
        rationale: "Pipedrive can be provisioned in minutes with standard pipeline stages before custom development begins."
      },
      {
        scenario: "Combined Sales & Post-Sale Operational Fulfillment",
        recommendation: "bespoke",
        rationale: "When winning a deal immediately triggers job dispatch, site audits, equipment ordering, or client onboarding, a bespoke unified platform eliminates double data entry."
      },
      {
        scenario: "Client Self-Service & Branded Portals Required",
        recommendation: "bespoke",
        rationale: "Pipedrive has no native customer portals. A custom Next.js system provides self-service project tracking and approvals for all your clients."
      }
    ],
    architectureBlueprint: {
      frontend: "Next.js 16 (App Router) with Tailwind CSS and role-tailored dispatcher dashboards",
      backend: "Next.js Server Actions with strict TypeScript schema validation",
      database: "PostgreSQL on Supabase with Row Level Security (RLS) & daily WAL point-in-time recovery",
      cloud: "Vercel / AWS with Cloudflare enterprise DDoS protection and edge caching",
      integrations: ["Xero / QuickBooks Online", "Stripe Invoicing & Billing", "Twilio SMS Dispatch", "SendGrid Email", "DocuSign / Custom PDF Generation"]
    },
    migrationRoadmap: [
      {
        phase: "Phase 1: Deal Pipeline & Workflow Architecture",
        duration: "Weeks 1–2",
        focus: "Map Pipedrive pipeline stages, custom fields, and downstream operational requirements.",
        deliverables: ["Relational data schema", "Fulfillment lifecycle diagram", "API connector blueprint"]
      },
      {
        phase: "Phase 2: Core Platform & Pipeline Engineering",
        duration: "Weeks 3–4",
        focus: "Build Next.js drag-and-drop pipelines, quote generators, and client portal interfaces.",
        deliverables: ["Interactive staging environment", "Automated PDF quote generator", "Mobile dispatcher view"]
      },
      {
        phase: "Phase 3: Historical Data ETL & Sync Verification",
        duration: "Weeks 5–6",
        focus: "Export Pipedrive deals, contacts, activities, and notes directly into PostgreSQL.",
        deliverables: ["Data verification report", "Sandbox validation sign-off", "User training documentation"]
      },
      {
        phase: "Phase 4: Seamless Cutover & Code Handover",
        duration: "Weeks 7–8",
        focus: "Production deployment, DNS switch, and complete GitHub repository code transfer.",
        deliverables: ["Live production system", "Full code ownership transfer", "30-day post-launch warranty"]
      }
    ],
    faqs: [
      {
        q: "Why do service businesses outgrow Pipedrive?",
        a: "Pipedrive is an exceptional sales pipeline tool, but it does not manage operational delivery. Businesses outgrow it when they need a single system that handles quotes, job dispatch, mobile engineer tracking, client portals, and invoice reconciliation."
      },
      {
        q: "Can we transfer our active Pipedrive deals and contact history?",
        a: "Yes. We extract your entire historical database—including active deals, pipeline stages, custom fields, contact histories, and notes—and import them seamlessly into your bespoke database."
      },
      {
        q: "What is the return on investment of switching from Pipedrive to a custom CRM?",
        a: "By eliminating per-seat license fees across your growing team and eliminating disconnected third-party add-ons (like form builders and portal plugins), mid-market companies typically break even within 12 to 18 months and save 50%+ over 5 years."
      }
    ],
    calculatorConfig: {
      mode: "seats",
      currencySymbol: "£",
      defaultSeats: 15,
      minSeats: 3,
      maxSeats: 60,
      tiers: [
        {
          name: "Pipedrive Advanced (£24/seat)",
          monthlyPerSeat: 24,
          description: "Full email sync, workflow automations & recurring revenue"
        },
        {
          name: "Pipedrive Professional (£34/seat)",
          monthlyPerSeat: 34,
          description: "Document management, custom reporting & project tracking"
        },
        {
          name: "Pipedrive Power (£49/seat)",
          monthlyPerSeat: 49,
          description: "Granular permissions, phone support & project planning"
        }
      ],
      competitorOnboardingFee: 2500,
      competitorSupportAnnual: 1000,
      bespokeBuildCost: 22000,
      bespokeMonthlyHosting: 100,
      bespokeAnnualMaintenance: 1000
    },
    checklistItems: [
      {
        id: "pipedrive-sales-only",
        question: "Is your requirement strictly for internal outbound sales reps tracking deals?",
        target: "competitor",
        description: "Pipedrive is tuned for traditional lead-to-deal pipeline tracking."
      },
      {
        id: "pipedrive-fast-launch",
        question: "Do you need a working sales board up and running by tomorrow morning?",
        target: "competitor",
        description: "Immediate cloud provisioning with standard pipeline stages."
      },
      {
        id: "pipedrive-fulfillment-gap",
        question: "Do you need a system that handles post-sale fulfillment (dispatch, equipment, certs)?",
        target: "bespoke",
        description: "Unify sales and field operations into one seamless platform without patchwork tools."
      },
      {
        id: "pipedrive-client-portal",
        question: "Do your clients need self-service access to view job progress, sign quotes, and pay?",
        target: "bespoke",
        description: "Bespoke systems include dedicated, branded client portals at £0 extra cost."
      },
      {
        id: "pipedrive-add-on-costs",
        question: "Are modular add-on subscriptions (LeadBooster, Projects, Smart Docs) inflating monthly bills?",
        target: "bespoke",
        description: "All features are built natively into your owned software asset with no add-on subscriptions."
      },
      {
        id: "pipedrive-per-seat-tax",
        question: "Are per-user monthly license fees discouraging you from adding operational and field staff?",
        target: "bespoke",
        description: "Add 10, 50, or 200 staff and contractors with zero marginal license penalties."
      }
    ]
  }
];

pseoComparisons.push(...newPseoComparisons);
