-- Migration: 0009_recruiting_scorecard.sql
-- Description: Adds scorecard JSONB column to job_applications for multi-factor candidate ratings.

alter table if exists job_applications
  add column if not exists scorecard jsonb not null default '{}'::jsonb;
