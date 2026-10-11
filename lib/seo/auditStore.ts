import { SeoAuditIssue, SeoIssueCategory, SeoIssueStatus } from "./auditEngine";

export interface SeoPageOverride {
  id: string;
  pathname: string;
  title?: string;
  meta_description?: string;
  h1?: string;
  target_keyword?: string;
  semantic_keywords?: string[];
  canonical_url?: string;
  noindex?: boolean;
  custom_schema?: any;
  og_image?: string;
  status: "published" | "draft" | "disabled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Global in-memory cache / fallback for serverless dev sessions
declare global {
  var __SEO_AUDIT_ISSUES__: SeoAuditIssue[] | undefined;
  var __SEO_PAGE_OVERRIDES__: SeoPageOverride[] | undefined;
}

if (!global.__SEO_AUDIT_ISSUES__) {
  global.__SEO_AUDIT_ISSUES__ = [];
}

if (!global.__SEO_PAGE_OVERRIDES__) {
  global.__SEO_PAGE_OVERRIDES__ = [];
}

export function getMemoryAuditIssues(): SeoAuditIssue[] {
  return global.__SEO_AUDIT_ISSUES__ || [];
}

export function setMemoryAuditIssues(issues: SeoAuditIssue[]) {
  global.__SEO_AUDIT_ISSUES__ = issues;
}

export function addMemoryAuditIssues(issues: SeoAuditIssue[]) {
  const current = global.__SEO_AUDIT_ISSUES__ || [];
  const map = new Map<string, SeoAuditIssue>();
  for (const item of current) {
    map.set(`${item.url}::${item.issue_text}`, item);
  }
  for (const item of issues) {
    map.set(`${item.url}::${item.issue_text}`, item);
  }
  global.__SEO_AUDIT_ISSUES__ = Array.from(map.values());
}

export function updateMemoryAuditIssue(
  id: string,
  patch: Partial<SeoAuditIssue>
): SeoAuditIssue | null {
  const list = global.__SEO_AUDIT_ISSUES__ || [];
  const index = list.findIndex((it) => it.id === id);
  if (index === -1) return null;
  list[index] = {
    ...list[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return list[index];
}

export function getMemoryPageOverrides(): SeoPageOverride[] {
  return global.__SEO_PAGE_OVERRIDES__ || [];
}

export function setMemoryPageOverride(override: SeoPageOverride) {
  const list = global.__SEO_PAGE_OVERRIDES__ || [];
  const index = list.findIndex((o) => o.pathname === override.pathname);
  if (index >= 0) {
    list[index] = { ...list[index], ...override, updated_at: new Date().toISOString() };
  } else {
    list.unshift(override);
  }
  global.__SEO_PAGE_OVERRIDES__ = list;
}

export function deleteMemoryPageOverride(id: string): boolean {
  const list = global.__SEO_PAGE_OVERRIDES__ || [];
  const filtered = list.filter((o) => o.id !== id && o.pathname !== id);
  const changed = filtered.length !== list.length;
  global.__SEO_PAGE_OVERRIDES__ = filtered;
  return changed;
}
