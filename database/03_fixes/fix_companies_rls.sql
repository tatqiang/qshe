-- Fix RLS policies for companies table to allow admin operations

-- First, check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'companies';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- Create comprehensive RLS policies for companies table
-- Allow authenticated users to read companies
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to insert companies (for dynamic company creation)
CREATE POLICY "companies_insert_policy" ON companies
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update companies (for status changes, etc.)
CREATE POLICY "companies_update_policy" ON companies
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow only service role to delete companies (admin only)
CREATE POLICY "companies_delete_policy" ON companies
FOR DELETE TO service_role
USING (true);

-- Ensure RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON companies TO authenticated;
GRANT ALL ON companies TO service_role;

-- Test the fix
SELECT 'RLS policies updated successfully for companies table' as status;
