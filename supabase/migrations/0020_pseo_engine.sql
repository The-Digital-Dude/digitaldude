-- 0020_pseo_engine.sql
-- Database schema for Programmatic SEO (pSEO) engine, page overrides, and bulk import tracking

CREATE TABLE IF NOT EXISTS pseo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('location', 'solution', 'comparison', 'custom')),
  target_keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  hero_badge TEXT,
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  currency TEXT DEFAULT 'GBP',
  industry_slug TEXT,
  service_slug TEXT,
  competitor_name TEXT,
  featured_case_study_slug TEXT,
  custom_content TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  comparison_matrix JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pseo_pages_slug ON pseo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_category ON pseo_pages(category);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_status ON pseo_pages(status);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_city ON pseo_pages(city);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_service_slug ON pseo_pages(service_slug);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_industry_slug ON pseo_pages(industry_slug);

-- Enable RLS
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;

-- Public read access for published pages
DROP POLICY IF EXISTS "Public can view published pseo pages" ON pseo_pages;
CREATE POLICY "Public can view published pseo pages"
  ON pseo_pages
  FOR SELECT
  USING (status = 'published');

-- Full access for service_role / authenticated admin
DROP POLICY IF EXISTS "Service role has full access to pseo pages" ON pseo_pages;
CREATE POLICY "Service role has full access to pseo pages"
  ON pseo_pages
  FOR ALL
  USING (true)
  WITH CHECK (true);
