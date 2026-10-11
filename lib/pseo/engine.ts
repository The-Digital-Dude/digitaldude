import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { pseoLocations } from "./data/locations";
import { pseoServices } from "./data/services";
import { pseoIndustries } from "./data/industries";
import { pseoComparisons } from "./data/comparisons";
import { PseoPageData, PseoLocation, PseoService, PseoIndustry, PseoComparison } from "./types";

export const TIER1_LOCATIONS = new Set([
  "london",
  "manchester",
  "birmingham",
  "bristol",
  "leeds",
  "edinburgh",
  "sydney",
  "melbourne",
]);

export const TIER1_INDUSTRIES = new Set([
  "property",
  "logistics",
  "home-services",
  "community",
  "travel",
  "recruitment",
]);

function getShortServiceName(service: PseoService): string {
  switch (service.slug) {
    case "crm-development":
      return "CRM Development";
    case "saas-development":
      return "SaaS Development";
    case "marketplace-development":
      return "Marketplace Apps";
    case "erp-hrm-systems":
      return "ERP & Systems";
    case "website-development":
      return "Web Applications";
    case "seo-growth":
      return "Technical SEO";
    default:
      return service.navLabel;
  }
}

function getShortIndustryName(industry: PseoIndustry): string {
  switch (industry.slug) {
    case "property":
      return "Property & Real Estate";
    case "logistics":
      return "Logistics & Fleets";
    case "home-services":
      return "Home & Field Services";
    case "travel":
      return "Travel & Ticketing";
    case "recruitment":
      return "Recruitment & ATS";
    case "community":
      return "Community & Matchmaking";
    case "education":
      return "EdTech & LMS";
    default:
      return industry.name;
  }
}

/**
 * Generate Location x Service Programmatic Page Data
 */
export function buildLocationServicePage(location: PseoLocation, service: PseoService): PseoPageData {
  const shortService = getShortServiceName(service);

  // Exact target keyword and on-page optimization for Birmingham CRM Development (SEMrush Priority 6.82)
  const isBirminghamCrm = location.slug === "birmingham" && service.slug === "crm-development";
  // Exact target keyword and on-page optimization for Bristol Website Development (SEMrush Target)
  const isBristolWeb = location.slug === "bristol" && service.slug === "website-development";

  const targetKeyword = isBirminghamCrm
    ? "crm development company"
    : isBristolWeb
    ? "custom website development bristol"
    : `${service.name} in ${location.city}`;

  const title = isBirminghamCrm
    ? "CRM Development Company in Birmingham, UK | Digital Dude"
    : isBristolWeb
    ? "Custom Website Development Bristol, UK | Digital Dude"
    : `${shortService} in ${location.city}, ${location.countryCode} | Digital Dude`;

  const metaDescription = isBirminghamCrm
    ? "Leading CRM development company in Birmingham. We build custom CRM software, sales processes automation, and client portals with zero seat fees and 100% IP ownership."
    : isBristolWeb
    ? "Premier custom website development in Bristol. We build sub-second Next.js web applications, client portals, and bespoke platforms with zero technical debt."
    : `Bespoke ${service.navLabel.toLowerCase()} engineered for ${location.city} businesses. Full IP ownership, custom workflows, zero seat fees, and dedicated support.`;

  const heroBadge = `${location.flag} ${location.city} Engineering Hub • ${service.badge}`;

  const heroHeadline = isBirminghamCrm
    ? "Bespoke CRM Development Company in Birmingham"
    : isBristolWeb
    ? "Custom Website Development in Bristol for Innovative Growing Brands"
    : `${service.headlinePrefix} for High-Growth Businesses in ${location.city}`;

  const heroSubheadline = isBirminghamCrm
    ? "Looking for a dedicated CRM development company? We engineer fully custom CRM software and cloud based CRM systems tailored to West Midlands enterprises. Replace Salesforce and Microsoft Dynamics with dedicated workflow automation, real-time customer data, and zero per-seat licensing penalties."
    : isBristolWeb
    ? "Elevate your online presence with expert custom website development in Bristol. Our engineering team delivers bespoke web development and web design from start to finish, optimized for search engines and high-conversion search engine optimisation (SEO)."
    : `${location.localIntro} We engineer high-performance systems with zero per-seat fees, custom workflow logic, and full IP ownership.`;

  const faqs = isBirminghamCrm
    ? [
        {
          q: "Why partner with Digital Dude as your CRM development company in Birmingham?",
          a: "Unlike generic agencies or off-the-shelf consultants pushing Salesforce or Microsoft Dynamics, our dedicated team develops custom CRM solutions tailored 100% to your sales processes and customer data. We deliver cloud based CRM platforms with full IP ownership and zero monthly seat licensing fees."
        },
        {
          q: "How does workflow automation in your custom CRM software improve sales processes?",
          a: "Our CRM consultants architect real time customer data pipelines and automated lead routing, eliminating manual data entry for your sales team and providing management with live performance visibility."
        },
        {
          q: "Can you migrate our existing customer relationship management CRM data safely?",
          a: "Yes. As your bespoke CRM partner, we extract, sanitize, and migrate historical CRM data into a high-security PostgreSQL database with zero operational downtime."
        }
      ]
    : isBristolWeb
    ? [
        {
          q: "Why choose Digital Dude for custom website development in Bristol?",
          a: "We deliver full-cycle custom website development and web design from start to finish. Our Next.js web applications achieve sub-second load times that search engines highly reward, maximizing your online presence and organic search engine optimisation (SEO)."
        },
        {
          q: "How do your website designs compare to off-the-shelf WordPress templates?",
          a: "Our clients highly recommend our custom web development because we eliminate bloated plugin architectures. We build bespoke digital platforms tailored to your business brand with zero vulnerability risks and unmatched Core Web Vitals."
        },
        {
          q: "What is the delivery timeline for custom website development in Bristol?",
          a: "Most bespoke web applications and client portals progress from initial discovery and UI design to production deployment in 4 to 8 weeks."
        }
      ]
    : [
        {
          q: `Why choose Digital Dude for ${service.name.toLowerCase()} in ${location.city}?`,
          a: `We build bespoke systems tailored 100% to your operational reality. Unlike off-the-shelf software with recurring per-seat fees, our platforms are owned entirely by you, deployed on modern serverless architecture, and supported in your local timezone (${location.timezone}).`
        },
        {
          q: `Do you work with businesses across ${location.suburbsAndAreas.slice(0, 4).join(", ")} and ${location.region.startsWith("Greater ") ? location.region : `Greater ${location.region}`}?`,
          a: `Yes. We partner with fast-growing service enterprises, property agencies, logistics operators, and scaleups across all districts of ${location.city} and ${location.region.startsWith("Greater ") ? location.region : `the wider ${location.region}`}.`
        },
        {
          q: `What is the delivery timeline for a custom ${service.navLabel.toLowerCase()} project?`,
          a: `Most custom systems progress from initial architectural discovery to production rollout in 6 to 12 weeks, with weekly milestone demos and transparent staging environments.`
        }
      ];

  const stats = [
    { metric: "100%", label: "IP Ownership", detail: `You own 100% of the proprietary code and database, hosted securely in ${location.country}.` },
    ...service.roiHighlights
  ];

  const isTier1 = TIER1_LOCATIONS.has(location.slug);

  const deliverables = isBirminghamCrm
    ? [
        "Fully Custom CRM Software Architecture & Relational Schema",
        "Real-Time Sales Processes & Lead Pipeline Automation",
        "Granular Role-Based Permissions & Customer Data Governance",
        "Cloud Based CRM Infrastructure with Zero Per-Seat Licensing",
        "Dedicated CRM Consultants & Post-Launch Warranty Support"
      ]
    : isBristolWeb
    ? [
        "Sub-Second Next.js & React Web Application Engineering",
        "Bespoke Website Designs Optimized for Search Engines & SEO",
        "Client Portals & Interactive Self-Service Workflows",
        "Robust Online Presence Architecture Built from Start to Finish",
        "High-Performance Core Web Vitals & Conversion Funnel Optimization"
      ]
    : service.coreDeliverables;

  return {
    slug: `locations/${location.slug}/${service.slug}`,
    category: "location",
    targetKeyword,
    title,
    metaDescription,
    heroBadge,
    heroHeadline,
    heroSubheadline,
    city: location.city,
    country: location.country,
    region: location.region,
    currency: location.currency,
    currencySymbol: location.currencySymbol,
    serviceSlug: service.slug,
    serviceName: service.name,
    featuredCaseStudySlug: service.slug === "crm-development" ? "property-compliance-crm" : service.slug === "marketplace-development" ? "cleaning-marketplace" : "logistics-platform",
    faqs,
    stats,
    deliverables,
    techStack: service.techStack,
    breadcrumbs: [
      { label: "Home", url: "/" },
      { label: "Locations", url: "/locations" },
      { label: location.city, url: `/locations#${location.slug}` },
      { label: service.navLabel, url: `/locations/${location.slug}/${service.slug}` }
    ],
    isTier1,
    status: "published"
  };
}

/**
 * Generate Industry Solution x Service Programmatic Page Data
 */
export function buildIndustryServicePage(industry: PseoIndustry, service: PseoService): PseoPageData {
  const shortService = getShortServiceName(service);
  const shortIndustry = getShortIndustryName(industry);

  // Exact target keyword and on-page optimization for Community SaaS (SEMrush Target)
  const isCommunitySaas = industry.slug === "community" && service.slug === "saas-development";
  // Exact target keyword and on-page optimization for Logistics CRM (SEMrush Priority 2.24)
  const isLogisticsCrm = industry.slug === "logistics" && service.slug === "crm-development";

  const targetKeyword = isCommunitySaas
    ? "community saas"
    : isLogisticsCrm
    ? "crm for logistics"
    : `${service.name} for ${industry.name}`;

  const title = isCommunitySaas
    ? "Community SaaS Development & Member Platforms | Digital Dude"
    : isLogisticsCrm
    ? "Bespoke CRM for Logistics & Fleet Operations | Digital Dude"
    : `${shortService} for ${shortIndustry} | Digital Dude`;

  const metaDescription = isCommunitySaas
    ? "Scale your community saas platform with custom member portals, subscription billing, and verified profiles. Built for community-led growth."
    : isLogisticsCrm
    ? "Architect a bespoke CRM for logistics and transport operations. Unify dispatch, driver tracking, and customer communications with zero per-seat fees."
    : `Bespoke ${service.navLabel.toLowerCase()} for ${shortIndustry.toLowerCase()}. Eliminate spreadsheet chaos, automate compliance, and scale operations with full IP ownership.`;

  const heroBadge = `${industry.badge} • ${service.badge}`;

  const heroHeadline = isCommunitySaas
    ? "Bespoke Community SaaS Development for Scalable Member Networks"
    : isLogisticsCrm
    ? "Custom CRM for Logistics, Transport & Supply Chain Operations"
    : `${service.name} Engineered for ${industry.name}`;

  const heroSubheadline = isCommunitySaas
    ? "We engineer bespoke community saas platforms for ambitious saas companies and membership networks. Empower your community members with high-trust verification, custom landing pages, and thriving community spaces designed for community led growth."
    : isLogisticsCrm
    ? "We engineer high-performance CRM for logistics software and supply chain management systems. Empower your sales team, logistics operations, and freight brokers with unified customer data, real-time dispatch pipelines, and data driven account management."
    : `${industry.overview} We replace generic software constraints with bespoke multi-portal workflows, automated client delivery, and real-time operations dashboards.`;

  const faqs = isCommunitySaas
    ? [
        {
          q: "What makes custom community saas development superior to off-the-shelf community platforms?",
          a: "Generic tools like Circle or Mighty Networks restrict monetization models, lack custom database schemas, and lock you into closed ecosystems. A custom community saas platform allows saas businesses to integrate proprietary matchmaking algorithms, custom landing page funnels, and granular membership tiers with 100% IP ownership."
        },
        {
          q: "How does the platform support community led growth and member retention?",
          a: "We engineer dedicated portals for community members featuring automated onboarding sequences, direct messaging, verified profile badges, and dynamic event hubs that keep your thriving community engaged."
        },
        ...industry.faqs
      ]
    : isLogisticsCrm
    ? [
        {
          q: "Why build a custom CRM for logistics instead of using generic sales CRM software?",
          a: "Generic CRMs are built for standard software sales pipelines. A custom CRM for logistics connects freight brokers, dispatchers, and operations with real-time tracking, customer relationship management, shipment status telemetry, and automated rate quotes without spreadsheet workarounds."
        },
        {
          q: "How does logistics crm software improve customer service and account management?",
          a: "Our logistics crm solutions centralize customer information and historical shipment data into a single pane of glass, allowing your customer service team to resolve inquiries in seconds and manage sales pipelines with data driven precision."
        },
        ...industry.faqs
      ]
    : [
        ...industry.faqs,
        {
          q: `How does our bespoke ${service.navLabel.toLowerCase()} integrate with industry-specific compliance rules?`,
          a: `We build strict data validation and compliance tracking directly into your database schema (${industry.statutoryCompliance.slice(0, 3).join(", ")}), ensuring zero missed deadlines or compliance breaches.`
        }
      ];

  const deliverables = isCommunitySaas
    ? [
        "Multi-Tenant Community SaaS Architecture with Granular RBAC",
        "Engaging Community Members Portals & Verified Profiles",
        "High-Converting Landing Page & Membership Funnels",
        "Automated Recurring Subscription Billing (Stripe Billing)",
        "Scalable Infrastructure Engineered for Community Led Growth"
      ]
    : isLogisticsCrm
    ? [
        "Custom Logistics CRM Software Mapped to Supply Chain Operations",
        "Unified Freight Brokers & Sales Team Opportunity Pipelines",
        "Real-Time Customer Data & Order History Telemetry",
        "Automated Quote Generation & Instant Rate Card Calculators",
        "Data Driven Account Management & Dispatcher Dashboards"
      ]
    : industry.keyWorkflows;

  const isTier1 = TIER1_INDUSTRIES.has(industry.slug);

  return {
    slug: `solutions/${industry.slug}/${service.slug}`,
    category: "solution",
    targetKeyword,
    title,
    metaDescription,
    heroBadge,
    heroHeadline,
    heroSubheadline,
    industrySlug: industry.slug,
    industryName: industry.name,
    serviceSlug: service.slug,
    serviceName: service.name,
    featuredCaseStudySlug: industry.featuredCaseStudySlug,
    faqs,
    stats: industry.stats,
    deliverables: industry.keyWorkflows,
    techStack: industry.recommendedTechStack,
    breadcrumbs: [
      { label: "Home", url: "/" },
      { label: "Solutions", url: "/solutions" },
      { label: industry.name, url: `/solutions#${industry.slug}` },
      { label: service.navLabel, url: `/solutions/${industry.slug}/${service.slug}` }
    ],
    isTier1,
    status: "published"
  };
}

/**
 * Generate Comparison Page Data
 */
export function buildComparisonPage(comp: PseoComparison): PseoPageData {
  const targetKeyword = `Custom vs ${comp.competitorName}`;
  const title = `Custom vs ${comp.competitorName}: Complete Guide (2026)`;
  const metaDescription = `Compare custom software vs ${comp.competitorName} on pricing, workflow fit, IP ownership, and scalability. Honest architectural guide for growing teams.`;
  const heroBadge = `Build vs Buy Guide • ${comp.category} Comparison`;
  const heroHeadline = `Custom Software vs ${comp.competitorName}: The Complete Decision Guide`;
  const heroSubheadline = comp.summary;

  const stats = [
    { metric: "$0 / seat", label: "Marginal User Cost", detail: `Unlike ${comp.competitorName}, bespoke systems have zero per-user licensing fees.` },
    { metric: "100%", label: "IP Ownership", detail: "Proprietary software asset on your balance sheet rather than rented SaaS." },
    { metric: comp.migrationTimeline, label: "Rollout Velocity", detail: "End-to-end discovery, schema migration, and production deployment." }
  ];

  return {
    slug: `compare/${comp.slug}`,
    category: "comparison",
    targetKeyword,
    title,
    metaDescription,
    heroBadge,
    heroHeadline,
    heroSubheadline,
    competitorName: comp.competitorName,
    faqs: comp.faqs,
    stats,
    comparisonMatrix: comp.featureMatrix,
    deliverables: comp.bespokeAdvantages,
    techStack: ["Next.js 16", "Supabase PostgreSQL", "Tailwind CSS", "TypeScript", "Cloudflare CDN"],
    breadcrumbs: [
      { label: "Home", url: "/" },
      { label: "Compare", url: "/compare" },
      { label: `vs ${comp.competitorName}`, url: `/compare/${comp.slug}` }
    ],
    tcoModels: comp.tcoModels,
    whenToChoose: comp.whenToChoose,
    migrationRoadmap: comp.migrationRoadmap,
    architectureBlueprint: comp.architectureBlueprint,
    checklistItems: comp.checklistItems,
    calculatorConfig: comp.calculatorConfig,
    isTier1: true,
    status: "published"
  };
}

/**
 * Generate all static programmatic page items from code matrices
 */
export function getAllCodePseoPages(): PseoPageData[] {
  const pages: PseoPageData[] = [];

  // 1. Locations x Services (10 x 6 = 60 pages)
  for (const loc of pseoLocations) {
    for (const srv of pseoServices) {
      pages.push(buildLocationServicePage(loc, srv));
    }
  }

  // 2. Solutions / Industries x Services (7 x 6 = 42 pages)
  for (const ind of pseoIndustries) {
    for (const srv of pseoServices) {
      pages.push(buildIndustryServicePage(ind, srv));
    }
  }

  // 3. Comparisons (5+ pages)
  for (const comp of pseoComparisons) {
    pages.push(buildComparisonPage(comp));
  }

  return pages;
}

/**
 * Retrieve a specific PSEO page, checking Supabase for custom DB overrides first
 */
export async function getPseoPage(slug: string): Promise<PseoPageData | null> {
  const cleanSlug = slug.replace(/^\/+|\/+$/g, "");

  // 1. Check Supabase for DB override
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("pseo_pages")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (!error && data) {
        if (data.status === "archived") return null;

        return {
          id: data.id,
          slug: data.slug,
          category: data.category,
          targetKeyword: data.target_keyword || data.title,
          title: data.title,
          metaDescription: data.meta_description,
          heroBadge: data.hero_badge || "",
          heroHeadline: data.hero_headline,
          heroSubheadline: data.hero_subheadline || "",
          city: data.city,
          country: data.country,
          region: data.region,
          currency: data.currency,
          industrySlug: data.industry_slug,
          serviceSlug: data.service_slug,
          competitorName: data.competitor_name,
          featuredCaseStudySlug: data.featured_case_study_slug,
          customContent: data.custom_content,
          faqs: Array.isArray(data.faqs) ? data.faqs : [],
          stats: Array.isArray(data.stats) ? data.stats : [],
          comparisonMatrix: Array.isArray(data.comparison_matrix) ? data.comparison_matrix : undefined,
          breadcrumbs: [
            { label: "Home", url: "/" },
            { label: data.category.charAt(0).toUpperCase() + data.category.slice(1), url: `/${data.category === "location" ? "locations" : data.category === "solution" ? "solutions" : "compare"}` },
            { label: data.title, url: `/${data.slug}` }
          ],
          isTier1: true,
          status: data.status
        };
      }
    }
  } catch {}

  // 2. Resolve from code matrices
  const allCodePages = getAllCodePseoPages();
  const match = allCodePages.find((p) => p.slug === cleanSlug);
  return match || null;
}

/**
 * Get indexable PSEO slugs (Tier-1 high quality only) for XML sitemap
 */
export async function getIndexablePseoSlugs(): Promise<string[]> {
  const codePages = getAllCodePseoPages().filter((p) => p.isTier1);
  const slugSet = new Set(codePages.map((p) => p.slug));

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("pseo_pages")
        .select("slug, status");

      if (data) {
        for (const row of data) {
          if (row.status === "archived") {
            slugSet.delete(row.slug);
          } else if (row.status === "published") {
            slugSet.add(row.slug);
          }
        }
      }
    }
  } catch {}

  return Array.from(slugSet);
}

/**
 * Get all available PSEO slugs for Next.js generateStaticParams
 */
export async function getAllPseoSlugs(): Promise<string[]> {
  const codePages = getAllCodePseoPages();
  const slugSet = new Set(codePages.map((p) => p.slug));

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("pseo_pages")
        .select("slug, status");

      if (data) {
        for (const row of data) {
          if (row.status === "archived") {
            slugSet.delete(row.slug);
          } else if (row.status === "published") {
            slugSet.add(row.slug);
          }
        }
      }
    }
  } catch {}

  return Array.from(slugSet);
}
