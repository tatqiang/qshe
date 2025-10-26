-- Add project_code column to projects table and insert sample projects
-- Execute this in Supabase SQL Editor

-- Add project_code column to projects table (if it doesn't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_code') THEN
        ALTER TABLE projects ADD COLUMN project_code VARCHAR(50) UNIQUE NOT NULL DEFAULT '';
    END IF;
END $$;

-- Add project_manager_id column to projects table (foreign key to users table)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'project_manager_id') THEN
        ALTER TABLE projects ADD COLUMN project_manager_id UUID;
        
        -- Create foreign key constraint to users table
        ALTER TABLE projects 
        ADD CONSTRAINT fk_projects_project_manager_id 
        FOREIGN KEY (project_manager_id) REFERENCES users(id);
    END IF;
END $$;

-- Update existing projects with project codes (if any exist)
UPDATE projects SET project_code = 'LEGACY-' || LPAD(id::text, 3, '0') WHERE project_code = '';

-- Insert sample projects with project_code (matching actual table structure)
INSERT INTO projects (
    project_code,
    name,
    description,
    status,
    created_at,
    updated_at
) VALUES 
(
    'AIC',
    'Downtown Office Complex',
    'Construction of 25-story office building with underground parking',
    'active',
    NOW(),
    NOW()
),
(
    'RM1',
    'Highway Bridge Construction',
    'Construction of 2.5km bridge spanning the Chao Phraya River',
    'active',
    NOW(),
    NOW()
),
(
    'MEGA',
    'Mega Shopping Mall Project',
    'Development of large-scale retail complex with entertainment facilities',
    'active',
    NOW(),
    NOW()
),
(
    'GG-U001',
    'Underground Utility Tunnel',
    'Construction of underground utility corridor for city infrastructure',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (project_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Create index on project_code for better performance
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);

-- Update safety_patrols table to reference project_code (if needed)
-- Add project_code column to patrols table for better tracking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patrols' AND column_name = 'project_code') THEN
        ALTER TABLE patrols ADD COLUMN project_code VARCHAR(50);
        
        -- Create foreign key constraint to projects table
        ALTER TABLE patrols 
        ADD CONSTRAINT fk_patrols_project_code 
        FOREIGN KEY (project_code) REFERENCES projects(project_code);
    END IF;
END $$;

-- Create function to get active projects for selection (matching actual table structure)
CREATE OR REPLACE FUNCTION get_active_projects()
RETURNS TABLE (
    id TEXT,
    project_code VARCHAR(50),
    name TEXT,
    description TEXT,
    status TEXT,
    project_manager_id TEXT,
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
        p.status::TEXT,
        p.project_manager_id::TEXT,
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

-- Create function to get project statistics
CREATE OR REPLACE FUNCTION get_project_statistics()
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    inactive_projects BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_projects,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_projects,
        COUNT(*) FILTER (WHERE status = 'inactive')::BIGINT as inactive_projects
    FROM projects;
END;
$$;

-- Grant permissions for the statistics function
GRANT EXECUTE ON FUNCTION get_project_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_statistics() TO anon;

-- Verify the setup
SELECT 
    'Projects created:' as result,
    COUNT(*) as count
FROM projects 
WHERE project_code IN ('AIC', 'RM1', 'MEGA', 'GG-U001');

-- Show the created projects
SELECT 
    project_code,
    name,
    status,
    description
FROM projects
ORDER BY project_code;
