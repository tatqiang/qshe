-- Test if safety_patrols RLS policies are working correctly
-- Run this to check current policies

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'safety_patrols';

-- List all policies for safety_patrols
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'safety_patrols';
