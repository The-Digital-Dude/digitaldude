-- Migration: 0015_rep_outreach_campaigns.sql
-- Description: Automated Cold Outreach Campaign Sequences, Drip Engine, Scheduled Queue, and Unsubscribe Registry

-- 1. Rep Campaigns Table
CREATE TABLE IF NOT EXISTS public.rep_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Campaign Steps (Multi-Touch Sequence)
CREATE TABLE IF NOT EXISTS public.rep_campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rep_campaigns(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  delay_days INT NOT NULL DEFAULT 0, -- Days to wait after previous step (0 for immediate / day 0)
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, step_number)
);

-- 3. Lead Enrollments in Campaigns
CREATE TABLE IF NOT EXISTS public.rep_campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rep_campaigns(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.rep_leads(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled_replied', 'cancelled_unsubscribed', 'cancelled_manual')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scheduled Campaign Queue
CREATE TABLE IF NOT EXISTS public.rep_campaign_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.rep_campaign_enrollments(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.rep_campaigns(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.rep_leads(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.rep_campaign_steps(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'skipped')),
  error_message TEXT,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Global Unsubscribe / Do-Not-Contact Registry
CREATE TABLE IF NOT EXISTS public.rep_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.rep_leads(id) ON DELETE SET NULL,
  rep_id UUID REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  reason VARCHAR(255) DEFAULT 'User clicked 1-click opt-out',
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid queue querying and enrollment lookups
CREATE INDEX IF NOT EXISTS idx_rep_campaigns_rep ON public.rep_campaigns(rep_id);
CREATE INDEX IF NOT EXISTS idx_rep_campaign_steps_camp ON public.rep_campaign_steps(campaign_id, step_number);
CREATE INDEX IF NOT EXISTS idx_rep_campaign_enroll_lead ON public.rep_campaign_enrollments(lead_id, status);
CREATE INDEX IF NOT EXISTS idx_rep_campaign_queue_pending ON public.rep_campaign_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_rep_unsubscribes_email ON public.rep_unsubscribes(email);
