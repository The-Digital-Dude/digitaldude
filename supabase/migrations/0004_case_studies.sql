-- Migration: 0004_case_studies.sql
-- Description: Create case_studies table for Case Studies CMS with RLS & seed all 7 production case studies

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

-- Seed all 7 Case Studies
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
  'Property compliance CRM dashboard showing 4,000+ rentals managed across 30+ agencies',
  'A compliance CRM now running 4,000+ rentals across 30+ agencies',
  'One platform connecting agencies, property managers, technicians and the internal team, replacing spreadsheets and email threads.',
  array['30+ agencies', '4,000+ rentals managed', '4x faster than the previous system', '5 role-based portals'],
  'The business was coordinating agencies, property managers, technicians and its own team across separate tools. Jobs slipped between scheduled, overdue and completed with no single view. Quotes, invoices and technician payments lived in spreadsheets and email, and management could not see performance across regions.',
  array[
    'Five separate portals for admin, team members, agencies, property managers and technicians, each showing only what that person needs',
    'Full job tracking from creation to payment, with dedicated views for scheduled, overdue and completed work',
    'Quotes, invoices and technician payments linked directly to each job',
    'Lead management to bring in and convert new agencies and property managers',
    'A regional dashboard and reports for management, plus a public marketing website'
  ],
  'Operations now run through one system instead of spreadsheets and email. The platform manages 4,000+ rentals for 30+ agencies and runs about 4x faster than the system it replaced. Overdue jobs are visible the moment they slip.',
  'What changed',
  'React, TypeScript, Node.js, relational database, cloud hosting',
  array['airline-ticketing-crm', 'logistics-platform']
),
(
  'airline-ticketing-crm',
  'Travel',
  'Travel · Australia',
  'Airline ticketing CRM',
  'Every lead from WhatsApp, Facebook, phone and walk-ins in one place, with a live KPI dashboard',
  'Live',
  '/images/case-studies/air-travel-crm.svg',
  'Airline ticketing CRM dashboard unifying WhatsApp, Facebook, phone and walk-in leads',
  'One CRM for every lead, from every channel',
  'A lead and customer management system for an airline ticketing agency, bringing WhatsApp, Facebook, phone and walk-in enquiries into one place.',
  array['4 lead channels in one system', '7 live KPIs', 'Conversion tracking per agent', 'In daily use'],
  'Enquiries arrived through WhatsApp, Facebook, phone calls and walk-ins, with nowhere to manage them together. It was hard to tell who owned each lead, there was no live view of conversions or lost sales, and management could not see how each agent was performing.',
  array[
    'Lead capture for WhatsApp, Facebook and manual entry, organised without duplicates',
    'A booking pipeline matched to how agents sell: in progress, itinerary sent, payment made',
    'A dashboard showing total leads, follow-ups, conversions, lost sales and progress against the monthly target, for any date range',
    'My leads and my follow-ups views so every agent knows what to do next',
    'Agent performance showing leads collected, conversions and conversion rate, plus customer history and quick search'
  ],
  'The agency has one source of truth for every lead instead of scattered chats and spreadsheets. Management sees performance against target in real time, and every agent owns their own pipeline.',
  'What changed',
  'React, TypeScript, Vite, REST APIs',
  array['property-compliance-crm', 'recruitment-crm']
),
(
  'matrimony-saas-platform',
  'Community',
  'Community · Australia',
  'Premium matrimony SaaS',
  'AI matchmaking, 5-tier identity and police check verification, and subscription billing',
  'Live',
  '/images/case-studies/matrimony-saas.svg',
  'Matrimony SaaS platform dashboard showing AI matchmaking and 5-tier verification',
  'A matchmaking platform built on trust',
  'A premium subscription platform for a community matchmaking service, combining AI matching with strict identity verification.',
  array['AI matchmaking engine', '5-tier verification', 'Subscription billing', 'Live in production'],
  'In matchmaking, trust is the product. The client needed members to feel safe that every profile was real, while still making it easy to find a good match and to charge for premium access.',
  array[
    'An AI matchmaking engine that suggests compatible members',
    'Five levels of verification, up to identity and police checks',
    'Subscription plans with recurring billing via Stripe',
    'Private messaging between members with photo privacy controls',
    'Community rooms for group conversation'
  ],
  'The community runs on one platform that verifies members, suggests matches and handles payments, giving members confidence in who they are talking to.',
  'What changed',
  'Next.js 16, TypeScript, Supabase PostgreSQL, Stripe Billing',
  array['ai-tutoring-platform', 'recruitment-crm']
),
(
  'cleaning-marketplace',
  'Home services',
  'Home services',
  'Cleaning marketplace',
  'Customer app, cleaner app and admin CRM with upfront payment and photo proof',
  'Delivered',
  '/images/case-studies/cleaning-marketplace.svg',
  'Cleaning marketplace apps showing customer booking, cleaner job flow and admin CRM',
  'A three-app platform that runs a cleaning business end to end',
  'A customer booking app, a cleaner mobile app and an admin CRM, connected by one system with upfront payment and photo proof on every job.',
  array['3 connected apps', 'Payment before every job', 'Before and after photos', '4 user roles'],
  'Bookings came in by phone and message, payments were chased after the job, and there was no proof of work when a customer complained. More cleaners meant more admin, and commission was tracked by hand.',
  array[
    'Customer app to choose a service, see the price, pay upfront and track the job',
    'Cleaner app to accept jobs, check in, upload before and after photos and mark jobs complete',
    'Admin CRM to approve cleaners, assign jobs, and track revenue, commission and payouts',
    'Automatic notifications at booking, assignment and completion, with invoice and photos sent to the customer',
    'A full history for every job, plus reports on revenue, job volume and cleaner performance'
  ],
  'Payment is collected before work starts, every job has photo evidence, and new cleaners and areas can be added without adding admin staff.',
  'What it makes possible',
  'Mobile apps, REST API, Stripe payments, cloud image storage',
  array['logistics-platform', 'recruitment-crm']
),
(
  'logistics-platform',
  'Logistics',
  'Logistics',
  'Logistics coordination platform',
  'Mobile-first breakdown management for drivers and dispatch, 40% faster response coordination',
  'Live',
  '/images/case-studies/truck-breakdown.svg',
  'Logistics coordination platform showing live breakdown incidents and driver status',
  'Breakdowns handled in minutes, not phone calls',
  'A mobile-first platform that connects drivers and dispatch the moment something goes wrong on the road.',
  array['40% faster response coordination', 'Mobile-first PWA', 'Driver and admin apps', 'Live in production'],
  'When a truck broke down, coordination happened over phone calls and messages. Dispatch lost time finding out where the driver was, what had happened and who could help.',
  array[
    'A mobile app for drivers to report a breakdown with the details dispatch needs',
    'An admin view showing every active incident and its status',
    'Coordination tools so admins can assign help and keep drivers updated'
  ],
  'Response coordination improved by 40%, and the team has one place to see every incident instead of chasing calls.',
  'What changed',
  'Next.js 16, TypeScript, Tailwind CSS, Google Maps Geocoding',
  array['property-compliance-crm', 'cleaning-marketplace']
),
(
  'recruitment-crm',
  'Recruitment',
  'Recruitment · Staffing',
  'Recruitment CRM',
  'Real-time candidate portal, document tracking and automated status updates',
  'Delivered',
  '/images/case-studies/recruitment-crm.svg',
  'Recruitment CRM dashboard showing candidate pipeline and document tracking',
  'Every candidate, document and status update in one place',
  'A recruitment system with a real-time candidate portal, covering everything from application to post-placement tracking.',
  array['Real-time candidate portal', 'Document tracking', 'Automated status messages', 'Role-based access'],
  'Recruiters were juggling candidate documents, status updates and communication across email, spreadsheets and WhatsApp. Candidates kept asking for updates, and tracking people after placement was almost impossible.',
  array[
    'A candidate website to apply, upload documents and see application status in real time',
    'A CRM for admins and agents with role-based access, candidate filtering and interview approval',
    'Document checks for visas, clearances and agreements',
    'Automatic status updates by WhatsApp and email, plus an AI assistant for common candidate questions',
    'Post-placement tracking of start dates, salary, leave and employment status'
  ],
  'Candidates see where they stand without calling, agents spend less time on updates, and the business can track every placement long after the start date.',
  'What it makes possible',
  'Next.js, Node.js, Supabase PostgreSQL, Twilio, OpenAI GPT API',
  array['airline-ticketing-crm', 'cleaning-marketplace']
),
(
  'ai-tutoring-platform',
  'Education',
  'Education',
  'AI tutoring platform',
  'AI-generated quizzes, automatic grading and a parent and student portal',
  'Delivered',
  '/images/case-studies/ai-education.svg',
  'AI tutoring platform dashboard showing quiz generation and student progress',
  'A tutoring platform where quizzes, marking and reports run themselves',
  'A student and parent portal with AI-generated quizzes, automatic grading and personalised feedback, plus an admin system for the tutoring centre.',
  array['AI quiz generation', 'Instant grading', 'Parent and student portal', 'Subscription billing'],
  'Tutors were spending hours every week writing quizzes, marking them and updating parents. Parents wanted more visibility, and the centre wanted to spot struggling students earlier.',
  array[
    'AI-generated quizzes matched to each student subject and level, on a weekly, fortnightly or monthly cycle',
    'Instant grading with feedback on strengths, weak spots and what to practise next',
    'A portal where students and parents see results, reports, attendance and schedules',
    'An admin dashboard for classes, student progress and at-risk alerts',
    'Subscription billing and automatic reminders'
  ],
  'Quizzes and progress reports go out without manual work, parents stay informed, and tutors can focus on teaching.',
  'What it makes possible',
  'Next.js, Node.js, Supabase PostgreSQL, OpenAI GPT-4o, Stripe',
  array['matrimony-saas-platform', 'recruitment-crm']
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  headline = excluded.headline,
  page_summary = excluded.page_summary,
  stats = excluded.stats,
  challenge = excluded.challenge,
  what_we_built = excluded.what_we_built,
  what_changed = excluded.what_changed,
  status = excluded.status,
  built_with = excluded.built_with;
