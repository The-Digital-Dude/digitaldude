-- Migration: 0006_crm_pipeline.sql
-- Description: Add CRM pipeline stages, deal values, lead scoring, and internal notes to bookings table

alter table bookings 
  add column if not exists meet_url text,
  add column if not exists stage text not null default 'new_booking',
  add column if not exists deal_value numeric not null default 8500,
  add column if not exists lead_score text not null default 'warm',
  add column if not exists lead_notes text default '',
  add column if not exists assigned_to text default 'The Digital Dude Team',
  add column if not exists updated_at timestamptz not null default now();

-- Ensure stage constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_stage_check'
  ) then
    alter table bookings add constraint bookings_stage_check 
      check (stage in ('new_booking', 'call_completed', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'));
  end if;
end $$;

-- Ensure lead_score constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_lead_score_check'
  ) then
    alter table bookings add constraint bookings_lead_score_check 
      check (lead_score in ('hot', 'warm', 'cold'));
  end if;
end $$;

-- Indexes for CRM pipeline queries
create index if not exists idx_bookings_stage on bookings(stage);
create index if not exists idx_bookings_lead_score on bookings(lead_score);
create index if not exists idx_bookings_slot_start on bookings(slot_start desc);


