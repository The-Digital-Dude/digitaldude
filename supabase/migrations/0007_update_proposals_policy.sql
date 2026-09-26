-- Migration: 0007_update_proposals_policy.sql
-- Description: Drop and replace public read policy to ensure existing deployments enforce status filtering for shared proposals

DROP POLICY IF EXISTS "Public can view proposals by slug" ON proposals;
DROP POLICY IF EXISTS "Public can view published proposals" ON proposals;

CREATE POLICY "Public can view published proposals"
  ON proposals
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('sent', 'accepted', 'completed', 'active'));
