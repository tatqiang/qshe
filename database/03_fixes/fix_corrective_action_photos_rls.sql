-- Fix RLS policies for corrective_action_photos to support Azure AD users
-- Azure AD users are not in Supabase auth, so they use anon role

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action photos" ON corrective_action_photos;

-- Create permissive policy that allows both authenticated and anon users
CREATE POLICY "Allow all users to access corrective action photos" 
ON corrective_action_photos FOR ALL 
USING (true)
WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY "Allow all users to access corrective action photos" ON corrective_action_photos IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to manage corrective action photos. 
App-level authentication is handled by Azure AD or Supabase auth.';

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'corrective_action_photos';
