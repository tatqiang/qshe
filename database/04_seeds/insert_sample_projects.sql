-- Insert sample projects for testing
-- This will give you initial data to see in the project selection

-- Clear existing projects (optional - comment out if you want to keep existing data)
-- DELETE FROM projects;

-- Insert sample projects
INSERT INTO projects (id, project_code, name, description, project_start, project_end, status, created_at, updated_at)
VALUES
  (
    gen_random_uuid(),
    'JEC001',
    'Central Plaza Office Tower',
    'Construction of 40-story office building in Bangkok CBD',
    '2025-01-15',
    '2026-12-31',
    'active',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'JEC002',
    'Warehouse Complex Rayong',
    'Industrial warehouse facility with automated systems',
    '2025-02-01',
    '2025-11-30',
    'active',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'JEC003',
    'Metro Station Extension',
    'MRT station mechanical and electrical systems',
    '2024-06-01',
    '2025-08-15',
    'active',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'JEC004',
    'Hospital HVAC Upgrade',
    'Complete HVAC system replacement for medical facility',
    '2025-03-10',
    '2025-09-30',
    'on_hold',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'JEC005',
    'Shopping Mall Renovation',
    'Full mechanical and electrical renovation',
    '2024-01-01',
    '2024-12-31',
    'completed',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the insert
SELECT 
  project_code,
  name,
  status,
  TO_CHAR(project_start, 'YYYY-MM-DD') as start_date,
  TO_CHAR(project_end, 'YYYY-MM-DD') as end_date
FROM projects
ORDER BY project_code;
