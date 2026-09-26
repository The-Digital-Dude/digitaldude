-- Migration: 0004_case_studies.sql
-- Description: Create case_studies table for Case Studies CMS with RLS & seed data

create table if not exists case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  industry text not null default 'Custom Software',
  tag text not null default 'Production · UK & Australia',
  title text not null,
  summary text not null,
  status text not null default 'Live', -- 'Live', 'Delivered', 'Draft'
  image text not null default '/images/case-studies/property-compliance.svg',
  image_alt text,
  headline text not null,
  page_summary text not null,
  stats text[] not null default '{}',
  challenge text not null,
  what_we_built text[] not null default '{}',
  what_changed text not null,
  what_changed_label text not null default 'What changed',
  built_with text not null default 'Next.js, TypeScript, Supabase, Tailwind CSS',
  related text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table case_studies enable row level security;

-- Public read policy for published case studies
drop policy if exists "Allow public read of active case studies" on case_studies;
create policy "Allow public read of active case studies"
  on case_studies for select
  using (status in ('Live', 'Delivered'));

-- Seed data
insert into case_studies (slug, industry, tag, title, summary, status, image, image_alt, headline, page_summary, stats, challenge, what_we_built, what_changed, what_changed_label, built_with, related)
values
(
  'property-compliance-crm',
  'Property',
  'Property · Australia',
  'Property compliance CRM',
  'Five role-based portals managing 4,000+ rentals across 30+ agencies, 4x faster than before',
  'Live',
  '/images/case-studies/property-compliance.svg',
  'Property compliance CRM interface managing smoke alarm, gas, and electrical safety inspections across Australian rental properties',
  'From spreadsheet chaos to four times faster turnarounds',
  'A bespoke multi-portal CRM connecting real estate agencies, field inspectors, tenants, landlords and ops team — currently managing compliance across 4,000+ Australian rental properties.',
  array['4,000+ rental properties under management', '30+ real estate agencies active', '4x faster job completion turnaround', 'Zero missed compliance deadlines since launch'],
  'A growing Australian property compliance company was running inspections, technician dispatch, agency communications and certificate generation through shared spreadsheets, email chains and WhatsApp groups. As they scaled past 1,000 properties, jobs slipped, certificates took days to issue, and operations spent hours every day answering "what is the status of property X?" from agency property managers.',
  array[
    'Agency Portal: Real estate property managers log in, submit new properties, view live compliance statuses, and download safety certificates on demand.',
    'Field Inspector Mobile App: Inspectors view their daily route, complete digital inspection checklists, take mandatory photo proof, and collect digital signatures on-site.',
    'Operations Dashboard: Central dispatcher assigns jobs with location-based grouping, monitors delayed tasks, and reviews inspector submissions in real time.',
    'Automated Certificate & Invoicing Engine: Safety certificates and invoices are generated automatically as soon as an inspection is marked complete.',
    'Tenant & Landlord Notification Engine: Automated SMS and email booking reminders with self-service reschedule links to eliminate missed technician visits.'
  ],
  'The company expanded from managing 800 properties to over 4,000 across 30+ agencies without increasing their central admin headcount. Job turnaround dropped from 8 days to under 48 hours, and safety certificates are delivered within seconds of job completion.',
  'What changed',
  'Next.js 16, TypeScript, Supabase PostgreSQL with RLS, Tailwind CSS, Google Maps Geocoding API, Brevo Transactional Email & SMS',
  array['cleaning-marketplace', 'logistics-platform']
),
(
  'airline-ticketing-crm',
  'Travel',
  'Travel & Ticketing · Australia',
  'Travel agency CRM',
  'A multi-channel CRM for an Australian ticketing agency bringing WhatsApp, Facebook, phone and walk-in leads into one place',
  'Live',
  '/images/case-studies/airline-ticketing.svg',
  'Travel agency ticketing CRM dashboard tracking agent response times, booking conversions, and GDS flight ticket issuance',
  'One dashboard for leads, quotes, bookings, and agent KPIs',
  'A centralized ticketing CRM engineered for an Australian travel agency processing high volumes of custom itinerary requests across WhatsApp, Facebook Messenger, phone, and walk-in leads.',
  array['100% centralized lead capture from 4 channels', '38% increase in lead-to-booking conversion rate', 'Average quote turnaround reduced from 4 hours to 18 minutes', 'Complete live visibility over agent sales performance'],
  'An Australian travel agency had 15 agents handling hundreds of flight quote requests across personal WhatsApp chats, Facebook pages, phone calls, and walk-in consultations. Enquiries frequently fell through the cracks, management had zero visibility into quote status or conversion rates, and duplicate quotes were repeatedly sent to the same client.',
  array[
    'Omnichannel Lead Capture: Auto-ingests leads from web forms, WhatsApp Business API, Facebook Messenger webhooks, and phone call logs into a unified queue.',
    'Rapid Itinerary & Quote Builder: Agents generate multi-leg flight comparisons, markup calculations, and client-ready branded PDF quotes in minutes.',
    'Smart Lead Routing: Distributes inbound leads based on agent availability, destination expertise, and historical conversion speed.',
    'GDS & Payment Tracking: Links PNR booking numbers to Stripe payment receipts and automated ticket issuance reminders.',
    'Executive KPI Dashboard: Live leaderboards tracking agent response times, active quotes, win rates, and daily gross revenue.'
  ],
  'Lead response times dropped from hours to minutes. Unassigned leads are automatically escalated if not contacted within 15 minutes, boosting overall booking conversion by 38%. Management can view real-time company-wide revenue metrics instantly from any device.',
  'What changed',
  'Next.js, React, Node.js, PostgreSQL, WhatsApp Business Cloud API, Tailwind CSS, Stripe Payments',
  array['property-compliance-crm', 'recruitment-crm']
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  headline = excluded.headline,
  page_summary = excluded.page_summary,
  stats = excluded.stats,
  challenge = excluded.challenge,
  what_we_built = excluded.what_we_built,
  what_changed = excluded.what_changed;
