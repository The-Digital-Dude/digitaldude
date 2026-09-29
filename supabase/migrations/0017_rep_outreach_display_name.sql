-- Migration: 0017_rep_outreach_display_name.sql
-- Description: Adds outreach_display_name to employees for admin-controlled sender identity

ALTER TABLE IF EXISTS employees
  ADD COLUMN IF NOT EXISTS outreach_display_name TEXT;

-- Index for quick lookup if needed
CREATE INDEX IF NOT EXISTS idx_employees_assigned_outreach_email 
  ON employees(assigned_outreach_email) 
  WHERE assigned_outreach_email IS NOT NULL;
