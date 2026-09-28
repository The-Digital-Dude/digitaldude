-- ==============================================================================
-- 0014: CLIENT OPERATIONS & PROJECT TRACKING PORTAL SCHEMA
-- ==============================================================================

-- 1. Create client_projects table
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  company_name TEXT,
  project_title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT ARRAY[]::TEXT[],
  health_status TEXT NOT NULL DEFAULT 'on_track', -- 'on_track', 'in_review', 'action_needed'
  progress_percent INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  target_delivery_date DATE,
  total_budget NUMERIC(12, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  staging_url TEXT,
  figma_url TEXT,
  docs_url TEXT,
  github_url TEXT,
  auth_otp_code TEXT,
  auth_otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_projects_email ON client_projects(client_email);
CREATE INDEX IF NOT EXISTS idx_client_projects_health ON client_projects(health_status);

-- 2. Create client_milestones table
CREATE TABLE IF NOT EXISTS client_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'up_next', -- 'completed', 'in_progress', 'up_next'
  target_date DATE,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_milestones_project_id ON client_milestones(project_id);

-- 3. Create client_updates table (weekly changelog / async updates)
CREATE TABLE IF NOT EXISTS client_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  loom_video_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_updates_project_id ON client_updates(project_id);

-- 4. Create client_tickets table (support & change requests)
CREATE TABLE IF NOT EXISTS client_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'bug', 'change_request', 'general', 'billing'
  urgency TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  admin_response TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_tickets_project_id ON client_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_client_tickets_status ON client_tickets(status);
