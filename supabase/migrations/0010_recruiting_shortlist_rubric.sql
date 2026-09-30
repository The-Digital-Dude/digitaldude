-- Migration: 0010_recruiting_shortlist_rubric.sql
-- Description: Adds shortlisted status check, paid task submission, deadline, bKash tracking, and structured rubric evaluation support to job_applications.

-- 1. Update status constraint to include 'shortlisted'
do $$
begin
  alter table job_applications drop constraint if exists job_applications_status_check;
  alter table job_applications add constraint job_applications_status_check
    check (status in ('new', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'));
exception
  when others then
    null;
end $$;

-- 2. Add columns for task tracking, deadlines, and bKash payout details
alter table if exists job_applications
  add column if not exists task_submission_url text default '',
  add column if not exists task_deadline timestamptz,
  add column if not exists bkash_number text default '',
  add column if not exists bkash_payment_status text default 'unpaid',
  add column if not exists bkash_payment_amount numeric default 500,
  add column if not exists bkash_transaction_id text default '';

-- 3. Add index for fast querying by status and payout status
create index if not exists idx_job_applications_bkash_status on job_applications(bkash_payment_status);
