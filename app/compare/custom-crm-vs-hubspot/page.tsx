import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/utils";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HubSpotCompareInteractive } from "@/components/compare/HubSpotCompareInteractive";
import { 
  Scale, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Calendar, 
  User, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  Clock,
  Database
} from "lucide-react";

export const metadata: Metadata = {
  title: "Custom CRM vs HubSpot: Which Should You Choose? (2026)",
  description:
    "Compare HubSpot with a custom CRM on workflow fit, cost, launch speed, ownership, integrations and risk. Includes honest 3-year examples.",
  alternates: {
    canonical: `${SITE_URL}/compare/custom-crm-vs-hubspot`,
  },
  openGraph: {
    title: "Custom CRM vs HubSpot: Which Should You Choose? (2026)",
    description:
      "Compare HubSpot with a custom CRM on workflow fit, cost, launch speed, ownership, integrations and risk. Includes honest 3-year examples.",
    url: `${SITE_URL}/compare/custom-crm-vs-hubspot`,
    siteName: "The Digital Dude",
    type: "article",
    images: [
      {
        url: `${SITE_URL}/api/og?title=${encodeURIComponent("Custom CRM vs HubSpot: Which Should You Choose?")}&category=${encodeURIComponent("Architectural Decision Guide")}&tag=${encodeURIComponent("Updated 10 October 2026 • Honest 3-Year TCO")}`,
        width: 1200,
        height: 630,
        alt: "Custom CRM vs HubSpot Decision Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom CRM vs HubSpot: Which Should You Choose? (2026)",
    description:
      "Compare HubSpot with a custom CRM on workflow fit, cost, launch speed, ownership, integrations and risk. Includes honest 3-year examples.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const faqs = [
  {
    q: "Is a custom CRM cheaper than HubSpot?",
    a: "Sometimes, but not automatically. HubSpot has predictable subscription and onboarding charges, while custom software has build, hosting, maintenance and change costs. Compare a documented three- to five-year total cost for the actual editions, users, contacts, integrations and workflows you need.",
  },
  {
    q: "Does HubSpot support custom objects?",
    a: "Yes. HubSpot documents custom objects for Enterprise editions across relevant hubs and Smart CRM. Before building software solely for a different data model, verify whether Enterprise custom objects and associations solve the requirement.",
  },
  {
    q: "How long does a custom CRM take to build?",
    a: "DigitalDude publishes a typical 4–6-week range for a focused CRM and 8–14 weeks for a multi-portal CRM or SaaS platform. Actual timing depends on discovery, integrations, migration, acceptance testing and decision speed.",
  },
  {
    q: "Can a custom CRM integrate with HubSpot?",
    a: "Yes, a hybrid system can retain HubSpot for marketing and sales while a bespoke application handles operational workflows. Feasibility depends on APIs, data ownership, sync rules, rate limits and the required HubSpot edition.",
  },
  {
    q: "Who owns the data and source code?",
    a: "HubSpot customers retain rights governed by their agreement and use data within HubSpot's hosted platform. DigitalDude states that its clients own the delivered source code, database architecture and infrastructure accounts. Confirm the exact intellectual-property, third-party component, repository and handover terms in the signed contract.",
  },
  {
    q: "When should a business not build a custom CRM?",
    a: "Do not build when requirements are conventional, the process is still changing weekly, the budget covers launch but not maintenance, there is no internal owner, or a packaged CRM already meets the need with limited configuration.",
  },
];

const comparisonTableRows = [
  {
    factor: "Best fit",
    hubspot: "Standard sales, marketing and service processes",
    custom: "Distinct operational workflows and multi-role systems",
  },
  {
    factor: "Time to first use",
    hubspot: "Free and basic tools can be used immediately; implementation depth varies",
    custom: "Focused CRM typically 4–6 weeks; multi-portal CRM typically 8–14 weeks",
  },
  {
    factor: "Upfront cost",
    hubspot: "Low for Free/Starter; required onboarding applies to current Professional and Enterprise offers",
    custom: "Higher upfront build investment; fixed proposal required",
  },
  {
    factor: "Recurring cost",
    hubspot: "Subscription by edition/seat, plus applicable hubs, contacts, credits and add-ons",
    custom: "Hosting, monitoring, support and future development continue even without per-seat licence fees",
  },
  {
    factor: "Standard CRM features",
    hubspot: "Mature contacts, companies, deals, pipeline and sales tools",
    custom: "Must be included and tested in scope",
  },
  {
    factor: "Marketing suite",
    hubspot: "Major strength across HubSpot's connected hubs",
    custom: "Usually integrated with an existing marketing platform rather than rebuilt",
  },
  {
    factor: "Custom objects",
    hubspot: "Available in HubSpot Enterprise editions according to HubSpot documentation",
    custom: "Data model can be designed around the operation if included in scope",
  },
  {
    factor: "Workflow flexibility",
    hubspot: "Strong configuration and automation within product capabilities and edition limits",
    custom: "Bespoke logic, roles and interfaces can be engineered",
  },
  {
    factor: "Client/contractor portals",
    hubspot: "May require additional products, integrations or custom development",
    custom: "Can be part of one system if explicitly scoped",
  },
  {
    factor: "Integration ecosystem",
    hubspot: "More than 2,000 advertised app integrations plus APIs",
    custom: "Any documented API may be integrated, but each connection requires engineering and maintenance",
  },
  {
    factor: "Code ownership",
    hubspot: "HubSpot owns and operates the platform",
    custom: "DigitalDude states clients own delivered code and database assets; verify contract terms",
  },
  {
    factor: "Platform maintenance",
    hubspot: "Vendor handles core platform updates and infrastructure",
    custom: "Owner and development partner must plan maintenance, security and upgrades",
  },
  {
    factor: "Switching risk",
    hubspot: "Data/process dependence on HubSpot configuration and connected products",
    custom: "Dependence on code quality, documentation, hosting and maintainers",
  },
  {
    factor: "Ideal buyer",
    hubspot: "Team that wants a proven platform and fast adoption",
    custom: "Organisation that can act as a responsible software owner",
  },
];

const recommendationTable = [
  {
    situation: "Small team leaving spreadsheets with a conventional pipeline",
    recommendation: "HubSpot Free or Starter trial",
    rationale: "Standard lead tracking does not warrant the investment and responsibility of a software project.",
  },
  {
    situation: "B2B sales team needing sequences, forecasting and connected marketing",
    recommendation: "HubSpot Professional evaluation",
    rationale: "Mature sequences, marketing attribution, and pipeline reporting are ready out of the box.",
  },
  {
    situation: "Enterprise team needing mature governance and HubSpot custom objects",
    recommendation: "HubSpot Enterprise evaluation",
    rationale: "Leverage official HubSpot custom objects and security policies if budget accommodates.",
  },
  {
    situation: "Field-service operation coordinating jobs, technicians, evidence and certificates",
    recommendation: "Model a custom or hybrid operational system",
    rationale: "Dispatch, mobile photo proof, and certificate generation exceed standard sales CRM objects.",
  },
  {
    situation: "Multi-agency or client-portal workflow with strict data separation",
    recommendation: "Custom / hybrid architecture assessment",
    rationale: "Eliminates punitive per-user seat fees for external users while providing branded portals.",
  },
  {
    situation: "Team mainly trying to avoid software subscriptions",
    recommendation: "Reconsider; that alone is not a sound reason to build",
    rationale: "Custom software introduces hosting, maintenance, and product governance costs.",
  },
];

export default function CustomCrmVsHubspotPage() {
  const pageUrl = `${SITE_URL}/compare/custom-crm-vs-hubspot`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: "Custom CRM vs HubSpot: Which Should You Choose? (2026)",
        headline: "Custom CRM vs HubSpot: Which Should You Choose?",
        description:
          "Compare HubSpot with a custom CRM on workflow fit, cost, launch speed, ownership, integrations and risk. Includes honest 3-year examples.",
        datePublished: "2026-04-01T00:00:00Z",
        dateModified: "2026-10-10T00:00:00Z",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: "The Digital Dude",
          url: SITE_URL,
        },
        author: {
          "@type": "Person",
          name: "Farhad Hossain",
          jobTitle: "Founder & Solutions Architect",
          url: `${SITE_URL}/about`,
        },
        publisher: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo-full-color.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Comparisons",
            item: `${SITE_URL}/compare`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Custom CRM vs HubSpot",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-navy transition">Home</Link>
            <span>/</span>
            <Link href="/compare" className="hover:text-navy transition">Comparisons</Link>
            <span>/</span>
            <span className="font-semibold text-navy">Custom CRM vs HubSpot</span>
          </nav>

          {/* Hero Header */}
          <header className="rounded-3xl bg-white p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-primary/10 px-3.5 py-1 text-xs font-bold text-accent-primary">
              <Scale className="h-3.5 w-3.5" />
              Decision Framework · Verified 10 October 2026
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Custom CRM vs HubSpot: Which Should You Choose?
            </h1>

            {/* Author Byline & E-E-A-T Credentials */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple/10 flex items-center justify-center font-bold text-purple">
                  FH
                </div>
                <div>
                  <div className="font-bold text-navy">Farhad Hossain</div>
                  <div className="text-[11px] text-slate-500">Founder &amp; Solutions Architect</div>
                </div>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last reviewed: 10 October 2026</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Quarterly Sourcing Audit</span>
              </div>
            </div>

            {/* Commercial Affiliation Disclosure */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-purple shrink-0 mt-0.5" />
                <div>
                  <strong className="text-navy">Commercial Disclosure:</strong> The Digital Dude engineers bespoke CRM systems, so we have an organic commercial interest in bespoke development. This evaluation is compiled using public HubSpot documentation, vendor pricing data, and our published engineering timelines. HubSpot has not reviewed or endorsed this guide.
                </div>
              </div>
            </div>
          </header>

          {/* Above-the-Fold Verdict / The Short Answer */}
          <section className="my-10 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple" />
              The Short Answer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" /> Choose HubSpot When:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Your business primarily needs a proven sales and marketing platform, wants to launch quickly, values an ecosystem of 2,000+ app integrations, and can adapt its operational process to standard CRM objects and stages.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Consider Custom CRM When:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Your operational workflow is part of your competitive moat; the system coordinates unusual roles, multi-sided client portals, field technician dispatch, statutory compliance, or transaction logic; and you are prepared to fund and govern software as an owned asset.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-lavender/60 p-5 border border-tint text-xs text-navy/80 leading-relaxed space-y-3">
              <p>
                <strong>Key reality check:</strong> A custom CRM is not automatically cheaper or better. It requires a higher upfront build investment, takes longer to launch (4–14 weeks), and leaves your organization responsible for product decisions, security maintenance, and infrastructure. HubSpot is usually the safer, lower-risk choice for a conventional sales team. Custom development becomes credible when the measurable friction of working around a packaged CRM exceeds the cost of commissioning an owned system.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-purple/10">
                <span className="font-medium text-navy">
                  <strong>Quick decision rule:</strong> Contacts &amp; deals ➔ HubSpot. Properties, dispatch &amp; custom portals ➔ Model custom architecture.
                </span>
                <a
                  href="#decision-checklist"
                  className="font-bold text-purple hover:underline inline-flex items-center gap-1"
                >
                  Jump to Decision Checklist <ArrowDownRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* Section: Different Buying Decisions */}
          <section className="my-10 space-y-4 text-slate-700 text-sm leading-relaxed">
            <h2 className="text-2xl font-bold text-navy">
              HubSpot and a Custom CRM Are Fundamentally Different Buying Decisions
            </h2>
            <p>
              <strong>HubSpot is a mature customer platform.</strong> You subscribe to a vendor-maintained product with an established user interface, extensive documentation, mobile apps, SLA options, and an app marketplace of more than 2,000 pre-built integrations. Sales Hub spans Free, Starter, Professional, and Enterprise editions, with functionality, custom object allowances, and technical limits determined by your contract tier.
            </p>
            <p>
              <strong>A custom CRM is an engineering project and an ongoing product asset.</strong> It is designed around your organization&apos;s exact relational data model, role permissions, and operational steps—but those decisions must be discovered, architected, QA-tested, and supported. At The Digital Dude, our clients receive 100% intellectual property ownership of the delivered source code, database architecture, and cloud infrastructure; the precise scope, hosting, and SLA are agreed in each proposal.
            </p>
            <p className="italic text-slate-500">
              Neither approach is universally superior. The strategic question is whether to configure a broad SaaS platform or own a purpose-built system mapped directly to your operating model.
            </p>
          </section>

          {/* Comprehensive Comparison Table */}
          <section className="my-12 rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-navy">
                  Head-to-Head Comparison Matrix
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Verified 10 October 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Vendor data and public pricing verified against official HubSpot documentation and DigitalDude delivery parameters.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3.5 font-bold text-navy uppercase text-[11px] tracking-wider w-1/4">
                      Decision Factor
                    </th>
                    <th className="p-3.5 font-bold text-amber-900 bg-amber-50/70 uppercase text-[11px] tracking-wider w-3/8 rounded-t-lg">
                      HubSpot Sales Hub
                    </th>
                    <th className="p-3.5 font-bold text-emerald-900 bg-emerald-50/70 uppercase text-[11px] tracking-wider w-3/8 rounded-t-lg">
                      Custom CRM (Digital Dude)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonTableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 font-semibold text-navy text-xs">
                        {row.factor}
                      </td>
                      <td className="p-3.5 text-slate-600 bg-amber-50/20 text-xs">
                        {row.hubspot}
                      </td>
                      <td className="p-3.5 text-slate-800 bg-emerald-50/20 text-xs font-medium">
                        {row.custom}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* When HubSpot is Better */}
          <section className="my-12 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Vendor Platform Strengths</span>
              <h2 className="text-2xl font-bold text-navy mt-1">
                When HubSpot Is the Better Choice
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                HubSpot should normally win when speed, user adoption, and marketing synergy matter more than a non-standard operational data model.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  1. Your process is recognizably a sales pipeline
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  If your team manages contacts, companies, deals, email sequences, meeting scheduling, and pipeline velocity reports, HubSpot already solves the central problem cleanly. Rebuilding these established patterns from scratch introduces risk and capital expense without delivering strategic differentiation.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  2. Marketing and sales need to share one unified platform
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  HubSpot&apos;s interconnected Marketing, Sales, Content, and Service Hubs represent a profound operational strength. While a bespoke CRM can integrate with marketing automation tools via webhooks, rebuilding a full-featured marketing automation suite from scratch is rarely justifiable.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  3. You need to launch and onboard immediately
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  HubSpot sales tools can be configured and tested immediately. While deep migration and change management take time, it is fundamentally faster than a custom build cycle. If your sales leadership must improve pipeline visibility this quarter, configuring HubSpot is the safer path.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  4. Your organization does not want to act as a software owner
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Custom software is a high-yield corporate asset, but it carries operational duties. An internal stakeholder must prioritize feature updates, manage permissions, review error telemetry, and maintain hosting accounts. A vendor-managed SaaS platform removes this administrative overhead.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  5. The free or starter tier solves the core problem
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  HubSpot offers a Free edition for up to two seats and a low-cost Starter edition. Small businesses with ordinary lead tracking needs should exhaust these tiers before considering a bespoke engineering contract. Never build bespoke software simply to avoid a small monthly SaaS invoice.
                </p>
              </div>
            </div>
          </section>

          {/* When Custom CRM is Deserved */}
          <section className="my-12 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operational Moat &amp; Architecture</span>
              <h2 className="text-2xl font-bold text-navy mt-1">
                When a Custom CRM Deserves Serious Consideration
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                A custom build becomes credible when operational mismatches produce recurring administrative friction, lost revenue, and software licensing penalties.
              </p>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  1. The CRM must coordinate complex operations beyond sales
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Examples include field technician dispatch, rental property safety compliance, automated certificate generation, agency data isolation, and subcontractor payout splits. While HubSpot can connect to third-party tools, daisy-chaining middleware, API limits, and multiple paid add-ons often creates fragile, unmaintainable architecture.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  2. Your relational data model is central to your enterprise moat
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Standard SaaS platforms force your workflow into rigid contacts, companies, and deals. A bespoke CRM models the authentic entities of your business—properties, inspections, breakdown incidents, certifications, and flight routes. You define relational logic, indexing, and row-level security around how you actually operate.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  3. External stakeholders need dedicated, role-based portals
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  If clients, contractors, or partner agencies require authenticated dashboards to self-serve reports, upload photo evidence, or download compliance certificates, custom architecture provides unlimited external user logins without triggering punitive enterprise per-seat licensing.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5 space-y-1.5 hover:border-slate-200 transition">
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  4. Per-seat licensing taxes company growth
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  SaaS licensing scales with headcount and contact volume regardless of software usage intensity. A custom system deployed to your dedicated cloud (e.g. Supabase and Vercel) carries fixed hosting overheads (£50–£150/mo), so adding 10, 50, or 200 users introduces zero marginal software licensing cost.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive Tool: Decision Checklist & TCO */}
          <section id="decision-checklist" className="my-12">
            <HubSpotCompareInteractive />
          </section>

          {/* Detailed 3-Year Cost Examples */}
          <section className="my-12 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Total Cost of Ownership (TCO)</span>
              <h2 className="text-2xl font-bold text-navy mt-1">
                Detailed 3-Year Financial Modeling
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Transparent illustrations based on official HubSpot pricing published at the review date.
              </p>
            </div>

            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
                <h3 className="text-base font-bold text-navy mb-2">Scenario A: 20 Sales Hub Professional Seats</h3>
                <p>
                  HubSpot&apos;s public pricing displays Professional from <strong>$90 per seat/month</strong> (billed annually), plus a mandatory <strong>$1,500 one-time onboarding fee</strong>.
                </p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-slate-600 font-mono">
                  <li>Subscription: 20 seats × $90/mo × 36 months = <strong>$64,800</strong></li>
                  <li>Mandatory Onboarding: <strong>$1,500</strong></li>
                  <li>Illustrative 3-Year Total: <strong>$66,300</strong></li>
                </ul>
                <p className="mt-3 text-[11px] text-slate-500">
                  <em>Excludes:</em> Marketing Hub, Service Hub, contact overage charges past tier limits, third-party consulting retainers, and internal administrative labor.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
                <h3 className="text-base font-bold text-navy mb-2">Scenario B: 20 Sales Hub Enterprise Seats</h3>
                <p>
                  HubSpot displays Enterprise from <strong>$150 per seat/month</strong>, plus a mandatory <strong>$3,500 one-time onboarding fee</strong>.
                </p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-slate-600 font-mono">
                  <li>Subscription: 20 seats × $150/mo × 36 months = <strong>$108,000</strong></li>
                  <li>Mandatory Onboarding: <strong>$3,500</strong></li>
                  <li>Illustrative 3-Year Total: <strong>$111,500</strong></li>
                </ul>
                <p className="mt-3 text-[11px] text-slate-500">
                  <em>Excludes:</em> Additional custom object packs, API throttle tier extensions, and annual enterprise contract uplifts.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50/40 p-6 border border-emerald-200">
                <h3 className="text-base font-bold text-emerald-950 mb-2">Custom CRM Reality Check</h3>
                <p>
                  DigitalDude&apos;s published guidance places a focused bespoke CRM build at roughly <strong>£5,500–£12,000 ($7,000–$15,500)</strong> over 4–6 weeks. However, an honest TCO comparison must budget for complete product ownership:
                </p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-emerald-900">
                  <li>Dedicated Cloud Hosting (PostgreSQL, edge compute, automated backups): ~£600–£1,800/yr (£1,800–£5,400 over 3 yrs).</li>
                  <li>Third-party transactional services (Twilio SMS, Brevo email, Maps APIs): Pay-as-you-go based on actual volume.</li>
                  <li>Preventative maintenance, framework security patches, and quarterly feature upgrades.</li>
                </ul>
                <p className="mt-3 text-[11px] text-emerald-900 font-medium">
                  <strong>The Takeaway:</strong> Custom software carries real maintenance obligations. It wins financially when avoiding recurring per-seat licensing for large or growing teams outweighs upfront engineering capital.
                </p>
              </div>
            </div>
          </section>

          {/* Risk Profile & Migration */}
          <section className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Assessment</span>
              <h3 className="text-lg font-bold text-navy">HubSpot Risk Profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                HubSpot provides an enterprise-maintained platform with established SLAs. The central vulnerability is architectural: attempting to fit specialized operational processes into standard sales stages, accumulating expensive custom object add-ons, and creating brittle Zapier workflows.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Assessment</span>
              <h3 className="text-lg font-bold text-navy">Custom CRM Risk Profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Source code ownership does not automatically guarantee system resilience. The central risk is developer dependency and technical debt. Before commissioning bespoke software, ensure your contract guarantees full repository access, PostgreSQL schemas, and clear API documentation.
              </p>
            </div>
          </section>

          {/* Recommendation Table by Business Type */}
          <section className="my-12 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-navy">
                Our Recommendation by Business Situation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Practical, objective guidance based on team complexity and operational requirements.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-3 font-bold text-navy uppercase tracking-wider w-1/3">Business Situation</th>
                    <th className="p-3 font-bold text-purple uppercase tracking-wider w-1/3">Recommended Starting Point</th>
                    <th className="p-3 font-bold text-slate-600 uppercase tracking-wider w-1/3">Strategic Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendationTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-navy">{row.situation}</td>
                      <td className="p-3 font-bold text-purple">{row.recommendation}</td>
                      <td className="p-3 text-slate-600">{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQs */}
          <section className="my-12 space-y-4">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Common Inquiries</span>
              <h2 className="text-2xl font-bold text-navy mt-1">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-500 mt-1">
                Objective answers to technical, commercial, and migration questions.
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </section>

          {/* Methodology & Citations */}
          <section className="my-12 rounded-3xl bg-white p-8 border border-slate-200 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
              Evaluation Methodology &amp; Sources
            </h3>
            <p>
              We evaluated implementation speed, relational data models, portal capabilities, API extensibility, platform governance, and 3-year financial models. HubSpot product and pricing details were sourced directly from public vendor pages on 10 October 2026. DigitalDude engineering metrics were drawn from our published services, case studies, and delivery records.
            </p>
            <div className="pt-2">
              <div className="font-semibold text-navy mb-2">Sources Reviewed:</div>
              <ul className="space-y-1 list-disc list-inside text-slate-500">
                <li><a href="https://www.hubspot.com/pricing/sales" target="_blank" rel="noopener noreferrer" className="text-purple hover:underline">HubSpot Sales Hub Official Pricing</a></li>
                <li><a href="https://www.hubspot.com/products/sales" target="_blank" rel="noopener noreferrer" className="text-purple hover:underline">HubSpot Sales Hub Feature Specifications</a></li>
                <li><a href="https://knowledge.hubspot.com/object-settings/create-custom-objects" target="_blank" rel="noopener noreferrer" className="text-purple hover:underline">HubSpot Custom Object Documentation</a></li>
                <li><Link href="/services/crm-development" className="text-purple hover:underline">The Digital Dude Custom CRM Engineering Capabilities</Link></li>
                <li><Link href="/how-we-work" className="text-purple hover:underline">The Digital Dude Fixed-Scope Delivery Process</Link></li>
                <li><Link href="/work" className="text-purple hover:underline">Production Case Studies &amp; Architectural Proof</Link></li>
              </ul>
            </div>
          </section>

          {/* Final Soft Conversion Callout */}
          <section className="my-12 rounded-3xl bg-[#0F0F2D] text-white p-8 md:p-12 relative overflow-hidden text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-accent-primary" /> Unbiased Architecture Review
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Still Unsure Between Building vs. Buying?
            </h2>
            <p className="max-w-xl mx-auto text-xs md:text-sm text-slate-300 leading-relaxed">
              Bring your operational workflow, headcount, and current software quotes to a technical discovery call. We will give you an honest recommendation on whether packaged software or a custom build is the more sensible investment.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-purple px-6 py-3 text-xs font-bold text-white shadow-sm hover:brightness-110 transition"
              >
                Book a CRM Architecture Review
              </Link>
              <Link
                href="/services/crm-development"
                className="rounded-full bg-white/10 px-6 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Explore CRM Capabilities
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function ArrowDownRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}
