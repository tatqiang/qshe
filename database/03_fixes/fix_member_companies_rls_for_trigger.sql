-- ============================================
-- Fix RLS for member_companies Trigger
-- ============================================
-- The auto-trigger needs to INSERT into member_companies
-- but RLS is blocking it. We need to allow anon role to INSERT

-- Drop existing policies
DROP POLICY IF EXISTS "member_companies_admin_all" ON member_companies;
DROP POLICY IF EXISTS "member_companies_public_select" ON member_companies;

-- Admin policy (unchanged)
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

-- Public SELECT (unchanged)
CREATE POLICY "member_companies_public_select"
ON member_companies
FOR SELECT
TO anon
USING (status = 'active');

-- NEW: Allow anon role to INSERT (for trigger auto-creation)
CREATE POLICY "member_companies_trigger_insert"
ON member_companies
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'member_companies'
ORDER BY policyname;
