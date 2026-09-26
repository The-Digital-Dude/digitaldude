-- Migration: 0005_proposals.sql
-- Description: Create proposals table for Architecture Specs & Project Proposals with public shareable slug & booking linkage

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  booking_id uuid references bookings(id) on delete set null,
  client_name text not null,
  client_email text not null,
  company_name text not null,
  country text not null default 'United Kingdom',
  project_title text not null,
  system_type text not null default 'Custom Web Application',
  scope_summary text not null,
  problem_statement text,
  target_timeline text not null default '4–8 Weeks',
  budget_range text not null default '£5,000 – £15,000',
  tech_stack jsonb not null default '["Next.js 16 (App Router)", "TypeScript", "Tailwind CSS", "Supabase (PostgreSQL / RLS)", "Cloudflare Edge", "Role-Based Access Control"]'::jsonb,
  architecture_modules jsonb not null default '[]'::jsonb,
  deliverable_phases jsonb not null default '[]'::jsonb,
  status text not null default 'draft', -- 'draft', 'sent', 'accepted', 'completed'
  valid_until date not null default (current_date + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table proposals enable row level security;

-- Full read and write policy for proposals
drop policy if exists "Allow public read of proposals" on proposals;
drop policy if exists "Allow full access on proposals" on proposals;
create policy "Allow full access on proposals"
  on proposals for all
  using (true)
  with check (true);

-- Indexes for performance
create index if not exists idx_proposals_slug on proposals(slug);
create index if not exists idx_proposals_status on proposals(status);
create index if not exists idx_proposals_booking_id on proposals(booking_id);

-- Insert sample demonstration proposal
insert into proposals (
  slug,
  client_name,
  client_email,
  company_name,
  country,
  project_title,
  system_type,
  scope_summary,
  problem_statement,
  target_timeline,
  budget_range,
  tech_stack,
  architecture_modules,
  deliverable_phases,
  status
) values (
  'TDD-SPEC-DEMO-2026',
  'Alex Morgan',
  'alex@morganlogistics.co.uk',
  'Morgan Logistics & Freight',
  'United Kingdom',
  'Custom Freight Dispatch & Driver Tracking Portal',
  'Operations Portal & Logistics Hub',
  'End-to-end bespoke logistics portal replacing manual WhatsApp dispatching and multi-tab spreadsheets with real-time job allocation, driver mobile signatures, and automated client status tracking.',
  'Currently managing 400+ weekly consignments across 6 spreadsheets. Jobs are slipping through, proof-of-delivery photos get lost in chat threads, and manual invoice drafting takes 12 hours every Friday.',
  '6–8 Weeks',
  '£8,500 – £14,000',
  '["Next.js 16 App Router", "TypeScript", "Supabase PostgreSQL", "Tailwind CSS", "Cloudflare R2 Storage", "Twilio WhatsApp Webhooks", "Stripe Invoicing API"]'::jsonb,
  '[
    {
      "name": "Central Dispatch Dashboard",
      "description": "Multi-tenant dispatcher control room with drag-and-drop route scheduling, real-time vehicle status indicators, and SLA bottleneck alerts.",
      "deliverables": ["Interactive route calendar", "Driver assignment engine", "Instant SMS/WhatsApp dispatch triggers", "Automated late-delivery warnings"],
      "phase": "Phase 2"
    },
    {
      "name": "Driver Mobile Progressive Web App",
      "description": "Lightweight, responsive mobile interface for drivers with offline support, 1-click arrival confirmation, digital signature capture, and camera photo upload.",
      "deliverables": ["Digital Proof of Delivery (e-POD)", "Signature pad with timestamping", "Geo-tagged photo upload to Cloudflare R2", "Turn-by-turn navigation link"],
      "phase": "Phase 2"
    },
    {
      "name": "Customer Live Tracking & Self-Serve Portal",
      "description": "Public PIN-protected tracking links for consignees to track delivery progress in real time without calling the dispatch office.",
      "deliverables": ["Unique tracking URL generator", "Live milestone progress bar", "Instant PDF consignment note download", "Automated email notifications"],
      "phase": "Phase 3"
    },
    {
      "name": "Automated Billing & Reporting Engine",
      "description": "Automatic aggregation of completed delivery slips into monthly client statements and 1-click Xero/QuickBooks CSV export.",
      "deliverables": ["Automated rate-card calculator", "1-click invoice batch generation", "Weekly driver efficiency reports", "Export to Xero/QuickBooks"],
      "phase": "Phase 3"
    }
  ]'::jsonb,
  '[
    {
      "phase": "Phase 1: Architecture & Wireframing",
      "duration": "Weeks 1–2",
      "milestones": ["Database schema design & ERD approval", "High-fidelity Figma user flows & UI kit", "Role-Based Access Control matrix definition", "Technical sprint roadmap sign-off"]
    },
    {
      "phase": "Phase 2: Core Engineering & Database",
      "duration": "Weeks 3–5",
      "milestones": ["PostgreSQL database & RLS policy deployment", "Dispatcher dashboard & live calendar build", "Driver Mobile PWA & e-POD signature engine", "Cloudflare R2 image upload pipeline"]
    },
    {
      "phase": "Phase 3: Integrations & Testing",
      "duration": "Weeks 6–7",
      "milestones": ["Twilio WhatsApp notification triggers", "Accounting CSV export engine", "Live customer tracking portal & PIN auth", "End-to-end load & security testing"]
    },
    {
      "phase": "Phase 4: Deployment, Training & Handover",
      "duration": "Week 8",
      "milestones": ["Production deployment on Vercel & Supabase", "Driver & dispatcher onboarding session", "Loom video walkthrough documentation", "30-day post-launch hypercare support"]
    }
  ]'::jsonb,
  'sent'
)
on conflict (slug) do nothing;
