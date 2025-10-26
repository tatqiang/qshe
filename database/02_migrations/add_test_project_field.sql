-- Add test project identification field to projects table
-- Test projects are visible only to system_admin and excluded from dashboard statistics

-- =============================================================================
-- ADD is_test_project FIELD
-- =============================================================================

-- Add the field
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_test_project BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN projects.is_test_project IS 
'Identifies test/sandbox projects. When true: only visible to system_admin users, excluded from dashboard statistics and reports.';

-- =============================================================================
-- UPDATE EXISTING TEST PROJECT (if you have one)
-- =============================================================================

-- Example: Mark a specific project as test project
-- UPDATE projects 
-- SET is_test_project = true 
-- WHERE project_code = 'TEST' OR name ILIKE '%test%';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check the new column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'is_test_project';

-- View all projects with test flag
SELECT 
    id,
    project_code,
    name,
    status,
    is_test_project,
    created_at
FROM projects
ORDER BY is_test_project DESC, created_at DESC;

-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================

-- Create a new test project
/*
INSERT INTO projects (
    project_code,
    name,
    description,
    status,
    is_test_project,
    created_at,
    updated_at
) VALUES (
    'TEST-001',
    'Test Project - System Admin Only',
    'Sandbox project for testing features - not included in statistics',
    'active',
    true,
    NOW(),
    NOW()
);
*/

-- Mark existing project as test
/*
UPDATE projects 
SET is_test_project = true 
WHERE project_code = 'YOUR-TEST-PROJECT-CODE';
*/

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 
    '✅ is_test_project field added to projects table' as status,
    COUNT(*) FILTER (WHERE is_test_project = true) as test_projects_count,
    COUNT(*) FILTER (WHERE is_test_project = false OR is_test_project IS NULL) as production_projects_count,
    COUNT(*) as total_projects
FROM projects;
