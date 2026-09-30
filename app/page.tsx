import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Users, Cloud, Building2, Store, Globe, Search, PenTool, Code2, CheckCircle2, Rocket, PackageCheck, Quote, HelpCircle, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudies } from "@/lib/caseStudiesServer";
import { services } from "@/lib/content/services";
import { ProjectCard } from "@/components/ProjectCard";
import { StandardCTA } from "@/components/StandardCTA";
import { FaqAccordion } from "@/components/FaqAccordion";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("home", "/");
export const revalidate = 60;

const proofBar = [
  { value: "4,000+", label: "rentals managed on one of our CRMs" },
  { value: "30+", label: "agencies running on the same platform" },
  { value: "4x", label: "faster than the system it replaced" },
  { value: "40%", label: "faster response coordination for a logistics team" },
];

const whatWeBuild = [
  {
    title: "Custom CRMs",
    body: "Leads, customers, jobs and follow-ups in one place, shaped around your exact sales and dispatch process.",
    href: "/services/crm-development",
    icon: Users,
  },
  {
    title: "SaaS Platforms",
    body: "Multi-tenant subscription products with client portals, Stripe automated billing, and granular user roles.",
    href: "/services/saas-development",
    icon: Cloud,
  },
  {
    title: "ERP & HRM Systems",
    body: "Operations, staff management, payroll, and real-time reporting connected in one central database.",
    href: "/services/erp-hrm-systems",
    icon: Building2,
  },
  {
    title: "Marketplace Apps",
    body: "Synchronized customer booking app, provider dispatch app, and central admin operations portal.",
    href: "/services/marketplace-development",
    icon: Store,
  },
  {
    title: "Web Applications",
    body: "High-performance, search-optimized web applications built to scale traffic and bring in qualified enquiries.",
    href: "/services/website-development",
    icon: Globe,
  },
];

const howWeWorkIcons = [Search, PenTool, Code2, CheckCircle2, Rocket, PackageCheck];

const featuredSlugs = ["property-compliance-crm", "airline-ticketing-crm", "cleaning-marketplace"];

const industryLinks = [
  { label: "Property and real estate", slug: "property" },
  { label: "Travel and tourism", slug: "travel" },
  { label: "Recruitment and staffing", slug: "recruitment" },
  { label: "Cleaning and home services", slug: "home-services" },
  { label: "Transport and logistics", slug: "logistics" },
  { label: "Education", slug: "education" },
  { label: "Community platforms", slug: "community" },
];

const howWeWorkSteps = ["Discovery", "Design", "Development", "Testing", "Launch", "Handover"];

const whyUs = [
  {
    title: "Built around your process.",
    body: "We map how your team works first, then build the custom system to fit, not the other way around.",
  },
  {
    title: "One team, start to finish.",
    body: "Scoping, design, development and launch all happen in-house. No hand-offs between separate agencies.",
  },
  {
    title: "Fixed scope & transparent pricing.",
    body: "You know exactly what you are getting, when it will be delivered, and the exact project cost before any code is written.",
  },
  {
    title: "100% Code & Data Ownership.",
    body: "The source code, the database architecture, and every infrastructure account belong exclusively to you.",
  },
];

const clientTestimonials = [
  {
    quote: "Our rental management operations were crumbling under spreadsheets. The Digital Dude built a dedicated compliance CRM that now runs 4,000+ properties across 30 agencies without a hitch.",
    author: "Head of Operations",
    company: "Property Compliance & Asset Management Group (Australia)",
    metric: "4,000+ Rentals Managed",
  },
  {
    quote: "We needed a three-sided marketplace with upfront card holds, provider dispatch, and cleaner proof-of-work. They delivered the full web app and admin CRM on schedule and on budget.",
    author: "Founder & CEO",
    company: "On-Demand Home Services Platform (UK)",
    metric: "100% Automated Payouts",
  },
  {
    quote: "Consolidating phone, WhatsApp, and walk-in flight enquiries into one real-time pipeline reduced our enquiry response time by over 60% within the first month.",
    author: "Managing Director",
    company: "Travel & Ticketing Agency Network (Australia)",
    metric: "60% Faster Enquiry Handling",
  },
];

const homeFaqs = [
  {
    q: "Do we fully own the custom software and source code you build?",
    a: "Yes, 100%. You own the complete source code, intellectual property, database architectures, and all infrastructure accounts (AWS, Supabase, Stripe, Vercel). There are no vendor lock-ins or recurring per-user licensing fees.",
  },
  {
    q: "How long does it take to design, build, and launch a custom software system?",
    a: "Focused custom CRMs and operational tools typically take 4 to 6 weeks. Complex multi-portal SaaS platforms or 3-sided marketplaces take 8 to 14 weeks, delivered in two-week agile sprint demos so you see working progress continually.",
  },
  {
    q: "How do you handle migrating data from our existing spreadsheets and legacy tools?",
    a: "We perform full data cleansing, schema mapping, and automated migration scripts during the staging phase. We test with your real historical records and run parallel trials before cutover to ensure zero downtime.",
  },
  {
    q: "Can our new custom system integrate with our existing accounting, WhatsApp, and email tools?",
    a: "Absolutely. We build native REST/GraphQL integrations and webhooks with tools like Xero, QuickBooks, Stripe, Twilio WhatsApp, SendGrid, and Google Workspace, eliminating duplicate manual entries across your stack.",
  },
  {
    q: "What post-launch maintenance, SLAs, and technical support do you provide?",
    a: "Every delivery includes dedicated post-launch warranty support, automated uptime monitoring, bug fixes, database backups, and flexible monthly retainer options for feature expansion.",
  },
];

const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default async function HomePage() {
  const caseStudies = await getCaseStudies();

  const featuredProjects = featuredSlugs
    .map((slug) => caseStudies.find((c) => c.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />

      {/* 1. Hero */}
      <section className="mx-auto max-w-content px-6 pb-16 pt-32 text-center sm:pt-44">
        <span className="text-sm font-semibold uppercase tracking-wide text-purple">
          Custom Software Engineering Studio
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold text-navy sm:text-5xl">
          Custom CRM, SaaS &amp; Bespoke Software Systems We Build
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-navy/70">
          We design, architect and build bespoke CRMs, multi-tenant SaaS platforms, and operational systems for high-growth service businesses in Australia and the UK. One team, from first call to live launch.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-purple px-8 py-3 font-semibold text-white transition hover:brightness-110 shadow-sm"
          >
            Schedule Discovery Call
          </Link>
          <Link
            href="/work"
            className="rounded-full border border-navy/20 px-8 py-3 font-semibold text-navy hover:bg-black/5 transition"
          >
            View Case Studies
          </Link>
        </div>
        <p className="mt-8 text-sm text-navy/60">
          7 live and delivered products · 5 industries · Clients in Australia, the UK and Bangladesh
        </p>

        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-black/5 shadow-xl bg-white">
          {/* Plain img with explicit dimensions for optimal Core Web Vitals & LCP */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/case-studies/property-compliance.svg"
            alt="A real custom compliance CRM dashboard built by The Digital Dude, managing rentals, agency counts and job status"
            width={1200}
            height={675}
            loading="eager"
            fetchPriority="high"
            className="block w-full h-auto"
          />
        </div>
      </section>

      {/* 2. Proof bar */}
      <section className="bg-lavender py-12">
        <div className="mx-auto grid max-w-content gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {proofBar.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-purple sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-navy/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The problem */}
      <section className="mx-auto max-w-content px-6 py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-2xl font-bold text-navy sm:text-3xl">
          Replace Spreadsheets with High-Performance Custom Software &amp; CRMs
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-navy/70">
          Most growing service businesses end up running on a patchwork: a spreadsheet for jobs,
          WhatsApp for the team, email for customers, and a tool nobody fully uses. It works until
          you grow. Then jobs slip, leads go cold, and nobody can see the whole picture.
        </p>
        <p className="mx-auto mt-4 max-w-2xl font-semibold text-navy">
          We replace the patchwork with one unified software system built around how your team actually works.
        </p>
      </section>

      {/* 4. What we build */}
      <section className="bg-lavender py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Custom Software &amp; CRM Capabilities We Build
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {whatWeBuild.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-purple">
                  <item.icon size={20} />
                </span>
                <h3 className="mt-4 font-bold text-navy group-hover:text-purple">{item.title}</h3>
                <p className="mt-2 text-sm text-navy/70">{item.body}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-1 font-semibold text-purple hover:underline"
            >
              Explore All Services <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Featured work */}
      <section className="mx-auto max-w-content px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
          Production Case Studies &amp; Delivered Software Systems
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-navy/70">
          Real production systems, live and in daily commercial use across Australia and the UK.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/work" className="inline-flex items-center gap-1 font-semibold text-purple hover:underline">
            Browse All Case Studies <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 6. Industries */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-content px-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Custom Systems Engineered for Operational Service Industries
          </h2>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {industryLinks.map((industry) => (
              <Link
                key={industry.slug}
                href={`/industries/${industry.slug}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm transition hover:border-white/60 hover:bg-white/10"
              >
                {industry.label}
              </Link>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-xl text-white/70">
            Running a service business somewhere else? If your team juggles jobs, bookings or
            leads across too many tools, we can help.
          </p>
        </div>
      </section>

      {/* 7. How we work */}
      <section className="mx-auto max-w-content px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
          Our Disciplined 6-Stage Software Engineering Process
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {howWeWorkSteps.map((step, index) => {
            const StepIcon = howWeWorkIcons[index];
            return (
              <div key={step} className="rounded-xl border border-tint bg-lavender p-4 text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple shadow-sm">
                  <StepIcon size={16} />
                </span>
                <span className="mt-2 block text-xs font-semibold text-purple">{index + 1}</span>
                <p className="mt-1 text-sm font-semibold text-navy">{step}</p>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-navy/70">
          Before any code is written, we agree a one-page brief: what we are building, what is out
          of scope, the deadline, and who owns each part. You see progress in a demo every two
          weeks.
        </p>
        <div className="mt-6 text-center">
          <Link href="/how-we-work" className="font-semibold text-purple hover:underline">
            Our 6-Stage Process &rarr;
          </Link>
        </div>
      </section>

      {/* 8. Why teams choose us */}
      <section className="bg-lavender py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Why High-Growth Companies Choose The Digital Dude
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {whyUs.map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-navy/70">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Verified Client Outcomes & Testimonials */}
      <section className="mx-auto max-w-content px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple">Production Proof</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">
            What Operations Leaders &amp; Founders Say
          </h2>
          <p className="text-sm text-navy/70 mt-2">
            Measurable operational improvements from bespoke platforms shipped across the UK and Australia.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {clientTestimonials.map((t, idx) => (
            <div key={idx} className="rounded-3xl border border-black/5 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-purple/10 px-2.5 py-1 text-xs font-bold text-purple">
                  <CheckCircle2 size={13} />
                  <span>{t.metric}</span>
                </div>
                <p className="text-sm text-navy/80 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-navy">{t.author}</p>
                <p className="text-[11px] text-navy/50">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Frequently Asked Questions */}
      <section className="bg-lavender/50 py-20 border-t border-black/5">
        <div className="mx-auto max-w-content px-6">
          <div className="max-w-3xl mx-auto mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Direct Answers</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">
              Frequently Asked Questions About Custom Software
            </h2>
            <p className="text-sm text-navy/60 mt-1">
              Clear, transparent answers on code ownership, delivery schedules, data migration, and post-launch SLAs.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <FaqAccordion faqs={homeFaqs} />
          </div>
        </div>
      </section>

      {/* 11. Final call to action */}
      <StandardCTA />
    </>
  );
}
