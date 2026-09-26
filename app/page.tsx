import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Users, Cloud, Building2, Store, Globe, Search, PenTool, Code2, CheckCircle2, Rocket, PackageCheck } from "lucide-react";
import { buildMetadata } from "@/lib/content/seo";
import { caseStudies } from "@/lib/content/caseStudies";
import { services } from "@/lib/content/services";
import { ProjectCard } from "@/components/ProjectCard";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("home", "/");

const proofBar = [
  { value: "4,000+", label: "rentals managed on one of our CRMs" },
  { value: "30+", label: "agencies running on the same platform" },
  { value: "4x", label: "faster than the system it replaced" },
  { value: "40%", label: "faster response coordination for a logistics team" },
];

const whatWeBuild = [
  {
    title: "CRMs",
    body: "Leads, customers, jobs and follow-ups in one place, shaped around your process.",
    href: "/services/crm-development",
    icon: Users,
  },
  {
    title: "SaaS platforms",
    body: "Subscription products with portals, billing and user roles, ready to sell.",
    href: "/services/saas-development",
    icon: Cloud,
  },
  {
    title: "ERP and HRM systems",
    body: "Operations, staff, payroll and reporting connected in one system.",
    href: "/services/erp-hrm-systems",
    icon: Building2,
  },
  {
    title: "Marketplaces and apps",
    body: "Customer app, provider app and admin, working as one.",
    href: "/services/marketplace-development",
    icon: Store,
  },
  {
    title: "Websites",
    body: "Fast, search-friendly sites built to bring in enquiries.",
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
    body: "We map how your team works first, then build the system to fit, not the other way around.",
  },
  {
    title: "One team, start to finish.",
    body: "Scoping, design, development and launch all happen in-house. No hand-offs between agencies.",
  },
  {
    title: "Scope agreed before code.",
    body: "You know exactly what you are getting, when, and for how much.",
  },
  {
    title: "You own it.",
    body: "The code, the data and every account are yours.",
  },
];

export default function HomePage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Digital Dude",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full-color.png`,
    email: "info@digitaldude.co.uk",
    foundingDate: "2020",
    description:
      "We build custom CRMs, SaaS platforms and operations systems for growing businesses in Australia and the UK.",
  };

  const featuredProjects = featuredSlugs
    .map((slug) => caseStudies.find((c) => c.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* 1. Hero */}
      <section className="mx-auto max-w-content px-6 pb-16 pt-32 text-center sm:pt-44">
        <span className="text-sm font-semibold uppercase tracking-wide text-purple">
          We build systems that scale
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold text-navy sm:text-5xl">
          We build the systems growing businesses run on.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-navy/70">
          Custom CRMs, SaaS platforms and operations systems for service businesses in Australia
          and the UK. One team, from first call to live launch.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-purple px-8 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Book a 30-minute call
          </Link>
          <Link
            href="/work"
            className="rounded-full border border-navy/20 px-8 py-3 font-semibold text-navy"
          >
            See our work
          </Link>
        </div>
        <p className="mt-8 text-sm text-navy/60">
          7 live and delivered products · 5 industries · Clients in Australia, the UK and Bangladesh
        </p>

        <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-black/5 shadow-xl">
          <img
            src="/images/case-studies/property-compliance.svg"
            alt="A real dashboard we built, showing rentals managed, agency counts and job status"
            className="block w-full"
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
          Spreadsheets were never meant to run a business.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-navy/70">
          Most growing service businesses end up running on a patchwork: a spreadsheet for jobs,
          WhatsApp for the team, email for customers, and a tool nobody fully uses. It works until
          you grow. Then jobs slip, leads go cold, and nobody can see the whole picture.
        </p>
        <p className="mx-auto mt-4 max-w-2xl font-semibold text-navy">
          We replace the patchwork with one system built around how your team actually works.
        </p>
      </section>

      {/* 4. What we build */}
      <section className="bg-lavender py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">What we build</h2>
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
              className="inline-flex items-center gap-1 font-semibold text-purple"
            >
              See all services <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Featured work */}
      <section className="mx-auto max-w-content px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
          What our team has shipped
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-navy/70">
          Real products, live and in daily use. Client names stay private, the results don&rsquo;t.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/work" className="inline-flex items-center gap-1 font-semibold text-purple">
            See all 7 projects <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* 6. Industries */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-content px-6 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Built for businesses with real operations
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
          A clear process, no surprises
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
          <Link href="/how-we-work" className="font-semibold text-purple">
            How we work
          </Link>
        </div>
      </section>

      {/* 8. Why teams choose us */}
      <section className="bg-lavender py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Why teams choose us
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

      {/*
        Testimonials: hidden until at least two real client quotes exist.
        Restore this section (see git history) once you have them — do not
        launch with placeholder quotes.
      */}

      {/* 10. Final call to action */}
      <StandardCTA />
    </>
  );
}
