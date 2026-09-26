create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_email text not null,
  company_name text not null,
  country text not null,
  team_size text,
  message text,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  created_at timestamptz not null default now(),
  unique (slot_start)
);

alter table bookings enable row level security;

-- Inserts and reads happen only from the server (service role key), so no
-- public policy is created here. The service role bypasses RLS.
