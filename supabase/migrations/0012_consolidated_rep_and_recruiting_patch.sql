-- ==============================================================================
-- CONSOLIDATED RECRUITING & SALES REP PORTAL DATABASE PATCH
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- ==============================================================================

-- 1. Ensure scorecard column exists on job_applications
ALTER TABLE IF EXISTS job_applications
  ADD COLUMN IF NOT EXISTS scorecard JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Ensure internal_notes exists on job_applications
ALTER TABLE IF EXISTS job_applications
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 3. Ensure employee referral code, currency & rep auth columns exist
ALTER TABLE IF EXISTS employees
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS auth_otp_code TEXT,
  ADD COLUMN IF NOT EXISTS auth_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_outreach_email TEXT,
  ADD COLUMN IF NOT EXISTS payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_outreach_limit INTEGER NOT NULL DEFAULT 50;

-- 4. Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_referral_code 
  ON employees(referral_code) 
  WHERE referral_code IS NOT NULL;

-- 5. Ensure bookings table has meeting bonus & commission payout tracking columns
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meeting_bonus_payout_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deal_commission_payout_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- 6. Create rep_outreach_logs table for cold email tracking
CREATE TABLE IF NOT EXISTS rep_outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  company_name TEXT,
  subject TEXT NOT NULL,
  body_content TEXT NOT NULL,
  template_used TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Add index for faster outreach queries
CREATE INDEX IF NOT EXISTS idx_rep_outreach_logs_employee_id ON rep_outreach_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_rep_outreach_logs_sent_at ON rep_outreach_logs(sent_at);
