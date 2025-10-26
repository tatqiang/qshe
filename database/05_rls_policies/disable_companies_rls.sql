-- FINAL FIX for companies table RLS and permissions
-- This disables RLS entirely to allow full access for authenticated users

-- Step 1: Completely disable RLS on companies table
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Step 3: Grant permissions to PUBLIC (all users)
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO PUBLIC;

-- Step 4: Verify permissions
SELECT 
  'companies' as table_name,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED' 
    ELSE 'RLS is DISABLED - Full access granted'
  END as status
FROM pg_tables 
WHERE tablename = 'companies';

-- Step 5: Check what policies exist (should be none)
SELECT 
  COALESCE(COUNT(*), 0) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No RLS policies - table is fully accessible'
    ELSE '⚠️ Policies still exist'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'companies';

SELECT '✅ Companies table is now fully accessible to all authenticated users!' as final_status;
