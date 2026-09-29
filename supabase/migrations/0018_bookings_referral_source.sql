-- Migration: 0018_bookings_referral_source.sql
-- Description: Adds referral_source column to bookings table for referral tracking and attribution

ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sourced_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_referral_source ON bookings(referral_source);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sourced_by_employee_id ON bookings(sourced_by_employee_id);
