-- Fix safety_audit_companies RLS permissions
-- Date: October 17, 2025

-- Disable RLS on safety_audit_companies table
ALTER TABLE safety_audit_companies DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "safety_audit_companies_select_policy" ON safety_audit_companies;
DROP POLICY IF EXISTS "safety_audit_companies_insert_policy" ON safety_audit_companies;
DROP POLICY IF EXISTS "safety_audit_companies_update_policy" ON safety_audit_companies;
DROP POLICY IF EXISTS "safety_audit_companies_delete_policy" ON safety_audit_companies;

-- Grant full permissions to PUBLIC
GRANT SELECT, INSERT, UPDATE, DELETE ON safety_audit_companies TO PUBLIC;

-- Verify the fix
SELECT 
  'safety_audit_companies' as table_name,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '⚠️ RLS is still ENABLED' 
    ELSE '✅ RLS is DISABLED - Full access granted'
  END as status
FROM pg_tables 
WHERE tablename = 'safety_audit_companies';

SELECT '✅ safety_audit_companies table is now fully accessible!' as final_status;
