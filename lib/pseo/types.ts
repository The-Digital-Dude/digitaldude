export type PseoCategory = "location" | "solution" | "comparison" | "custom";

export interface PseoFaq {
  q: string;
  a: string;
}

export interface PseoStat {
  metric: string;
  label: string;
  detail: string;
}

export interface PseoComparisonRow {
  dimension: string;
  bespoke: string;
  competitorOrOffTheShelf: string;
}

export interface PseoLocation {
  city: string;
  slug: string;
  region: string;
  country: "United Kingdom" | "Australia";
  countryCode: "UK" | "AU";
  currency: "GBP" | "AUD";
  currencySymbol: "£" | "$";
  flag: string;
  timezone: string;
  heroTagline: string;
  localIntro: string;
  topIndustries: string[];
  suburbsAndAreas: string[];
  techEcosystemNotes: string;
  sampleClientsOrContext?: string;
}

export interface PseoIndustry {
  slug: string;
  name: string;
  iconName: string;
  badge: string;
  heroTagline: string;
  overview: string;
  corePainPoints: Array<{ title: string; desc: string }>;
  statutoryCompliance: string[];
  recommendedTechStack: string[];
  featuredCaseStudySlug: string;
  keyWorkflows: string[];
  faqs: PseoFaq[];
  stats: PseoStat[];
}

export interface PseoService {
  slug: string;
  name: string;
  navLabel: string;
  badge: string;
  oneLiner: string;
  headlinePrefix: string;
  coreDeliverables: string[];
  techStack: string[];
  roiHighlights: PseoStat[];
  baseMonthlyCostSaaS: number; // For ROI calculator reference
}

export interface PseoComparison {
  slug: string;
  competitorName: string;
  category: "CRM" | "Marketplace" | "ERP & Operations" | "Booking Engine" | "No-Code / Low-Code";
  targetNiche: string;
  summary: string;
  pricingModel: string;
  typicalMonthlyExpense: string;
  competitorDrawbacks: string[];
  bespokeAdvantages: string[];
  featureMatrix: PseoComparisonRow[];
  migrationTimeline: string;
  whoShouldSwitch: string;
  faqs: PseoFaq[];
}

export interface PseoPageData {
  id?: string;
  slug: string;
  category: PseoCategory;
  targetKeyword: string;
  title: string;
  metaDescription: string;
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  city?: string;
  country?: string;
  region?: string;
  currency?: string;
  currencySymbol?: string;
  industrySlug?: string;
  industryName?: string;
  serviceSlug?: string;
  serviceName?: string;
  competitorName?: string;
  featuredCaseStudySlug?: string;
  customContent?: string;
  faqs: PseoFaq[];
  stats: PseoStat[];
  comparisonMatrix?: PseoComparisonRow[];
  deliverables?: string[];
  techStack?: string[];
  breadcrumbs: Array<{ label: string; url: string }>;
  status?: "published" | "draft" | "archived";
}
