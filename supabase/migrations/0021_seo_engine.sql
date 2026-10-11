-- 0021_seo_engine.sql
-- Database schema for SEO Engine, SEMrush Audit Recommendations, and Universal Page Overrides

-- 1. Table for SEO Audit Issues (SEMrush, Ahrefs, internal audits)
CREATE TABLE IF NOT EXISTS seo_audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_filename TEXT NOT NULL,
  url TEXT NOT NULL,
  pathname TEXT NOT NULL,
  target_keyword TEXT,
  priority NUMERIC(5, 2) DEFAULT 0.00,
  category TEXT NOT NULL CHECK (category IN ('metadata', 'content', 'schema', 'crawlability', 'backlinks', 'general')),
  issue_text TEXT NOT NULL,
  suggested_fix JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_issues_pathname ON seo_audit_issues(pathname);
CREATE INDEX IF NOT EXISTS idx_seo_audit_issues_status ON seo_audit_issues(status);
CREATE INDEX IF NOT EXISTS idx_seo_audit_issues_priority ON seo_audit_issues(priority DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audit_issues_category ON seo_audit_issues(category);

-- 2. Table for Universal Page Metadata Overrides (for ANY route on digitaldude.co.uk)
CREATE TABLE IF NOT EXISTS seo_page_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathname TEXT UNIQUE NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  target_keyword TEXT,
  semantic_keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT,
  noindex BOOLEAN DEFAULT FALSE,
  custom_schema JSONB,
  og_image TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'disabled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_overrides_pathname ON seo_page_overrides(pathname);
CREATE INDEX IF NOT EXISTS idx_seo_page_overrides_status ON seo_page_overrides(status);

-- 3. Row Level Security
ALTER TABLE seo_audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_overrides ENABLE ROW LEVEL SECURITY;

-- Public read for published page overrides (used by Next.js metadata resolution)
DROP POLICY IF EXISTS "Public can view published seo page overrides" ON seo_page_overrides;
CREATE POLICY "Public can view published seo page overrides"
  ON seo_page_overrides
  FOR SELECT
  USING (status = 'published');

-- Service role full access for audit issues and page overrides
DROP POLICY IF EXISTS "Service role has full access to seo audit issues" ON seo_audit_issues;
CREATE POLICY "Service role has full access to seo audit issues"
  ON seo_audit_issues
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to seo page overrides" ON seo_page_overrides;
CREATE POLICY "Service role has full access to seo page overrides"
  ON seo_page_overrides
  FOR ALL
  USING (true)
  WITH CHECK (true);
