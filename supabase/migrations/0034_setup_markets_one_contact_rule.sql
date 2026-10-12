-- Migration: 0034_setup_markets_one_contact_rule
-- 1. Enables Ireland, Netherlands and Germany for outreach (stricter: documented legitimate-interest basis needed).
-- 2. Puts the Dhaka head office into the email footer postal address (only if no address is set yet).
-- 3. Seeds 7 industries x AU/UK/US as markets, all DISABLED: turn on one at a time in Admin > Acquisition > Markets
--    so discovery cost stays under control.
-- 4. "One contact per company at a time": a first email to a contact is refused while another contact at the same
--    company has a live conversation (admin campaign sent/awaiting follow-up/replied, rep email in the last 30 days,
--    or an active rep drip). Applies to admin campaigns (acq_reserve_send) and reps (acq_rep_can_email).
-- Requires 0022-0033.

insert into public.acq_country_rules (country, name, email_allowed, requires_postal_address, notes) values
  ('IE', 'Ireland', true, true, 'GDPR + ePrivacy: B2B email needs a documented legitimate-interest assessment, clear identification and an easy opt-out. Record the basis per contact.'),
  ('NL', 'Netherlands', true, true, 'GDPR + Telecommunicatiewet: B2B to corporate addresses is possible with identification and opt-out; sole traders count as consumers. Record the basis per contact.'),
  ('DE', 'Germany', true, true, 'GDPR + UWG s.7: unsolicited B2B email is strict. Prefer prior consent or a clear existing relationship; document the basis per contact.')
on conflict (country) do nothing;

insert into public.acq_settings (key, value)
values ('sender_identity', '{"business":"The Digital Dude","postalAddress":"Dhanmondi, Dhaka, Bangladesh"}'::jsonb)
on conflict (key) do update
   set value = coalesce(public.acq_settings.value, '{}'::jsonb) || jsonb_build_object('postalAddress', 'Dhanmondi, Dhaka, Bangladesh')
 where coalesce(btrim(public.acq_settings.value->>'postalAddress'), '') = '';

with ind(industry, phrases, qual) as (values
  ('Business automation', array['operations heavy business manual processes','growing company needs custom software','business process automation services client'],
     'Businesses with manual, spreadsheet-heavy operations that could benefit from custom systems, workflow automation and integrations.'),
  ('Property management', array['property management company','rental property managers','letting and property management agency'],
     'Property management businesses that could benefit from custom software, workflow automation and owner/tenant reporting.'),
  ('Recruitment agencies', array['recruitment agency','staffing agency','executive search firm'],
     'Recruitment firms that could benefit from candidate/CRM systems, automation of sourcing and placement workflows.'),
  ('Logistics', array['logistics company','freight forwarding company','courier and delivery company'],
     'Logistics and freight businesses that could benefit from tracking, dispatch, booking and reporting systems.'),
  ('Travel agencies', array['travel agency','tour operator','corporate travel management company'],
     'Travel and tour businesses that could benefit from booking systems, itinerary automation and customer portals.'),
  ('Education providers', array['private college','training provider','tutoring and education centre'],
     'Education and training providers that could benefit from enrolment, scheduling and student-management systems.'),
  ('Home services', array['home services company','cleaning and maintenance company','electrical and plumbing contractor'],
     'Home-service businesses that could benefit from job scheduling, quoting, invoicing and customer-booking systems.')
), ctry(code, label, places, suffixes) as (values
  ('AU', 'Australia', array['Sydney','Melbourne','Brisbane','Perth','Adelaide','Canberra','Gold Coast','Newcastle'], array['.au']),
  ('GB', 'United Kingdom', array['London','Manchester','Birmingham','Leeds','Glasgow','Bristol','Liverpool','Edinburgh'], array['.uk']),
  ('US', 'United States', array['New York','Los Angeles','Chicago','Houston','Phoenix','Dallas','Atlanta','Miami'], array[]::text[])
)
insert into public.acq_markets (name, industry, country, search_phrases, places, qualification_text, domain_suffixes, enabled)
select ind.industry || ' - ' || ctry.label, ind.industry, ctry.code, ind.phrases, ctry.places, ind.qual, ctry.suffixes, false
  from ind cross join ctry
on conflict (name) do nothing;

-- True when ANOTHER contact at the same company has a live conversation.
create or replace function public.acq_company_other_active(p_contact_id uuid)
returns boolean language plpgsql stable as $$
declare ct public.acq_contacts; hit boolean := false;
begin
  select * into ct from public.acq_contacts where id = p_contact_id;
  if ct.id is null or ct.company_id is null then return false; end if;

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

create or replace function public.acq_reserve_send(p_message_id uuid)
returns table (ok boolean, reason text) language plpgsql as $$
declare
  m public.acq_email_messages; l public.acq_campaign_leads; c public.acq_campaigns; ct public.acq_contacts;
  paused boolean; day_start timestamptz; used int;
begin
  select * into m from public.acq_email_messages where id = p_message_id;
  if m.id is null or m.direction <> 'outbound' then return query select false, 'message_not_found'; return; end if;
  select * into l from public.acq_campaign_leads where id = m.campaign_lead_id;
  -- Lock the campaign first so the daily-limit count is race-free.
  select * into c from public.acq_campaigns where id = l.campaign_id for update;
  select * into m from public.acq_email_messages where id = p_message_id for update;
  select * into l from public.acq_campaign_leads where id = m.campaign_lead_id for update;
  select * into ct from public.acq_contacts where id = l.contact_id;

  select coalesce((select (value)::text = 'true' from public.acq_settings where key = 'sending_paused'), true) into paused;
  if paused then return query select false, 'sending_paused'; return; end if;

  if c.status <> 'active' then return query select false, 'campaign_not_active'; return; end if;
  if c.approved_content_hash is null or c.approved_content_hash <> public.acq_campaign_content_hash(c.id) then
    return query select false, 'campaign_content_changed'; return;
  end if;
  if m.status <> 'approved' then return query select false, 'message_not_approved'; return; end if;
  if m.content_hash is null or m.content_hash <> public.acq_message_hash(m.subject, m.body) then
    return query select false, 'message_content_changed'; return;
  end if;

  if ct.id is null or ct.status <> 'eligible' then return query select false, 'contact_not_eligible'; return; end if;
  -- Suppression is checked here, in the same transaction as the reservation.
  if public.acq_is_suppressed(ct.email) then return query select false, 'suppressed'; return; end if;
  -- Never email people at a company that was archived (e.g. merged as a duplicate) or closed out as lost/dead.
  if exists (select 1 from public.acq_companies x where x.id = ct.company_id and (x.status = 'archived' or x.pool_status in ('lost','dead'))) then
    return query select false, 'company_closed'; return;
  end if;
  -- One person at a company at a time: skip a first email while a colleague's conversation is still live.
  if m.kind = 'initial' and public.acq_company_other_active(ct.id) then
    return query select false, 'company_has_active_contact'; return;
  end if;
  -- The contact's company country must have an enabled email rule (fail closed when unknown).
  if not public.acq_company_country_ok(ct.company_id) then return query select false, 'country_blocked'; return; end if;
  if not public.acq_contact_consent_ok(ct.id) then return query select false, 'consent_invalid'; return; end if;

  if m.kind = 'initial' then
    if l.status <> 'approved' then return query select false, 'lead_not_sendable'; return; end if;
  else
    if not c.followup_enabled then return query select false, 'followup_disabled'; return; end if;
    if l.status <> 'follow_up_due' then return query select false, 'lead_not_sendable'; return; end if;
    if l.next_action_at is null or l.next_action_at > now() then return query select false, 'follow_up_not_due'; return; end if;
    -- Out-of-office and bounce notices are not conversations; anything else is.
    if exists (select 1 from public.acq_replies r where r.contact_id = ct.id
                and r.classification not in ('out_of_office','bounce')) then
      return query select false, 'has_reply'; return;
    end if;
    if not exists (select 1 from public.acq_email_messages i
                    where i.campaign_lead_id = l.id and i.kind = 'initial' and i.status in ('sent','delivered')) then
      return query select false, 'initial_not_delivered'; return;
    end if;
  end if;

  -- Daily cap across the whole campaign (Australia/Sydney calendar day).
  day_start := date_trunc('day', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney';
  select count(*) into used from public.acq_email_messages x
    join public.acq_campaign_leads xl on xl.id = x.campaign_lead_id
   where xl.campaign_id = c.id and x.direction = 'outbound'
     and x.reserved_at >= day_start and x.status in ('sending','sent','delivered','bounced');
  if used >= c.daily_limit then return query select false, 'daily_limit_reached'; return; end if;

  update public.acq_email_messages set status = 'sending', reserved_at = now() where id = m.id;
  return query select true, null::text;
end $$;

create or replace function public.acq_rep_can_email(p_contact_id uuid, p_employee uuid)
returns table (ok boolean, reason text) language plpgsql stable as $$
declare ct public.acq_contacts; co public.acq_companies;
begin
  select * into ct from public.acq_contacts where id = p_contact_id;
  if ct.id is null then return query select false, 'contact_not_found'; return; end if;
  select * into co from public.acq_companies where id = ct.company_id;
  if co.id is null then return query select false, 'no_company'; return; end if;
  if co.owner_employee_id is distinct from p_employee then return query select false, 'not_your_company'; return; end if;
  if co.status = 'archived' then return query select false, 'company_archived'; return; end if;
  if ct.status <> 'eligible' then return query select false, 'contact_not_eligible'; return; end if;
  if public.acq_is_suppressed(ct.email) then return query select false, 'suppressed'; return; end if;
  if not public.acq_contact_consent_ok(ct.id) then return query select false, 'consent_invalid'; return; end if;
  if public.acq_company_other_active(ct.id) then return query select false, 'company_has_active_contact'; return; end if;
  if not public.acq_country_allowed(co.country) then return query select false, 'country_blocked'; return; end if;
  return query select true, null::text;
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
    grant execute on function public.acq_reserve_send(uuid) to service_role;
    grant execute on function public.acq_rep_can_email(uuid,uuid) to service_role;
  end if;
end $$;
