-- Migration: 0013_recruiting_import
-- Description: Adds source tracking, source metadata, and structured screening
-- answers to job_applications so leads from external sources (e.g. Facebook
-- Lead Ads CSV/Excel exports) can be imported alongside direct site
-- applications and manually-added candidates.

ALTER TABLE IF EXISTS job_applications
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS screening_answers JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_source_check;
  ALTER TABLE job_applications ADD CONSTRAINT job_applications_source_check
    CHECK (source IN ('direct', 'manual', 'import'));
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_applications_source ON job_applications(source);

-- Backstop against duplicate imports of the same candidate against the same
-- job posting (the import route also pre-checks and skips duplicates, but
-- this guards against races and manual inserts too).
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_job_email
  ON job_applications(job_posting_id, applicant_email);
