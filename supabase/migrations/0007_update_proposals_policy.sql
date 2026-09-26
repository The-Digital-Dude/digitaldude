-- Migration: 0007_update_proposals_policy.sql
-- Description: Drop and replace public read policy to ensure existing deployments enforce status filtering for shared proposals

-- Drop every policy name this table has ever used, including the fully-open
-- one from an early draft of 0005 and the one 0005 actually creates today —
-- without both, a database that ran an older version of 0005 could keep an
-- unrestricted read policy active alongside the new one below.
DROP POLICY IF EXISTS "Allow public read of proposals" ON proposals;
DROP POLICY IF EXISTS "Allow public read of shared proposals" ON proposals;
DROP POLICY IF EXISTS "Public can view proposals by slug" ON proposals;
DROP POLICY IF EXISTS "Public can view published proposals" ON proposals;

CREATE POLICY "Public can view published proposals"
  ON proposals
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('sent', 'accepted', 'completed', 'active'));
