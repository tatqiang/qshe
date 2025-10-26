-- Quick check: Is RLS blocking your projects?
-- Run this to see if RLS is the problem

-- 1. Check if RLS is enabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'projects';

-- 2. Check what policies exist
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'projects';

-- 3. Try to query projects (see how many rows you get)
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as active_projects FROM projects WHERE status = 'active';

-- 4. See the actual data
SELECT 
    project_code,
    name,
    status,
    created_at
FROM projects
ORDER BY project_code;

-- If you see 0 rows but you know data exists, RLS is blocking access!
