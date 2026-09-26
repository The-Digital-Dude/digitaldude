create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_email text not null,
  company_name text not null,
  country text not null,
  team_size text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_submissions enable row level security;

-- Inserts happen only from the server (service role key), so no public
-- insert/select policy is created here. The service role bypasses RLS.
