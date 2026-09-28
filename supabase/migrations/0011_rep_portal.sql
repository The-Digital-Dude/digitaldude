-- Migration: 0011_rep_portal.sql
-- Description: Adds rep OTP auth, assigned outreach email, payout details to employees, and rep_outreach_logs table.

alter table if exists employees
  add column if not exists auth_otp_code text,
  add column if not exists auth_otp_expires_at timestamptz,
  add column if not exists assigned_outreach_email text,
  add column if not exists payout_details jsonb not null default '{}'::jsonb,
  add column if not exists daily_outreach_limit integer not null default 50;

create table if not exists rep_outreach_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  company_name text,
  subject text not null,
  body_content text not null,
  template_used text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_rep_outreach_logs_employee_id on rep_outreach_logs(employee_id);
create index if not exists idx_rep_outreach_logs_sent_at on rep_outreach_logs(sent_at);
