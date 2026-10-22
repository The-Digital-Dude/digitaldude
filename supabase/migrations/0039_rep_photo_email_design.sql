-- Migration: 0039_rep_photo_email_design
-- A profile photo for each rep (shown in the email signature and on the booking page), stored in a public bucket under an
-- unguessable file name. The email "Look and feel" settings live in acq_settings (key 'email_brand'), so no table is needed.
-- Requires 0011 (employees) and Supabase Storage (the bucket step is skipped safely where Storage is not available).

do $$
begin
  if to_regclass('public.employees') is not null then
    alter table public.employees add column if not exists photo_url text;
  end if;
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('rep-photos', 'rep-photos', true)
    on conflict (id) do nothing;
  end if;
end $$;
