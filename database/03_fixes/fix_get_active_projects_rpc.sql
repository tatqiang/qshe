-- Fix get_active_projects RPC function
-- This function returns active projects without requiring project_manager_id column

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_active_projects();

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_active_projects()
RETURNS TABLE (
    id TEXT,
    project_code VARCHAR(50),
    name TEXT,
    description TEXT,
    project_start TIMESTAMP WITH TIME ZONE,
    project_end TIMESTAMP WITH TIME ZONE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id::TEXT,
        p.project_code,
        p.name::TEXT,
        p.description::TEXT,
        p.project_start,
        p.project_end,
        p.status::TEXT,
        p.created_at,
        p.updated_at
    FROM projects p
    WHERE p.status = 'active'
    ORDER BY p.project_code, p.name;
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION get_active_projects() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_projects() TO anon;

-- Verify the function works
SELECT * FROM get_active_projects();
