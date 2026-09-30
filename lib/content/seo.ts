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
    title: "Bespoke Software & CRM Case Studies | The Digital Dude",
    description:
      "Explore production systems built and shipped across property, travel, logistics, recruitment, education, and on-demand marketplaces.",
    keywords: [
      "software case studies",
      "custom CRM case study",
      "SaaS architecture examples",
      "marketplace app case study"
    ],
  },
  "work/property-compliance-crm": {
    title: "Property Compliance CRM Case Study | The Digital Dude",
    description:
      "How we built a multi-portal compliance CRM now managing 4,000+ rentals across 30+ agencies in Australia, 4x faster than before.",
  },
  "work/airline-ticketing-crm": {
    title: "Travel Agency CRM Case Study | The Digital Dude",
    description:
      "A multi-channel ticketing CRM for an Australian travel agency consolidating WhatsApp, Facebook, phone and walk-in leads into one pipeline.",
  },
  "work/matrimony-saas-platform": {
    title: "Matchmaking SaaS Platform Case Study | The Digital Dude",
    description:
      "A premium matchmaking platform with AI matching, 5-tier identity and police check verification, and subscription billing.",
  },
  "work/cleaning-marketplace": {
    title: "Cleaning Marketplace App Case Study | The Digital Dude",
    description:
      "A three-app cleaning platform: customer booking with upfront payment, a cleaner app with photo proof, and an admin CRM.",
  },
  "work/logistics-platform": {
    title: "Logistics Coordination Platform | The Digital Dude",
    description:
      "A mobile-first breakdown management platform for drivers and dispatch that improved response coordination by 40%.",
  },
  "work/recruitment-crm": {
    title: "Recruitment CRM Case Study | The Digital Dude",
    description:
      "A recruitment CRM with a real-time candidate portal, document tracking and automated WhatsApp and email updates.",
  },
  "work/ai-tutoring-platform": {
    title: "AI Tutoring Platform Case Study | The Digital Dude",
    description:
      "A tutoring platform with AI-generated quizzes, automatic grading and a parent and student portal.",
  },
  services: {
    title: "Bespoke Software Engineering & Technical Services | The Digital Dude",
    description:
      "Custom CRMs, multi-tenant SaaS platforms, ERP/HRM operations engines, and scalable on-demand marketplaces engineered for high ROI.",
    keywords: [
      "custom software development services",
      "bespoke CRM developers",
      "SaaS product development company",
      "enterprise operations software"
    ],
  },
  "services/crm-development": {
    title: "Custom CRM Development Company UK & Australia | The Digital Dude",
    description:
      "Replace spreadsheet bottlenecks and rigid off-the-shelf CRMs with bespoke sales, dispatch, mobile field apps, and role-based portals tailored to your exact workflow.",
    keywords: [
      "custom CRM development",
      "bespoke CRM developers UK",
      "custom CRM Australia",
      "field service CRM development",
      "spreadsheet replacement software"
    ],
  },
  "services/saas-development": {
    title: "Full-Stack SaaS Product Development Agency | The Digital Dude",
    description:
      "End-to-end SaaS engineering: multi-tenant architecture, Stripe recurring billing, role-based access control (RBAC), AI integrations, and high-concurrency cloud infrastructure.",
    keywords: [
      "SaaS product development",
      "SaaS MVP builder",
      "multi-tenant SaaS architecture",
      "Next.js SaaS development",
      "Stripe billing integration"
    ],
  },
  "services/erp-hrm-systems": {
    title: "Custom ERP & HRM Systems Development | The Digital Dude",
    description:
      "Unified operational engines connecting multi-location staffing, automated payroll, resource allocation, and real-time business intelligence.",
    keywords: [
      "custom ERP development",
      "custom HRM software",
      "multi-location operations software",
      "automated payroll systems"
    ],
  },
  "services/marketplace-development": {
    title: "3-Sided Marketplace App Development | The Digital Dude",
    description:
      "Synchronized marketplace architecture connecting customer booking apps, service provider mobile dispatch, and central operations admin with automated Stripe payouts.",
    keywords: [
      "marketplace app development",
      "on-demand service platform development",
      "3-sided marketplace architecture",
      "Stripe Connect marketplace"
    ],
  },
  "services/website-development": {
    title: "High-Performance Web Application Engineering | The Digital Dude",
    description:
      "Sub-second Next.js web applications and conversion-optimized digital experiences built for sub-second page loads, Core Web Vitals, and lead generation.",
    keywords: [
      "Next.js web development agency",
      "high performance web application",
      "Core Web Vitals optimization"
    ],
  },
  "services/seo-growth": {
    title: "Technical SEO, AEO & Generative Search Engineering | The Digital Dude",
    description:
      "Programmatic SEO, Answer Engine Optimization (AEO), Schema.org graph engineering, and Core Web Vitals performance to dominate Google, ChatGPT, and Perplexity.",
    keywords: [
      "technical SEO agency",
      "Answer Engine Optimization AEO",
      "Generative Engine Optimization GEO",
      "programmatic SEO Next.js",
      "Schema.org structured data"
    ],
  },
  "how-we-work": {
    title: "Engineering Process, Timelines & Fixed Scope | The Digital Dude",
    description:
      "Transparent 6-stage delivery framework, agile sprint milestones, fixed proposals, and 30-day post-launch warranty with zero scope ambiguity.",
    keywords: [
      "software development process",
      "agile delivery methodology",
      "fixed price software development"
    ],
  },
  about: {
    title: "About The Digital Dude | Engineering & Technical Growth Team",
    description:
      "UK-registered engineering team with international delivery hubs, building production CRMs and scalable SaaS platforms for businesses in the UK and Australia since 2020.",
  },
  contact: {
    title: "Book a 30-Minute Discovery Consultation | The Digital Dude",
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
    title: "Custom CRM & Compliance Software for Property & Real Estate | The Digital Dude",
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
    title: "Custom CRM & Lead Routing Software for Travel Agencies | The Digital Dude",
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
    title: "On-Demand Booking & Dispatch Software for Home Services | The Digital Dude",
    description:
      "End-to-end dispatch, upfront Stripe payment authorization, mobile technician photo proof, and automated client invoicing for cleaning and home services.",
    keywords: [
      "home service dispatch software",
      "cleaning business CRM",
      "field service mobile app with photo proof"
    ],
  },
  "industries/logistics": {
    title: "Dispatch & Fleet Coordination Software for Logistics | The Digital Dude",
    description:
      "Mobile-first fleet breakdown management, real-time driver routing, and automated dispatcher coordination systems that cut response times by 40%.",
    keywords: [
      "logistics coordination software",
      "fleet dispatch app",
      "breakdown management system"
    ],
  },
  "industries/recruitment": {
    title: "Candidate Portal & Automated Recruitment CRM | The Digital Dude",
    description:
      "High-speed recruitment pipelines with self-service candidate document portals, automated WhatsApp status triggers, and placement KPI dashboards.",
    keywords: [
      "custom recruitment CRM",
      "candidate portal software",
      "recruitment automation WhatsApp"
    ],
  },
  "industries/education": {
    title: "AI Tutoring Platforms & LMS Software for Education | The Digital Dude",
    description:
      "AI-driven learning management systems with automated question generation, instant grading, interactive lesson hubs, and parent progress portals.",
    keywords: [
      "AI tutoring platform development",
      "custom LMS software",
      "AI grading and quiz software"
    ],
  },
  "industries/community": {
    title: "High-Trust Community & Matchmaking SaaS Platforms | The Digital Dude",
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
