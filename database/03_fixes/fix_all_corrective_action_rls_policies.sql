-- Fix RLS policies for all corrective action tables to support Azure AD users
-- Azure AD users are not in Supabase auth, so they use anon role
-- This allows both Supabase authenticated users and Azure AD users to access the tables

-- =============================================================================
-- CORRECTIVE_ACTIONS TABLE
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to view corrective actions" ON corrective_actions;
DROP POLICY IF EXISTS "Allow authenticated users to insert corrective actions" ON corrective_actions;
DROP POLICY IF EXISTS "Allow authenticated users to update corrective actions" ON corrective_actions;

-- Create permissive policies
CREATE POLICY "Allow all users to view corrective actions" 
ON corrective_actions FOR SELECT 
USING (true);

CREATE POLICY "Allow all users to insert corrective actions" 
ON corrective_actions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all users to update corrective actions" 
ON corrective_actions FOR UPDATE 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- CORRECTIVE_ACTION_PHOTOS TABLE
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action photos" ON corrective_action_photos;

-- Create permissive policy
CREATE POLICY "Allow all users to access corrective action photos" 
ON corrective_action_photos FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- CORRECTIVE_ACTION_APPROVALS TABLE
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action approvals" ON corrective_action_approvals;

-- Create permissive policy
CREATE POLICY "Allow all users to access corrective action approvals" 
ON corrective_action_approvals FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- CORRECTIVE_ACTION_WORKFLOW TABLE
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action workflow" ON corrective_action_workflow;

-- Create permissive policy
CREATE POLICY "Allow all users to access corrective action workflow" 
ON corrective_action_workflow FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- CORRECTIVE_ACTION_NOTIFICATIONS TABLE
-- =============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users full access to corrective action notifications" ON corrective_action_notifications;

-- Create permissive policy
CREATE POLICY "Allow all users to access corrective action notifications" 
ON corrective_action_notifications FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify all policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN (
    'corrective_actions',
    'corrective_action_photos',
    'corrective_action_approvals',
    'corrective_action_workflow',
    'corrective_action_notifications'
)
ORDER BY tablename, policyname;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "Allow all users to view corrective actions" ON corrective_actions IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to view corrective actions. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to insert corrective actions" ON corrective_actions IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to create corrective actions. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to update corrective actions" ON corrective_actions IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to update corrective actions. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to access corrective action photos" ON corrective_action_photos IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to manage corrective action photos. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to access corrective action approvals" ON corrective_action_approvals IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to manage corrective action approvals. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to access corrective action workflow" ON corrective_action_workflow IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to manage corrective action workflow. App-level authentication is handled by Azure AD or Supabase auth.';

COMMENT ON POLICY "Allow all users to access corrective action notifications" ON corrective_action_notifications IS 
'Allows both authenticated (Supabase) and anon (Azure AD) users to manage corrective action notifications. App-level authentication is handled by Azure AD or Supabase auth.';

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 
    '✅ RLS policies updated for Azure AD support' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN (
    'corrective_actions',
    'corrective_action_photos',
    'corrective_action_approvals',
    'corrective_action_workflow',
    'corrective_action_notifications'
);
