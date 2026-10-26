import type { CaseStudy } from "./caseStudies";

/**
 * Platforms we designed and built ourselves. These describe what each system does and how it is engineered; they deliberately carry
 * no client testimonials or revenue claims, because there are none to quote.
 */
export const newCaseStudies: CaseStudy[] = [
  {
    slug: "ai-restaurant-ordering-platform",
    industry: "Hospitality",
    tag: "Hospitality · Australia",
    title: "AI restaurant ordering platform",
    summary: "A multi-tenant platform where an AI voice agent takes phone orders and a live dashboard puts them in front of the kitchen",
    status: "Live",
    image: "/images/case-studies/ai-restaurant-ordering.svg",
    imageAlt: "AI restaurant ordering platform showing a live orders board, call log and kitchen display",
    headline: "An AI that answers the restaurant phone and puts the order on the kitchen screen",
    pageSummary:
      "A multi-tenant SaaS for Australian restaurants: phone orders taken by an AI voice agent, mirrored into a live orders board, call log and kitchen display, with self-serve signup and subscription billing.",
    stats: [
      "Running with a pilot restaurant",
      "3 roles: platform admin, owner, staff",
      "Live orders board with realtime updates",
      "GST-inclusive AUD pricing",
    ],
    challenge:
      "A restaurant's phone rings hardest when nobody can answer it. During service the people who could pick up are plating food or serving tables, so the call goes unanswered and the order goes to a competitor or a delivery app that takes a commission. Hiring someone just to answer the phone does not make sense for a small venue, and a voicemail is not an order. The brief was a system that answers every call, takes a pickup order against the venue's real menu, and makes sure the kitchen actually sees it, without new hardware and without needing the owner to be tech-savvy. It also had to be a product that could serve many restaurants, not a one-off for a single venue, which meant strict separation between each venue's data from the first line of code.",
    whatWeBuilt: [
      "A multi-tenant platform with owner, staff and platform-admin roles, and database-level row security on tenant data so one restaurant can never read another's orders.",
      "Phone ordering driven by a voice agent, with GoHighLevel as the system of record for voice, SMS and order automation. Orders and calls are mirrored into our own database from verified webhooks.",
      "A live orders board that updates in real time. Staff acknowledge an order and advance its status, and each change is pushed back to the order's pipeline stage so both systems agree.",
      "A call log with recordings streamed through our server, so access tokens never reach the browser, and a call-by-call history for resolving disputed orders.",
      "A kitchen display mode and analytics built from real order and call data, plus settings for business hours and an escalation phone number.",
      "Self-serve signup that creates the venue, starts a Stripe subscription and triggers provisioning, with an admin view of every tenant, a retry for failed provisioning, and audited impersonation for support.",
      "Webhook authentication with a shared secret, and a written feature audit that records exactly what is confirmed against the live service and what is still an assumption.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "A venue's phone orders no longer depend on someone being free to answer. Calls are answered, orders land on a live board and a kitchen screen, and each call is recorded and logged so an owner can check what was said. The platform is running with a pilot restaurant in Australia, and the architecture is built to onboard further venues: each one gets its own isolated data, its own subscription and its own provisioning, managed from a single admin console. Just as important is what we learned about depending on third-party platforms: we verify each integration against the live service rather than the documentation, and keep a running record of what has been proven. That discipline is what turns a voice-AI demo into something an owner can rely on during a Friday-night rush.",
    builtWith: "Next.js 16, TypeScript, Supabase (PostgreSQL, row-level security, Realtime), Stripe, GoHighLevel, Vercel",
    related: ["cleaning-marketplace", "biztrackbd-ecommerce-platform"],
  },
  {
    slug: "biztrackbd-ecommerce-platform",
    industry: "E-commerce",
    tag: "E-commerce · Bangladesh",
    title: "BizTrackBD ecommerce platform",
    summary: "A multi-tenant store builder for Bangladesh: cash on delivery, bKash and Nagad, local couriers and fake-order protection",
    status: "Live",
    image: "/images/case-studies/biztrackbd-ecommerce.svg",
    imageAlt: "BizTrackBD store builder with sections, live preview and settings panel",
    headline: "A store builder that thinks in taka, built for how Bangladesh actually sells",
    pageSummary:
      "A multi-tenant ecommerce SaaS with six store templates, a mobile-friendly page builder, local payments and courier booking, and a platform admin for plans, payments and store approval.",
    stats: [
      "4 apps on one database",
      "6 store templates with live demos",
      "3 courier integrations: Steadfast, Pathao, RedX",
      "650+ unit tests and 400+ browser tests",
    ],
    challenge:
      "Global store builders assume card payments and next-day couriers. A shop in Dhaka lives differently: most orders are cash on delivery, with the courier paying the merchant weeks later and often short; many of the rest are bKash or Nagad, where the customer types a transaction ID and someone has to check it; orders arrive by phone and Messenger as often as through a website; fake orders and refused parcels eat the margin; and merchants run the whole shop from a phone, in Bangla as often as English. Tools built for other markets handle none of this well, so merchants end up stitching together spreadsheets and chat apps. The goal was a platform that starts from those facts rather than treating them as edge cases.",
    whatWeBuilt: [
      "Checkout for how customers really pay: cash on delivery, manual bKash and Nagad with transaction-ID capture and a one-screen verification desk, and division, district and upazila address fields that match couriers. Prices are recalculated on the server so a tampered cart cannot change what is charged.",
      "A Bangla and English storefront, switchable per visitor, that holds up on slow mobile connections.",
      "Order operations in one place: live filters, bulk actions, courier booking and tracking for Steadfast, Pathao and RedX, a check of each courier's payout statement for short payments, and returns and exchanges that put stock back with a record of every step.",
      "A delivery trust score per phone number, built from parcels across stores, that holds risky cash-on-delivery orders until the merchant has called.",
      "Six store templates, each with a live demo, and a full-screen page builder with a live preview of the real store, undo and redo, drag-to-reorder, drafts, publishing, version history and one-click rollback.",
      "Growth tools: loyalty and referrals, abandoned-checkout recovery by SMS, server-side Meta Conversions API with deduplication, Google Analytics 4, coupons and reviews.",
      "A platform layer: signup with a 14-day trial, plans in taka, payment proof review, store suspension and reactivation, audit logs, and custom domains with automatic verification and SSL.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "A merchant can launch a store, take cash-on-delivery and mobile-wallet orders, book a courier and track the parcel without leaving one system, and can do most of it from a phone. The platform's most important property is isolation: every store is a tenant, and the database itself enforces that one store can never read another's rows, which is checked against a live database rather than assumed. The codebase is covered by more than 650 unit tests and over 400 browser tests, including accessibility checks on every admin screen at phone and desktop width. Store secrets such as courier and payment keys are encrypted and never sent back to a browser. The result is a platform designed to be operated as a business, with plans, billing, approvals and audit trails, not just a template gallery.",
    builtWith: "Next.js 16, React 19, TypeScript, PostgreSQL with row-level security, Prisma, Supabase, pnpm and Turborepo, Vercel",
    related: ["cleaning-marketplace", "ai-restaurant-ordering-platform"],
  },
  {
    slug: "reachmira-outreach-crm",
    industry: "Sales & Marketing",
    tag: "Sales tech · Product",
    title: "ReachMira outreach CRM",
    summary: "An outreach CRM that imports leads, writes personalised emails with AI, sends through your own mailbox and tracks every reply",
    status: "Live",
    image: "/images/case-studies/reachmira-outreach.svg",
    imageAlt: "ReachMira outreach CRM showing campaign leads, AI-drafted emails and activity timeline",
    headline: "Personalised cold outreach that stops itself when someone replies",
    pageSummary:
      "A campaign tool for importing leads from CSV or Google Sheets, drafting personalised emails with AI for human review, sending through SMTP, Mailgun, Gmail or Outlook, and tracking replies, bounces and unsubscribes.",
    stats: [
      "4 sending options: SMTP, Mailgun, Gmail, Outlook",
      "Import from CSV or a Google Sheets link",
      "Stops on reply, bounce or unsubscribe",
      "Conditional follow-up sequences",
    ],
    challenge:
      "Outreach tools tend to fail in one of two ways. Some send identical templated email at volume, which gets ignored and damages the sender's reputation. Others are powerful but assume a full engineering stack, with queues, workers and paid infrastructure, before a small team can send a single campaign. A small business needs something in between: the ability to bring its own list, write messages that genuinely refer to each company, send from its own mailbox, and have the system reliably stop emailing anyone who replies, bounces or opts out. Done carelessly, sequences keep chasing people who have already answered, which is the fastest way to lose a prospect and a sender reputation.",
    whatWeBuilt: [
      "Lead import from CSV or a public Google Sheets link, with dynamic column mapping, duplicate skipping per campaign, email validation, and unmapped columns kept so no data is lost.",
      "AI personalisation that produces a company summary, pain points, an outreach angle, a subject and a body for each lead. Drafts are editable and can require approval before anything is sent.",
      "Sending through SMTP (including cPanel), Mailgun, and one-click Gmail and Outlook connections, with provider secrets masked in the interface and refreshed tokens stored safely.",
      "A cron-driven send queue that needs no paid queue service, claiming small batches, respecting campaign and per-mailbox daily limits, and skipping anyone who has replied, bounced, complained or unsubscribed.",
      "Conditional follow-up steps that can depend on whether the previous email was opened or a link was clicked, with skipped steps recorded for audit.",
      "Open and click tracking with signed redirect links, so the link tracker cannot be abused as an open redirect, and unsubscribe links that are never rewritten.",
      "An audit log of lifecycle events and an activity timeline per lead, so every send, reply and status change can be explained.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "A small team can run personalised outreach end to end from one place, without a separate scraper, writing tool, mailer and spreadsheet. The safety rules are structural rather than a matter of discipline: daily limits, an approval step, an unsubscribe footer and automatic stop-on-reply mean the system protects the sender's reputation by default. Because the queue uses plain database state rather than extra infrastructure, it runs on a modest, low-cost stack and is simple to operate and debug. The same engineering habits, such as tested state machines, signed links and masked secrets, carry across every system we build.",
    builtWith: "Next.js, TypeScript, Supabase (PostgreSQL, Auth), Google Gemini, SMTP, Mailgun, Gmail and Microsoft Graph APIs, Vercel",
    related: ["recruitment-crm", "airline-ticketing-crm"],
  },
];
