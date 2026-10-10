import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export type SeoEntry = {
  title: string;
  description: string;
  category?: string;
  keywords?: string[];
};

export const seo: Record<string, SeoEntry> = {
  home: {
    title: "Custom CRM, SaaS & Marketplace Systems | The Digital Dude",
    description:
      "We design, architect and build bespoke CRMs, multi-tenant SaaS platforms, and operational systems for high-growth service businesses in the UK and Australia.",
    keywords: [
      "custom CRM development UK",
      "bespoke CRM software Australia",
      "SaaS engineering agency",
      "custom marketplace software development",
      "operational software systems",
      "Next.js web application development"
    ],
  },
  work: {
    title: "Bespoke Software & CRM Case Studies | Digital Dude",
    description:
      "Explore production systems shipped across property, logistics, and marketplaces. Real case studies with measurable efficiency and conversion lifts.",
    keywords: [
      "software case studies",
      "custom CRM case study",
      "SaaS architecture examples",
      "marketplace app case study"
    ],
  },
  "work/property-compliance-crm": {
    title: "Property Compliance CRM Case Study | Digital Dude",
    description:
      "How we built a multi-portal compliance CRM managing 4,000+ rental properties across 30+ real estate agencies, delivering 4x faster turnaround times.",
  },
  "work/airline-ticketing-crm": {
    title: "Travel Agency Ticketing CRM Study | Digital Dude",
    description:
      "How we built a multi-channel ticketing CRM unifying WhatsApp, Facebook, phone, and walk-in leads into a high-converting automated sales pipeline.",
  },
  "work/matrimony-saas-platform": {
    title: "Matchmaking SaaS Platform Study | Digital Dude",
    description:
      "Engineering a high-trust membership platform with 5-tier identity verification, automated compatibility scoring, and recurring subscription billing.",
  },
  "work/cleaning-marketplace": {
    title: "Cleaning Marketplace App Study | Digital Dude",
    description:
      "A three-sided on-demand cleaning platform connecting customer booking, contractor mobile apps with photo verification, and central ops dispatch.",
  },
  "work/logistics-platform": {
    title: "Logistics Coordination Platform | Digital Dude",
    description:
      "Mobile breakdown and fleet coordination platform that cut emergency response delays by 40% with real-time GPS tracking and instant digital PODs.",
  },
  "work/recruitment-crm": {
    title: "Custom Recruitment CRM Study | Digital Dude",
    description:
      "How we engineered a bespoke applicant tracking system and candidate portal with automated WhatsApp status triggers and zero per-seat software fees.",
  },
  "work/ai-tutoring-platform": {
    title: "AI Tutoring Platform Case Study | Digital Dude",
    description:
      "An intelligent learning management platform featuring automated quiz generation, instant test grading, and dedicated student and parent portals.",
  },
  services: {
    title: "Bespoke Software Engineering Services | Digital Dude",
    description:
      "Custom CRMs, multi-tenant SaaS platforms, ERP systems, and on-demand marketplaces engineered for high ROI, full IP ownership, and zero seat bloat.",
    keywords: [
      "custom software development services",
      "bespoke CRM developers",
      "SaaS product development company",
      "enterprise operations software"
    ],
  },
  "services/crm-development": {
    title: "Custom CRM Development UK & Australia | Digital Dude",
    description:
      "Replace spreadsheet chaos with bespoke sales pipelines, mobile field technician apps, and role-based portals built for your exact operational workflow.",
    keywords: [
      "custom CRM development",
      "bespoke CRM developers UK",
      "custom CRM Australia",
      "field service CRM development",
      "spreadsheet replacement software"
    ],
  },
  "services/saas-development": {
    title: "Full-Stack SaaS Product Development | Digital Dude",
    description:
      "End-to-end SaaS engineering: multi-tenant cloud schemas, Stripe billing, granular RBAC permissions, and high-concurrency architecture built to scale.",
    keywords: [
      "SaaS product development",
      "SaaS MVP builder",
      "multi-tenant SaaS architecture",
      "Next.js SaaS development",
      "Stripe billing integration"
    ],
  },
  "services/erp-hrm-systems": {
    title: "Custom ERP & Operations Systems | Digital Dude",
    description:
      "Unified operational engines connecting multi-location staffing, automated timesheet approvals, resource allocation, and real-time business metrics.",
    keywords: [
      "custom ERP development",
      "custom HRM software",
      "multi-location operations software",
      "automated payroll systems"
    ],
  },
  "services/marketplace-development": {
    title: "Two-Sided Marketplace App Development | Digital Dude",
    description:
      "Synchronized marketplace software connecting customer booking, service provider dispatch, and central admin with automated Stripe Connect payouts.",
    keywords: [
      "marketplace app development",
      "on-demand service platform development",
      "3-sided marketplace architecture",
      "Stripe Connect marketplace"
    ],
  },
  "services/website-development": {
    title: "High-Performance Web Applications | Digital Dude",
    description:
      "Sub-second Next.js web applications and conversion-optimized digital experiences built for sub-second page loads, Core Web Vitals, and lead generation.",
    keywords: [
      "Next.js web development agency",
      "high performance web application",
      "Core Web Vitals optimization"
    ],
  },
  "services/seo-growth": {
    title: "Technical SEO & GEO Search Engineering | Digital Dude",
    description:
      "Programmatic SEO, Schema.org graph engineering, and Core Web Vitals performance built to maximize indexation and authority across Google and AI search.",
    keywords: [
      "technical SEO agency",
      "Answer Engine Optimization AEO",
      "Generative Engine Optimization GEO",
      "programmatic SEO Next.js",
      "Schema.org structured data"
    ],
  },
  "how-we-work": {
    title: "Engineering Process & Fixed Delivery | Digital Dude",
    description:
      "Transparent 6-stage delivery framework, agile sprint milestones, fixed proposals, and 30-day post-launch warranty with zero hidden scope drift.",
    keywords: [
      "software development process",
      "agile delivery methodology",
      "fixed price software development"
    ],
  },
  about: {
    title: "About The Digital Dude | Software Engineering Studio",
    description:
      "UK-registered engineering team with international delivery studios, building bespoke CRMs and SaaS platforms for UK and Australian businesses since 2020.",
  },
  contact: {
    title: "Book a Technical Discovery Consultation | Digital Dude",
    description:
      "Schedule a 30-minute technical discovery call with our founder. We'll map your system requirements, architecture, timelines, and fixed delivery scope.",
  },
  privacy: {
    title: "Privacy Policy | The Digital Dude",
    description: "How The Digital Dude collects, uses, encrypts, and protects your data.",
  },
  terms: {
    title: "Terms and Conditions | The Digital Dude",
    description: "The operational terms that govern client agreements, IP ownership, and project warranties.",
  },
  "industries/property": {
    title: "Property & Real Estate CRM Software | Digital Dude",
    description:
      "Bespoke multi-portal software for real estate agencies, property managers, and field compliance technicians. 4,000+ rental properties actively managed.",
    keywords: [
      "property management CRM",
      "real estate compliance software",
      "smoke alarm inspection software Australia",
      "field technician property app"
    ],
  },
  "industries/travel": {
    title: "Travel Agency Ticketing CRM Software | Digital Dude",
    description:
      "Omnichannel ticketing CRMs integrating WhatsApp, Facebook Messenger, phone, and walk-in leads into one centralized quotation and conversion engine.",
    keywords: [
      "travel agency CRM",
      "flight ticketing CRM",
      "WhatsApp lead management travel",
      "GDS quotation software"
    ],
  },
  "industries/home-services": {
    title: "Home & Field Services Dispatch Software | Digital Dude",
    description:
      "End-to-end dispatch, upfront Stripe payment authorization, mobile technician photo proof, and automated client invoicing for cleaning and home services.",
    keywords: [
      "home service dispatch software",
      "cleaning business CRM",
      "field service mobile app with photo proof"
    ],
  },
  "industries/logistics": {
    title: "Logistics & Fleet Dispatch Software | Digital Dude",
    description:
      "Mobile-first fleet breakdown management, real-time driver routing, and automated dispatcher coordination systems that cut response times by 40%.",
    keywords: [
      "logistics coordination software",
      "fleet dispatch app",
      "breakdown management system"
    ],
  },
  "industries/recruitment": {
    title: "Custom Recruitment CRM & ATS Software | Digital Dude",
    description:
      "High-speed recruitment pipelines with self-service candidate document portals, automated WhatsApp status triggers, and placement KPI dashboards.",
    keywords: [
      "custom recruitment CRM",
      "candidate portal software",
      "recruitment automation WhatsApp"
    ],
  },
  "industries/education": {
    title: "Custom LMS & EdTech Platform Software | Digital Dude",
    description:
      "AI-driven learning management systems with automated question generation, instant grading, interactive lesson hubs, and parent progress portals.",
    keywords: [
      "AI tutoring platform development",
      "custom LMS software",
      "AI grading and quiz software"
    ],
  },
  "industries/community": {
    title: "Community & Matchmaking SaaS Platforms | Digital Dude",
    description:
      "Secure community platforms engineered with AI compatibility scoring, 5-tier police check/identity verification, and encrypted subscriber portals.",
    keywords: [
      "matchmaking platform development",
      "community SaaS software",
      "identity verification platform"
    ],
  },
};

export function buildMetadata(key: keyof typeof seo, path: string): Metadata {
  const entry = seo[key];
  if (!entry) throw new Error(`Missing SEO entry for key: "${key}". Add it to lib/content/seo.ts.`);

  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(entry.title)}&tag=${encodeURIComponent(entry.description.slice(0, 90))}&category=${encodeURIComponent(entry.category || "Engineering")}`;

  return {
    title: entry.title,
    description: entry.description,
    keywords: entry.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: canonicalUrl,
      siteName: "The Digital Dude",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: entry.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: [ogImageUrl],
    },
  };
}
