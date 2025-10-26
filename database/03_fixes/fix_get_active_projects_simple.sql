-- Fix get_active_projects RPC function
-- Matches actual Supabase projects table schema (with UUID id)

-- Drop existing function if any version exists
DROP FUNCTION IF EXISTS public.get_active_projects();

-- Create simplified function
CREATE OR REPLACE FUNCTION public.get_active_projects()
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT *
    FROM projects
    WHERE status = 'active'
    ORDER BY project_code;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_active_projects() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_projects() TO anon;

-- Test the function
SELECT * FROM get_active_projects();
