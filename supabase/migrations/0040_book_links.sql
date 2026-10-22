-- Migration: 0040_book_links
-- One short private link per outreach email (digitaldude.co.uk/b/<code>). The landing page looks up who sent it, who it is for and their
-- industry from this row, so no names or email addresses ever appear in the URL and the link cannot be edited to impersonate someone.
-- Views, button clicks and the resulting booking are counted per link, which is what the reports are built from.
-- Rows expire after 180 days (after that the page is still shown, just without the personal details).
-- Requires 0011 (employees) and 0022 (acq_contacts).

create table if not exists public.rep_book_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9]{8,12}$'),
  employee_id uuid references public.employees(id) on delete cascade,        -- null for admin campaign emails
  contact_id uuid references public.acq_contacts(id) on delete set null,
  recipient_email text,
  recipient_name text,
  company_name text,
  industry text,
  stage text not null default 'cold' check (stage in ('cold', 'follow_up')),
  source text not null default 'rep_outreach' check (source in ('rep_outreach', 'rep_drip', 'admin_campaign')),
  template_used text,
  design text,
  views integer not null default 0,
  cta_clicks integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  booking_id uuid,
  booked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '180 days'),
  created_at timestamptz not null default now()
);
create index if not exists rep_book_links_employee_idx on public.rep_book_links (employee_id, created_at desc);
create index if not exists rep_book_links_report_idx on public.rep_book_links (industry, stage, template_used);

-- Atomic counters (many people can open a link at once).
create or replace function public.rep_book_link_view(p_code text)
returns public.rep_book_links language sql as $$
  update public.rep_book_links
     set views = views + 1, first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now()
   where code = p_code
  returning *
$$;

create or replace function public.rep_book_link_click(p_code text)
returns void language sql as $$
  update public.rep_book_links set cta_clicks = cta_clicks + 1 where code = p_code
$$;

do $$
declare r text; f text;
begin
  alter table public.rep_book_links enable row level security;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on public.rep_book_links from %I', r);
    end if;
  end loop;
  foreach f in array array['rep_book_link_view(text)', 'rep_book_link_click(text)'] loop
    execute format('revoke execute on function public.%s from public', f);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke execute on function public.%s from %I', f, r);
      end if;
    end loop;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function public.%s to service_role', f);
    end if;
  end loop;
end $$;
