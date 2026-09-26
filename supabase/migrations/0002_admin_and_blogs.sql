-- 1. Enhance existing bookings table with status, admin notes, and Google Meet URL
alter table bookings 
  add column if not exists status text not null default 'confirmed',
  add column if not exists admin_notes text,
  add column if not exists meet_url text;

-- 2. Create posts table for Blog CMS
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image text,
  author text not null default 'The Digital Dude',
  category text not null default 'Custom Software',
  status text not null default 'published', -- 'draft' or 'published'
  reading_time_minutes integer not null default 5,
  meta_title text,
  meta_description text,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on posts
alter table posts enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Allow public read of published posts" on posts;

-- Allow public read of published posts
create policy "Allow public read of published posts"
  on posts for select
  using (status = 'published');

-- Insert initial high-value seed blog posts for SEO ranking
insert into posts (slug, title, excerpt, content, category, reading_time_minutes, meta_title, meta_description)
values 
(
  'why-growing-service-businesses-outgrow-spreadsheets',
  'Why Growing Service Businesses Outgrow Spreadsheets & Off-the-Shelf CRMs',
  'Spreadsheets work when you start. But as your team and client volume scale, jobs slip and data scatters across WhatsApp and email. Here is why bespoke systems win.',
  '## The Inevitable Spreadsheet Ceiling

When a service business launches, spreadsheets and messaging apps are the ultimate tool: free, flexible, and instant. You track jobs in Google Sheets, dispatch updates over WhatsApp, and handle customer billing manually.

### Where the Patchwork Breaks Down

1. **No Single Source of Truth:** When five team members edit the same spreadsheet, versions conflict and customer status updates get lost.
2. **Scattered Communications:** Critical job notes get trapped inside individual WhatsApp chats rather than linked to the client record.
3. **Zero Visibility for Management:** Leadership cannot see live conversion rates, overdue jobs, or technician performance without hours of manual report compilation.

### The Problem With Generic CRMs (HubSpot, Salesforce)

Off-the-shelf CRMs are built for standard software sales pipelines (Lead → Demo → Closed). If your business manages field technicians, property compliance checks, or multi-portal scheduling, you end up paying thousands per month for features you do not use while building workarounds for the ones you need.

### The Custom System Advantage

A custom CRM is mapped directly to how your team operates from day one:
- **Role-based portals** for managers, field staff, and customers.
- **Automated job status transitions** with zero manual data entry.
- **Direct integration with payment and notification systems.**

---
*Ready to replace the spreadsheet patchwork with a system built around your team? [Book a 30-minute discovery call with our founder](/contact).*',
  'CRM Development',
  4,
  'Why Service Businesses Outgrow Spreadsheets | The Digital Dude',
  'Discover why spreadsheets and generic CRMs hold growing service businesses back, and how custom systems solve operational bottlenecks.'
),
(
  'how-to-build-a-three-sided-marketplace-app',
  'How to Build a 3-App Marketplace: Customer, Provider & Admin Architecture',
  'From upfront customer payments to cleaner dispatch and commission payouts: the architecture behind building scalable on-demand service platforms.',
  '## The Anatomy of an On-Demand Marketplace

Building a successful marketplace requires synchronizing three distinct user experiences into a unified real-time engine:

### 1. The Customer Experience (Booking & Upfront Payment)
- Transparent pricing and service selection.
- Upfront payment authorization with Stripe to prevent unpaid work.
- Live job tracking and instant invoice generation upon completion.

### 2. The Provider Experience (Mobile Dispatch & Proof of Work)
- Job acceptance with distance and schedule matching.
- In-app check-in and check-out.
- Mandatory photo upload (before and after proof) to eliminate customer dispute claims.

### 3. The Central Admin Portal (Operations & Payouts)
- Automated commission calculation and provider payout tracking.
- Real-time heatmaps of active, scheduled, and delayed jobs.
- Role-based permissions for dispatchers and support staff.

---
*Planning an on-demand marketplace or app? [Talk to our team about architecture and delivery timelines](/contact).*',
  'Marketplace Development',
  6,
  'How to Build a 3-Sided Marketplace App | The Digital Dude',
  'Learn the core architecture required to build a scalable on-demand marketplace connecting customers, providers, and central operations.'
)
on conflict (slug) do nothing;
