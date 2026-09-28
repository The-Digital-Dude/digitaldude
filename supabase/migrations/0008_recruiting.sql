-- Migration: 0008_recruiting.sql
-- Description: Job postings, applications, employees & onboarding, private
-- document storage, and a nullable link from bookings to the employee who
-- sourced them (for BDE commission tracking).

-- 1. Job postings -----------------------------------------------------------

create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  department text not null default 'General',
  location text not null default 'Remote',
  employment_type text not null default 'Full-time',
  compensation_summary text not null default '',
  description text not null,
  status text not null default 'draft', -- 'draft', 'open', 'closed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'job_postings_status_check'
  ) then
    alter table job_postings add constraint job_postings_status_check
      check (status in ('draft', 'open', 'closed'));
  end if;
end $$;

alter table job_postings enable row level security;

drop policy if exists "Allow public read of open job postings" on job_postings;
create policy "Allow public read of open job postings"
  on job_postings for select
  using (status = 'open');

create index if not exists idx_job_postings_slug on job_postings(slug);
create index if not exists idx_job_postings_status on job_postings(status);

-- 2. Job applications ---------------------------------------------------------
-- No public RLS policy: applications are written via the service-role key
-- from /api/apply and only ever read through admin routes, same as bookings.

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid references job_postings(id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  cv_path text not null,
  proof_of_results_path text,
  written_test_response text not null default '',
  status text not null default 'new', -- 'new','reviewing','interview','offered','hired','rejected'
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'job_applications_status_check'
  ) then
    alter table job_applications add constraint job_applications_status_check
      check (status in ('new', 'reviewing', 'interview', 'offered', 'hired', 'rejected'));
  end if;
end $$;

alter table job_applications enable row level security;

create index if not exists idx_job_applications_job_posting_id on job_applications(job_posting_id);
create index if not exists idx_job_applications_status on job_applications(status);

-- 3. Employees & onboarding ---------------------------------------------------
-- onboarding_checklist is a jsonb array of {task, done, done_at} objects.
-- Kept as jsonb rather than a separate table: this is an admin-only, low
-- volume, non-relational checklist with no need to be queried across
-- employees, so a dedicated table would be pure overhead here.

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  role_title text not null default '',
  employment_type text not null default 'commission', -- 'commission', 'salaried'
  meeting_bonus_min numeric,
  meeting_bonus_max numeric,
  deal_commission_percent_min numeric,
  deal_commission_percent_max numeric,
  status text not null default 'onboarding', -- 'onboarding', 'active', 'offboarded'
  source_application_id uuid references job_applications(id) on delete set null,
  onboarding_checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employees_status_check'
  ) then
    alter table employees add constraint employees_status_check
      check (status in ('onboarding', 'active', 'offboarded'));
  end if;
end $$;

alter table employees enable row level security;

create index if not exists idx_employees_status on employees(status);

-- 4. Link bookings to the employee who sourced them --------------------------

alter table bookings
  add column if not exists sourced_by_employee_id uuid references employees(id) on delete set null;

create index if not exists idx_bookings_sourced_by_employee_id on bookings(sourced_by_employee_id);

-- 5. Private storage bucket for candidate documents ---------------------------
-- public: false, unlike blog-images — files are only ever served via a
-- short-lived signed URL from an admin-authenticated route.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760, -- 10MB limit
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ];

-- No public select policy is created for this bucket — it stays private.
-- The service-role key (used by every /api/apply and /api/admin/* route)
-- bypasses RLS entirely, so upload and admin read access both work without
-- one; adding a public policy here would be the mistake this migration
-- specifically avoids.

-- 6. Seed the real BDE job posting --------------------------------------------

insert into job_postings (slug, title, department, location, employment_type, compensation_summary, description, status)
values (
  'business-development-executive',
  'Business Development Executive',
  'Sales',
  'Bangladesh (Remote)',
  'Commission-based, with a path to base salary',
  'Meeting bonus of BDT 1,000–2,000 per verified qualified discovery call booked, plus 10–15% commission on the total contract value of any deal you source. Consistent high performers qualify for a guaranteed monthly base salary on top of all bonuses and commissions.',
  E'## About Us\n\nThe Digital Dude builds custom CRMs, SaaS platforms, and internal operational systems for international companies worldwide. Our software powers businesses across 5 distinct industries — including an Australian property management CRM currently utilized by 30+ agencies managing over 4,000 active rental properties.\n\nWe are bringing on 2 self-driven Business Development Executives based in Bangladesh to generate conversations with international founders and business owners.\n\n## The Role\n\nYou will own the top of the sales funnel:\n\n- Identify and research international founders, operations heads, and agency owners across the web and LinkedIn.\n- Write tailored, high-converting cold messages via email and social channels using your own prospecting toolkit.\n- Qualify inbound prospect interest and book discovery calls directly onto our CEO''s calendar.\n- You do not handle scoping calls, pricing negotiation, or technical discovery — our leadership closes the deals.\n\n## Compensation & Path to Retainer\n\nThis role begins as a high-upside, performance-driven partnership with a clear route to a guaranteed base salary:\n\n- **Meeting Bonus**: BDT 1,000 to BDT 2,000 cash bonus for every verified, qualified discovery call booked.\n- **Deal Commission**: 10% to 15% commission on the total project contract value when a lead you sourced signs.\n- **Base Salary Pathway**: Consistent high performers who hit monthly meeting benchmarks qualify for a guaranteed monthly base salary on top of all bonuses and commissions.\n\n## Requirements\n\n- **Location**: Must be based in Bangladesh.\n- **Experience**: Minimum 1+ years of proven outbound lead generation, cold email, or B2B sales development experience.\n- **Tooling**: You have your own workflow and tools for sourcing verified B2B emails and decision-maker contact details (e.g., Apollo, LinkedIn, scrapers).\n- **Communication**: Exceptional written English skills. Your messages must sound natural, professional, and free of generic AI-generated filler.\n- **Time Management**: Complete flexibility on daily work hours, provided your schedule accommodates international business time zones (e.g., UK mornings/afternoons or Australian operating hours) to reply to prospects quickly.\n- **Qualities**: Strong common sense, resilience against objections, and a team-first mindset.\n\n## Application Process\n\nApply below with your CV, proof of past results (screenshots, metrics, or case examples of qualified meetings booked or deals you personally sourced), and a written test: one sample cold message (under 120 words) you would send to the founder of an Australian property management company to pitch a custom CRM.\n\nIncomplete applications without the written test will not be evaluated.',
  'open'
)
on conflict (slug) do update set
  compensation_summary = excluded.compensation_summary,
  description = excluded.description,
  status = excluded.status;
