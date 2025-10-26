-- Fix RLS on safety_audit_results table to allow inserts
-- This disables RLS completely and grants all operations to PUBLIC

-- Disable RLS
ALTER TABLE safety_audit_results DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to PUBLIC (anyone using the Supabase client can access)
GRANT ALL ON safety_audit_results TO PUBLIC;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'safety_audit_results';
