-- ==============================================================================
-- 0013: SALES REP LEADS CRM, CUSTOM EMAIL TEMPLATES, AND AUDIT LOGS
-- ==============================================================================

-- 1. Add onboarding_completed column to employees table
ALTER TABLE IF EXISTS employees
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. Create rep_leads table for Leads CRM
CREATE TABLE IF NOT EXISTS rep_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  lead_source TEXT NOT NULL DEFAULT 'Cold Outreach',
  stage TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'meeting_booked', 'negotiation', 'won', 'lost'
  estimated_deal_value NUMERIC(12, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_leads_employee_id ON rep_leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_rep_leads_stage ON rep_leads(stage);
CREATE INDEX IF NOT EXISTS idx_rep_leads_email ON rep_leads(email);

-- 3. Create rep_email_templates table for custom outreach templates
CREATE TABLE IF NOT EXISTS rep_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_email_templates_employee_id ON rep_email_templates(employee_id);

-- 4. Create rep_audit_logs table for admin verification & rep action tracking
CREATE TABLE IF NOT EXISTS rep_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'outreach_sent', 'lead_created', 'lead_updated', 'payout_updated', 'onboarding_completed', 'login'
  description TEXT NOT NULL,
  target_identifier TEXT, -- recipient email, lead name, etc.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_employee_id ON rep_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_action_type ON rep_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_created_at ON rep_audit_logs(created_at);
