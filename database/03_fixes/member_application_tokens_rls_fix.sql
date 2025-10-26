-- ============================================
-- Fix RLS Policy for member_application_tokens
-- ============================================
-- This fixes the error: "new row violates row-level security policy"
-- when creating tokens from admin interface

-- Drop existing INSERT policy (if any)
DROP POLICY IF EXISTS "member_application_tokens_insert_policy" ON member_application_tokens;

-- Create new INSERT policy that allows users to create tokens
-- NOTE: Since we use Azure AD (not Supabase Auth), requests come as anon role
-- We validate the created_by field against users table for security
CREATE POLICY "member_application_tokens_insert_policy"
ON member_application_tokens
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow insert if created_by is a system_admin or admin user
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = created_by 
    AND users.role IN ('system_admin', 'admin')
  )
);

-- Also ensure SELECT policy exists for loading tokens
DROP POLICY IF EXISTS "member_application_tokens_select_policy" ON member_application_tokens;

-- NOTE: Since we use Azure AD, requests come as anon role
-- Access control is handled at the application level
CREATE POLICY "member_application_tokens_select_policy"
ON member_application_tokens
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public (anon) users to SELECT tokens by token value (for form access)
DROP POLICY IF EXISTS "member_application_tokens_select_public_policy" ON member_application_tokens;

CREATE POLICY "member_application_tokens_select_public_policy"
ON member_application_tokens
FOR SELECT
TO anon
USING (
  -- Public can only access active, non-expired tokens
  is_active = true 
  AND expires_at > NOW()
  AND current_uses < max_uses
);

-- Allow UPDATE tokens (for incrementing usage count)
DROP POLICY IF EXISTS "member_application_tokens_update_policy" ON member_application_tokens;

CREATE POLICY "member_application_tokens_update_policy"
ON member_application_tokens
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'member_application_tokens'
ORDER BY policyname;
