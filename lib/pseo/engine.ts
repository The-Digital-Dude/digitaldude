import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { pseoLocations } from "./data/locations";
import { pseoServices } from "./data/services";
import { pseoIndustries } from "./data/industries";
import { pseoComparisons } from "./data/comparisons";
import { PseoPageData, PseoLocation, PseoService, PseoIndustry, PseoComparison } from "./types";

/**
 * Generate Location x Service Programmatic Page Data
 */
export function buildLocationServicePage(location: PseoLocation, service: PseoService): PseoPageData {
  const targetKeyword = `${service.name} in ${location.city}`;
  const title = `${service.name} in ${location.city}, ${location.countryCode} | The Digital Dude`;
  const metaDescription = `Looking for ${service.name.toLowerCase()} in ${location.city}? We design & build bespoke ${service.navLabel.toLowerCase()} and operational systems for ${location.city} businesses with zero per-seat licensing.`;
  const heroBadge = `${location.flag} ${location.city} Engineering Hub • ${service.badge}`;
  const heroHeadline = `${service.headlinePrefix} for High-Growth Businesses in ${location.city}`;
  const heroSubheadline = `${location.localIntro} We engineer high-performance systems with zero per-seat fees, custom workflow logic, and full IP ownership.`;

  const faqs = [
    {
      q: `Why choose Digital Dude for ${service.name.toLowerCase()} in ${location.city}?`,
      a: `We build bespoke systems tailored 100% to your operational reality. Unlike off-the-shelf software with recurring per-seat fees, our platforms are owned entirely by you, deployed on modern serverless architecture, and supported in your local timezone (${location.timezone}).`
    },
    {
      q: `Do you work with businesses across ${location.suburbsAndAreas.slice(0, 4).join(", ")} and Greater ${location.region}?`,
      a: `Yes. We partner with fast-growing service enterprises, property agencies, logistics operators, and scaleups across all districts of ${location.city} and the wider ${location.region}.`
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
    deliverables: service.coreDeliverables,
    techStack: service.techStack,
    breadcrumbs: [
      { label: "Home", url: "/" },
      { label: "Locations", url: "/locations" },
      { label: location.city, url: `/locations#${location.slug}` },
      { label: service.navLabel, url: `/locations/${location.slug}/${service.slug}` }
    ],
    status: "published"
  };
}

/**
 * Generate Industry Solution x Service Programmatic Page Data
 */
export function buildIndustryServicePage(industry: PseoIndustry, service: PseoService): PseoPageData {
  const targetKeyword = `${service.name} for ${industry.name}`;
  const title = `${service.name} for ${industry.name} | The Digital Dude`;
  const metaDescription = `Engineered ${service.name.toLowerCase()} for ${industry.name.toLowerCase()}. Eliminate spreadsheet chaos, automate compliance, and scale operations with bespoke portals.`;
  const heroBadge = `${industry.badge} • ${service.badge}`;
  const heroHeadline = `${service.name} Engineered for ${industry.name}`;
  const heroSubheadline = `${industry.overview} We replace generic software constraints with bespoke multi-portal workflows, automated client delivery, and real-time operations dashboards.`;

  const faqs = [
    ...industry.faqs,
    {
      q: `How does our bespoke ${service.navLabel.toLowerCase()} integrate with industry-specific compliance rules?`,
      a: `We build strict data validation and compliance tracking directly into your database schema (${industry.statutoryCompliance.slice(0, 3).join(", ")}), ensuring zero missed deadlines or compliance breaches.`
    }
  ];

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
    status: "published"
  };
}

/**
 * Generate Comparison Page Data
 */
export function buildComparisonPage(comp: PseoComparison): PseoPageData {
  const targetKeyword = `Bespoke Software vs ${comp.competitorName}`;
  const title = `Bespoke Software vs ${comp.competitorName} | Which Is Right For Your Business?`;
  const metaDescription = `Comparing custom software vs ${comp.competitorName} for ${comp.targetNiche.toLowerCase()}. Compare pricing, feature flexibility, IP ownership, and scalability.`;
  const heroBadge = `Build vs Buy Guide • ${comp.category} Comparison`;
  const heroHeadline = `Bespoke Software vs ${comp.competitorName}: The Complete Comparison`;
  const heroSubheadline = comp.summary;

  const stats = [
    { metric: "£0 / seat", label: "Marginal User Cost", detail: `Unlike ${comp.competitorName}, custom software has zero per-user licensing fees.` },
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
