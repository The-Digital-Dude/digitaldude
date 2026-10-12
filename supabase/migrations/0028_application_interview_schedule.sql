-- Migration: 0028_application_interview_schedule.sql
-- Description: Stores the scheduled interview time and Google Meet link on job_applications.

alter table if exists job_applications
  add column if not exists interview_at timestamptz,
  add column if not exists interview_meeting_link text default '';
