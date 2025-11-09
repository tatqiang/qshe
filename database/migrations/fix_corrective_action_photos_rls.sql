-- Fix RLS policies for corrective_action_photos to support all users
-- This allows both authenticated and anon users to manage photos

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to view corrective_action_photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to insert corrective_action_photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to update corrective_action_photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow all to delete corrective_action_photos" ON corrective_action_photos;
DROP POLICY IF EXISTS "Allow all users to access corrective action photos" ON corrective_action_photos;

-- Enable RLS if not already enabled
ALTER TABLE corrective_action_photos ENABLE ROW LEVEL SECURITY;

-- Create permissive policy that allows all operations
CREATE POLICY "Allow all users to access corrective action photos" 
ON corrective_action_photos FOR ALL 
USING (true)
WITH CHECK (true);

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'corrective_action_photos';
