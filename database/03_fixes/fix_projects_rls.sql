-- Check and fix Row Level Security (RLS) for projects table
-- This allows authenticated users to read projects

-- Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'projects';

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;

-- Option 1: Disable RLS completely (easiest for development)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Option 2: OR enable RLS with permissive policy (if you want RLS)
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations for authenticated users"
-- ON public.projects
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
--
-- CREATE POLICY "Allow all operations for anon users"
-- ON public.projects
-- FOR ALL
-- TO anon
-- USING (true)
-- WITH CHECK (true);

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'projects';

-- Test query (should return your 3 active projects)
SELECT * FROM projects WHERE status = 'active';
