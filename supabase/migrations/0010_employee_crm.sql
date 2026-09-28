-- Migration: 0010_employee_crm.sql
-- Description: Adds referral_code & currency to employees, and commission payout tracking to bookings.

alter table if exists employees
  add column if not exists referral_code text,
  add column if not exists currency text not null default 'BDT';

create unique index if not exists idx_employees_referral_code on employees(referral_code) where referral_code is not null;

alter table if exists bookings
  add column if not exists meeting_bonus_payout_status text not null default 'pending',
  add column if not exists deal_commission_payout_status text not null default 'pending',
  add column if not exists payout_notes text;
