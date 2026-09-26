import type { Metadata } from "next";

export type SeoEntry = {
  title: string;
  description: string;
};

export const seo: Record<string, SeoEntry> = {
  home: {
    title: "Custom CRM & SaaS Development | The Digital Dude",
    description:
      "We build custom CRMs, SaaS platforms and operations systems for growing businesses in Australia and the UK. 7 shipped products. Book a call.",
  },
  work: {
    title: "Our Work: CRMs, SaaS & Marketplaces | The Digital Dude",
    description:
      "Seven live and delivered systems across property, travel, logistics, recruitment, education and home services. See what our team has built.",
  },
  "work/property-compliance-crm": {
    title: "Property Compliance CRM Case Study | The Digital Dude",
    description:
      "How we built a multi-portal compliance CRM now managing 4,000+ rentals across 30+ agencies in Australia, 4x faster than before.",
  },
  "work/airline-ticketing-crm": {
    title: "Travel Agency CRM Case Study | The Digital Dude",
    description:
      "A CRM for an Australian ticketing agency bringing WhatsApp, Facebook, phone and walk-in leads into one place with live KPIs.",
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
    title: "Custom Software Development Services | The Digital Dude",
    description:
      "CRMs, SaaS platforms, ERP and HRM systems, marketplaces and websites, built around how your business actually works.",
  },
  "services/crm-development": {
    title: "Custom CRM Development | The Digital Dude",
    description:
      "Custom CRMs built around your process: lead capture, pipelines, role-based portals and dashboards. For teams of 5 to 200.",
  },
  "services/saas-development": {
    title: "SaaS Development Company | The Digital Dude",
    description:
      "We build SaaS platforms from MVP to paying customers, with user accounts, subscriptions, admin tools and AI features.",
  },
  "services/erp-hrm-systems": {
    title: "Custom ERP & HRM Systems | The Digital Dude",
    description:
      "Connect operations, staff, payroll and reporting in one system built for multi-location and growing businesses.",
  },
  "services/marketplace-development": {
    title: "Marketplace App Development | The Digital Dude",
    description:
      "Customer, provider and admin apps built as one system, with upfront payments, job tracking and automatic payouts.",
  },
  "services/website-development": {
    title: "Website Development for Service Businesses | The Digital Dude",
    description:
      "Fast, search-friendly websites built in Next.js or WordPress to turn visitors into enquiries.",
  },
  "services/seo-growth": {
    title: "SEO & Growth Services | The Digital Dude",
    description:
      "Technical SEO, keyword research and growth tracking for businesses that want more of the right enquiries.",
  },
  "how-we-work": {
    title: "How We Work | The Digital Dude",
    description:
      "Our six-step process, typical timelines, payment terms and support after launch. No surprises in scope or cost.",
  },
  about: {
    title: "About Us | The Digital Dude",
    description:
      "A UK-registered software team based in Dhaka, building CRMs and SaaS platforms for businesses in Australia and the UK since 2020.",
  },
  contact: {
    title: "Book a Call | The Digital Dude",
    description:
      "Book a 30-minute call with our founder about how your business runs and whether a custom system would help.",
  },
  privacy: {
    title: "Privacy Policy | The Digital Dude",
    description: "How The Digital Dude collects, uses and protects your data.",
  },
};

export function buildMetadata(key: keyof typeof seo, path: string): Metadata {
  const entry = seo[key];
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: path },
    // Next.js replaces the whole openGraph/twitter object per segment rather
    // than deep-merging with the root layout's, so every field needed on a
    // page (including the image) has to be repeated here.
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: path,
      siteName: "The Digital Dude",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "The Digital Dude" }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: ["/og-image.png"],
    },
  };
}
