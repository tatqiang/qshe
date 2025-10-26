-- ============================================
-- Fix ALL RLS Policies for Member Registration
-- ============================================
-- This allows anon users to:
-- 1. INSERT into member_applications
-- 2. Auto-trigger to INSERT into member_companies

-- ============================================
-- FIX 1: member_applications RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "member_applications_insert_policy" ON member_applications;

-- Allow anon to INSERT (for public form submissions)
CREATE POLICY "member_applications_insert_policy"
ON member_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to SELECT (for viewing submitted members in public page)
DROP POLICY IF EXISTS "member_applications_public_select" ON member_applications;

CREATE POLICY "member_applications_public_select"
ON member_applications
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- FIX 2: member_companies RLS  
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "member_companies_admin_all" ON member_companies;
DROP POLICY IF EXISTS "member_companies_public_select" ON member_companies;
DROP POLICY IF EXISTS "member_companies_trigger_insert" ON member_companies;

-- Admin policy
CREATE POLICY "member_companies_admin_all"
ON member_companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role IN ('system_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role IN ('system_admin', 'admin')
  )
);

-- Public SELECT
CREATE POLICY "member_companies_public_select"
ON member_companies
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- Allow INSERT for trigger auto-creation
CREATE POLICY "member_companies_trigger_insert"
ON member_companies
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Verify policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('member_applications', 'member_companies')
ORDER BY tablename, policyname;
