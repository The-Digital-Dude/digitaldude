-- acq_reserve_send: also refuse contacts whose company is archived or closed (lost/dead). Otherwise identical to 0026.
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
