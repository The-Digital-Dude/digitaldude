import { PseoIndustry } from "../types";

/** Two industries added from the October 2026 keyword plan, each tied to a real project we built. */
export const newPseoIndustries: PseoIndustry[] = [
  {
    slug: "hospitality",
    name: "Restaurants, Takeaways & Hospitality",
    iconName: "UtensilsCrossed",
    badge: "Hospitality Tech",
    heroTagline: "AI Phone Ordering, Live Order Boards and Multi-Venue Platforms for Restaurants and Takeaways",
    overview:
      "Restaurants lose orders when the phone rings during service, pay commission on every delivery-app order, and juggle tablets, printers and group chats to keep the kitchen informed. The software that fixes this is less about a flashy app and more about reliable order capture, clear kitchen visibility and sensible escalation when something is missed.",
    corePainPoints: [
      { title: "Missed Calls at Peak Time", desc: "Staff who could answer the phone are plating food or serving tables, so direct orders go to voicemail or to a competitor." },
      { title: "Delivery App Commission", desc: "Orders that could have come direct are routed through platforms that take a percentage of every sale." },
      { title: "Orders the Kitchen Never Sees", desc: "Tickets written on paper or sent to a device nobody is watching are the most common source of wrong or late orders." },
      { title: "No Record of What Was Said", desc: "Disputed phone orders are hard to resolve without a call log, a recording or a read-back of the order." },
    ],
    statutoryCompliance: [
      "Call recording and AI-agent disclosure at the start of the call",
      "Consumer law on pricing and refunds",
      "GST or VAT included in displayed prices",
      "Food allergen information accuracy",
      "Privacy and marketing consent for customer phone numbers and SMS",
    ],
    recommendedTechStack: ["Next.js 16", "Supabase PostgreSQL with Realtime", "Row-level security per venue", "Stripe Billing and Checkout links", "Voice and SMS provider integration", "Vercel"],
    featuredCaseStudySlug: "ai-restaurant-ordering-platform",
    keyWorkflows: [
      "Phone orders taken against the venue's live menu, read back to the caller, then confirmed by SMS",
      "Live orders board and kitchen display with acknowledge and status steps",
      "Escalation to staff by text if an order is not acknowledged",
      "Call log with recordings for resolving disputed orders",
      "Multi-venue admin with per-venue billing and isolated data",
    ],
    faqs: [
      { q: "Can AI take phone orders for a restaurant accurately?", a: "Accuracy comes from the design, not only the voice model. The agent should fetch every item and price from your live menu, read the full order back, and hand off to a person after repeated misunderstandings. We test with real accents, noise and unusual menu items before a venue goes live." },
      { q: "Should a restaurant build its own AI ordering system?", a: "Rarely. A single venue is usually better served by an existing product. Building makes sense if you want to offer the service to many restaurants under your own brand, or need integrations a product does not support. We explain the trade-offs in our build-or-buy guide." },
      { q: "How do you keep each restaurant's data separate?", a: "Every venue is a tenant and the database enforces row-level security, so a mistake in one screen cannot expose another restaurant's orders." },
    ],
    stats: [
      { metric: "Live", label: "Order Board", detail: "Orders appear on the kitchen screen in real time and can be acknowledged and advanced by staff." },
      { metric: "3 roles", label: "Admin, Owner, Staff", detail: "Each user sees only what applies to their role and venue." },
      { metric: "Pilot", label: "Running in Australia", detail: "Our ordering platform is running with a pilot restaurant, built to onboard further venues." },
    ],
  },
  {
    slug: "ecommerce",
    name: "E-Commerce, Retail & Online Stores",
    iconName: "ShoppingBag",
    badge: "E-Commerce Engineering",
    heroTagline: "Custom Storefronts, Multi-Store Platforms and Local Payment and Courier Integrations",
    overview:
      "Most online shops should start on a hosted platform. The case for custom e-commerce appears when payments, couriers, pricing or catalogue rules are specific enough that you spend more on apps and workarounds than a purpose-built system would cost, or when you want to run many stores yourself.",
    corePainPoints: [
      { title: "App Stack Creep", desc: "Subscriptions, bundles, B2B and shipping rules become separate paid apps, each with its own fee and failure mode." },
      { title: "Payments Your Platform Does Not Fit", desc: "Cash on delivery, manual mobile-wallet verification and local couriers are awkward on platforms built around cards." },
      { title: "Fake Orders and Refused Parcels", desc: "Returns and failed deliveries erode margins when there is no way to score risk before shipping." },
      { title: "Mobile-First Merchants", desc: "Many sellers run the whole business from a phone, so the admin must work well on a small screen." },
    ],
    statutoryCompliance: [
      "Consumer rights and returns rules",
      "VAT or GST on displayed and invoiced prices",
      "Privacy law for customer data and marketing consent",
      "Payment provider terms for stored credentials",
      "Accessibility expectations for storefront and admin",
    ],
    recommendedTechStack: ["Next.js 16", "PostgreSQL with row-level security", "Prisma", "Courier and payment APIs", "Server-side Meta Conversions API", "Vercel"],
    featuredCaseStudySlug: "biztrackbd-ecommerce-platform",
    keyWorkflows: [
      "Checkout with cash on delivery, mobile-wallet verification and card payments",
      "Courier booking, tracking and payout statement checks",
      "Returns and exchanges with stock restored and every step recorded",
      "Delivery trust scoring that holds risky cash orders until confirmed",
      "Multi-store platform with plans, approvals, custom domains and audit logs",
    ],
    faqs: [
      { q: "When is custom e-commerce better than Shopify?", a: "When your checkout, payments, couriers or pricing rules are specific enough that you pay for many apps and workarounds, or when you want to run many stores or a marketplace. For a standard shop, Shopify is usually faster and cheaper. Our comparison guide shows the cost models and assumptions." },
      { q: "Can a custom store handle cash on delivery and mobile wallets?", a: "Yes. We built a platform where cash on delivery, manual bKash and Nagad verification, courier booking and a delivery trust score are core features rather than add-ons." },
      { q: "How do you stop one store seeing another store's data?", a: "Each store is a tenant, and the database itself enforces that a store can only read its own rows. We test this against a live database instead of assuming it." },
    ],
    stats: [
      { metric: "6", label: "Store Templates", detail: "Each with a live demo and a mobile-friendly page builder." },
      { metric: "3", label: "Courier Integrations", detail: "Steadfast, Pathao and RedX booking and tracking in one place." },
      { metric: "650+", label: "Unit Tests", detail: "Plus over 400 browser tests, including accessibility checks on every admin screen." },
    ],
  },
];
