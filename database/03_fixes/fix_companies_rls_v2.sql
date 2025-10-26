-- CORRECTED RLS FIX for companies table
-- This version ensures ALL authenticated users can access companies

-- Step 1: Disable RLS temporarily to make changes
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Step 3: Create PERMISSIVE policies (not RESTRICTIVE)
-- Allow ALL authenticated users to SELECT
CREATE POLICY "companies_select_policy" ON companies
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Allow ALL authenticated users to INSERT
CREATE POLICY "companies_insert_policy" ON companies
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow ALL authenticated users to UPDATE
CREATE POLICY "companies_update_policy" ON companies
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow service_role to DELETE (admin only)
CREATE POLICY "companies_delete_policy" ON companies
AS PERMISSIVE
FOR DELETE
TO service_role
USING (true);

-- Step 4: Re-enable RLS with the new policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Step 5: Revoke any existing permissions and regrant
REVOKE ALL ON companies FROM authenticated;
REVOKE ALL ON companies FROM anon;

-- Grant table-level permissions to authenticated role
GRANT SELECT ON companies TO authenticated;
GRANT INSERT ON companies TO authenticated;  
GRANT UPDATE ON companies TO authenticated;

-- Grant full access to service_role
GRANT ALL ON companies TO service_role;

-- Step 6: Verify the setup
SELECT 
  'companies' as table_name,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'companies';

SELECT 
  policyname as policy_name,
  cmd as command,
  roles,
  permissive as is_permissive
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd;

SELECT '✅ RLS policies updated successfully!' as status;
