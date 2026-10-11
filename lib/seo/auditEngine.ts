export type SeoIssueCategory = 'metadata' | 'content' | 'schema' | 'crawlability' | 'backlinks' | 'general';
export type SeoIssueStatus = 'open' | 'resolved' | 'dismissed';

export interface SeoAuditIssue {
  id: string;
  audit_filename: string;
  url: string;
  pathname: string;
  target_keyword?: string;
  priority: number;
  category: SeoIssueCategory;
  issue_text: string;
  suggested_fix?: {
    field?: 'title' | 'h1' | 'meta_description' | 'body' | 'schema' | 'content' | 'backlinks' | 'technical' | 'general';
    actionDescription?: string;
    recommendedValue?: string;
    extractedKeywords?: string[];
    suggestedSchemaType?: 'LocalBusiness' | 'Product' | 'SoftwareApplication';
  };
  status: SeoIssueStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export function extractPathnameFromUrl(url: string): string {
  try {
    if (url.startsWith("/")) return url;
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    const cleaned = url.replace(/https?:\/\/[^\/]+/, "");
    return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  }
}

export function categorizeSeoIdea(ideaText: string): SeoIssueCategory {
  const lower = ideaText.toLowerCase();

  if (
    lower.includes("h1") ||
    lower.includes("title") ||
    lower.includes("meta description") ||
    lower.includes("meta` tag") ||
    lower.includes("body` tag") ||
    lower.includes("target keyword")
  ) {
    return "metadata";
  }

  if (
    lower.includes("word count") ||
    lower.includes("readability") ||
    lower.includes("dwell time") ||
    lower.includes("spending on this page") ||
    lower.includes("repeated in your") ||
    lower.includes("video is used") ||
    lower.includes("related words")
  ) {
    return "content";
  }

  if (
    lower.includes("localbusiness") ||
    lower.includes("product markup") ||
    lower.includes("aggregate rating") ||
    lower.includes("schema")
  ) {
    return "schema";
  }

  if (
    lower.includes("crawler couldn") ||
    lower.includes("crawl more pages") ||
    lower.includes("couldn't find this page") ||
    lower.includes("index")
  ) {
    return "crawlability";
  }

  if (lower.includes("backlinks from") || lower.includes("domains:")) {
    return "backlinks";
  }

  return "general";
}

export function synthesizeSuggestedFix(
  ideaText: string,
  pathname: string,
  targetKeyword: string
): SeoAuditIssue["suggested_fix"] {
  const lower = ideaText.toLowerCase();
  const kw = targetKeyword ? targetKeyword.trim() : "";

  // 1. Missing H1 keyword
  if (lower.includes("h1") && lower.includes("not contain")) {
    const capKw = kw ? kw.charAt(0).toUpperCase() + kw.slice(1) : "";
    return {
      field: "h1",
      actionDescription: `Inject target keyword "${kw}" into the page <h1> header`,
      recommendedValue: capKw ? `${capKw} Architecture & Bespoke Systems` : undefined,
    };
  }

  // 2. Missing Title tag keyword
  if (lower.includes("title") && lower.includes("not contain")) {
    const capKw = kw ? kw.charAt(0).toUpperCase() + kw.slice(1) : "";
    return {
      field: "title",
      actionDescription: `Add target keyword "${kw}" to the HTML <title> tag`,
      recommendedValue: capKw ? `${capKw} | Digital Dude` : undefined,
    };
  }

  // 3. Missing Meta Description keyword
  if (lower.includes("meta") && (lower.includes("not contain") || lower.includes("meta description"))) {
    return {
      field: "meta_description",
      actionDescription: `Include target keyword "${kw}" within the meta description (130-155 characters)`,
      recommendedValue: kw
        ? `Leading ${kw} engineered for high-growth businesses. Custom workflows, zero per-seat fees, and 100% proprietary code ownership.`
        : undefined,
    };
  }

  // 4. Missing Semantic Related Words
  if (lower.includes("related words are not present")) {
    const matches = ideaText.match(/`([^`]+)`/g) || [];
    const extractedKeywords = matches.map((m) => m.replace(/`/g, "").trim());
    return {
      field: "content",
      actionDescription: `Enrich page copy with semantically correlated terms to match ranking rivals`,
      extractedKeywords,
    };
  }

  // 5. Backlink domain acquisition
  if (lower.includes("backlinks from")) {
    const domainsPart = ideaText.split(/domains:\s*/i)[1] || "";
    const domains = domainsPart
      .split(/,\s*/)
      .map((d) => d.trim())
      .filter(Boolean);
    return {
      field: "backlinks",
      actionDescription: `Competitor backlink sources identified for outreach`,
      extractedKeywords: domains,
    };
  }

  // 6. Schema & Aggregate Rating
  if (lower.includes("localbusiness markup")) {
    return {
      field: "schema",
      actionDescription: `Add LocalBusiness Schema.org structured data with AggregateRating`,
      suggestedSchemaType: "LocalBusiness",
    };
  }

  if (lower.includes("product markup")) {
    return {
      field: "schema",
      actionDescription: `Add Product / SoftwareApplication Schema.org structured data with AggregateRating`,
      suggestedSchemaType: "Product",
    };
  }

  // 7. Crawlability
  if (lower.includes("crawler couldn")) {
    return {
      field: "technical",
      actionDescription: `Verify internal linking from navigation, check robots.txt, and confirm presence in XML sitemap`,
    };
  }

  // 8. Word count / Dwell time
  if (lower.includes("word count") || lower.includes("dwell time") || lower.includes("readability")) {
    return {
      field: "content",
      actionDescription: `Deepen article/page content depth with architectural diagrams, FAQs, and structured subheadings`,
    };
  }

  return {
    field: "general",
    actionDescription: ideaText,
  };
}
