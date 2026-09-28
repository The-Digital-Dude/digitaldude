-- Migration: 0016_rep_productivity_and_audit_enhancements.sql
-- Description: Enhancements for Sales Rep Activity Audit Logs, Productivity Metrics, and Velocity Tracking

-- Ensure rep_audit_logs table exists and is fully structured
CREATE TABLE IF NOT EXISTS public.rep_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'outreach_sent', 'campaign_enrolled', 'drip_dispatched', 'lead_created', 'lead_updated', 'stage_updated', 'payout_updated', 'onboarding_completed', 'login'
  description TEXT NOT NULL,
  target_identifier TEXT, -- recipient email, lead name, company name
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid analytics and filtering
CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_employee_id ON public.rep_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_action_type ON public.rep_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_rep_audit_logs_created_at_desc ON public.rep_audit_logs(created_at DESC);
