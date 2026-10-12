-- Migration: 0037_ai_compose_override
-- 1. AI-written emails per contact: acq_campaigns.ai_compose, plus a per-lead follow-up text written at draft time.
--    The follow-up text is covered by the campaign approval hash, so it is reviewed and approved with the first email and
--    editing it afterwards pauses sending exactly like any other approved content.
-- 2. Admin override of the one-contact-per-company rule, per company (reps cannot set it).
-- Requires 0022-0036.

alter table public.acq_campaigns add column if not exists ai_compose boolean not null default false;

alter table public.acq_campaign_leads
  add column if not exists followup_subject text,
  add column if not exists followup_body text;

alter table public.acq_companies add column if not exists allow_multiple_contacts boolean not null default false;

-- Same hash as before for every existing campaign (the new term is NULL, and concat_ws skips NULLs), extended with the
-- per-lead follow-up text when a campaign has any.
create or replace function public.acq_campaign_content_hash(p_campaign_id uuid)
returns text language sql stable as $$
  select encode(sha256(convert_to(
    concat_ws(chr(31),
      c.market, c.daily_limit::text,
      c.sender_name, c.sender_business, c.sender_postal_address, c.sender_email,
      c.subject_template, c.body_template,
      c.followup_enabled::text, c.followup_delay_business_days::text, coalesce(c.followup_body_template, ''),
      coalesce((
        select string_agg(m.campaign_lead_id::text || ':' || public.acq_message_hash(m.subject, m.body), ',' order by m.campaign_lead_id)
          from public.acq_email_messages m
          join public.acq_campaign_leads l on l.id = m.campaign_lead_id
         where l.campaign_id = c.id and m.direction = 'outbound' and m.kind = 'initial'
      ), ''),
      (
        select string_agg(l.id::text || ':' || public.acq_message_hash(coalesce(l.followup_subject, ''), l.followup_body), ',' order by l.id)
          from public.acq_campaign_leads l
         where l.campaign_id = c.id and l.followup_body is not null
      )
    ), 'UTF8')), 'hex')
  from public.acq_campaigns c where c.id = p_campaign_id
$$;

-- The one-contact rule now respects the admin's per-company override (everything else is unchanged from 0034).
create or replace function public.acq_company_other_active(p_contact_id uuid)
returns boolean language plpgsql stable as $$
declare ct public.acq_contacts; hit boolean := false;
begin
  select * into ct from public.acq_contacts where id = p_contact_id;
  if ct.id is null or ct.company_id is null then return false; end if;
  if exists (select 1 from public.acq_companies x where x.id = ct.company_id and x.allow_multiple_contacts) then return false; end if;

  if exists (
    select 1 from public.acq_contacts o
      join public.acq_campaign_leads l on l.contact_id = o.id
     where o.company_id = ct.company_id and o.id <> ct.id
       and (l.status in ('sent','follow_up_due','replied')
            or (l.status = 'approved' and exists (select 1 from public.acq_email_messages m
                 where m.campaign_lead_id = l.id and m.direction = 'outbound' and m.status in ('sending','sent','delivered'))))
  ) then return true; end if;

  if to_regclass('public.rep_outreach_logs') is not null then
    execute 'select exists (select 1 from public.rep_outreach_logs g join public.acq_contacts o on o.email_normalized = lower(btrim(g.recipient_email))
              where o.company_id = $1 and o.id <> $2 and g.sent_at > now() - interval ''30 days'')' into hit using ct.company_id, ct.id;
    if hit then return true; end if;
  end if;

  if to_regclass('public.rep_campaign_enrollments') is not null and to_regclass('public.rep_leads') is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'rep_leads' and column_name = 'acq_contact_id') then
    execute 'select exists (select 1 from public.rep_campaign_enrollments e join public.rep_leads rl on rl.id = e.lead_id join public.acq_contacts o on o.id = rl.acq_contact_id
              where o.company_id = $1 and o.id <> $2 and e.status = ''active'')' into hit using ct.company_id, ct.id;
    if hit then return true; end if;
  end if;
  return false;
end $$;

do $$
declare r text;
begin
  revoke execute on function public.acq_company_other_active(uuid) from public;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on function public.acq_company_other_active(uuid) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.acq_company_other_active(uuid) to service_role;
  end if;
end $$;
