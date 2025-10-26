-- QSHE Area Assignment Testing
-- This script demonstrates how to create projects and assign areas/subareas

-- First, let's create a test system admin user (nithat.su@th.jec.com will auto-register with this role)
INSERT INTO users (azure_ad_id, email, first_name, last_name, display_name, role, job_title, department, employee_id)
VALUES 
    ('azure-ad-nithat-001', 'nithat.su@th.jec.com', 'Nithat', 'Su', 'Nithat Su', 'system_admin', 'QSHE Manager', 'Quality Safety Health Environment', 'EMP001'),
    ('azure-ad-test-002', 'test.admin@th.jec.com', 'Test', 'Admin', 'Test Admin', 'admin', 'Safety Officer', 'QSHE', 'EMP002'),
    ('azure-ad-inspector-003', 'inspector1@th.jec.com', 'Safety', 'Inspector', 'Safety Inspector', 'member', 'Safety Inspector', 'QSHE', 'EMP003');
GO

-- Create a sample project
INSERT INTO projects (project_code, project_name, project_description, client_name, site_location, start_date, end_date, project_status, safety_requirements, risk_level, created_by, project_manager_id)
VALUES 
    ('JEC-2024-001', 'Bangkok Office Tower Construction', 'Construction of 30-story office tower in Bangkok CBD', 'Bangkok Development Corp', 'Bangkok, Thailand - Silom District', '2024-01-01', '2026-12-31', 'active', 'Full PPE required, confined space protocols, height safety measures', 'high', (SELECT id FROM users WHERE email = 'nithat.su@th.jec.com'), (SELECT id FROM users WHERE email = 'test.admin@th.jec.com'));
GO

-- Get the project ID for our assignments
DECLARE @project_id UNIQUEIDENTIFIER = (SELECT id FROM projects WHERE project_code = 'JEC-2024-001');
DECLARE @admin_user_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'nithat.su@th.jec.com');

-- Assign areas to the project (many-to-many relationship)
INSERT INTO project_areas (project_id, area_id, assigned_by, assignment_notes)
VALUES 
    (@project_id, (SELECT id FROM areas WHERE area_code = 'BLDG-A'), @admin_user_id, 'Main office area for project management'),
    (@project_id, (SELECT id FROM areas WHERE area_code = 'BLDG-B'), @admin_user_id, 'Manufacturing area for prefab components'),
    (@project_id, (SELECT id FROM areas WHERE area_code = 'YARD-1'), @admin_user_id, 'Material storage and equipment staging');

-- Assign specific subareas_1 to the project
INSERT INTO project_subareas_1 (project_id, subarea_1_id, assigned_by, assignment_notes)
VALUES 
    (@project_id, (SELECT id FROM subareas_1 WHERE subarea_code = 'FL-1'), @admin_user_id, 'Ground floor project offices'),
    (@project_id, (SELECT id FROM subareas_1 WHERE subarea_code = 'FL-2'), @admin_user_id, 'Client meeting rooms'),
    (@project_id, (SELECT id FROM subareas_1 WHERE subarea_code = 'PROD-A'), @admin_user_id, 'Prefab production area'),
    (@project_id, (SELECT id FROM subareas_1 WHERE subarea_code = 'QC-AREA'), @admin_user_id, 'Quality control for materials');

-- Assign specific subareas_2 to the project  
INSERT INTO project_subareas_2 (project_id, subarea_2_id, assigned_by, assignment_notes)
VALUES 
    (@project_id, (SELECT id FROM subareas_2 WHERE subarea_code = 'RECV-1'), @admin_user_id, 'Client reception area'),
    (@project_id, (SELECT id FROM subareas_2 WHERE subarea_code = 'OFF-101'), @admin_user_id, 'Project manager office'),
    (@project_id, (SELECT id FROM subareas_2 WHERE subarea_code = 'LINE-1'), @admin_user_id, 'Component assembly line'),
    (@project_id, (SELECT id FROM subareas_2 WHERE subarea_code = 'STORE-1'), @admin_user_id, 'Raw material storage');
GO

-- Verify the assignments by querying the project areas hierarchy view
SELECT 'PROJECT AREA ASSIGNMENTS:' as result_type;
SELECT 
    project_code,
    project_name,
    area_code,
    area_name,
    subarea_1_code,
    subarea_1_name,
    subarea_2_code,
    subarea_2_name
FROM project_areas_hierarchy 
WHERE project_code = 'JEC-2024-001'
ORDER BY area_code, subarea_1_code, subarea_2_code;

-- Show direct assignments
SELECT 'DIRECT AREA ASSIGNMENTS:' as result_type;
SELECT 
    p.project_code,
    a.area_code,
    a.area_name,
    pa.assignment_notes,
    pa.assigned_date,
    u.display_name as assigned_by_user
FROM project_areas pa
JOIN projects p ON pa.project_id = p.id
JOIN areas a ON pa.area_id = a.id  
JOIN users u ON pa.assigned_by = u.id
WHERE p.project_code = 'JEC-2024-001';

SELECT 'SUBAREA_1 ASSIGNMENTS:' as result_type;
SELECT 
    p.project_code,
    s1.subarea_code,
    s1.subarea_name,
    ps1.assignment_notes,
    ps1.assigned_date,
    u.display_name as assigned_by_user
FROM project_subareas_1 ps1
JOIN projects p ON ps1.project_id = p.id
JOIN subareas_1 s1 ON ps1.subarea_1_id = s1.id
JOIN users u ON ps1.assigned_by = u.id
WHERE p.project_code = 'JEC-2024-001';

SELECT 'SUBAREA_2 ASSIGNMENTS:' as result_type;
SELECT 
    p.project_code,
    s2.subarea_code,
    s2.subarea_name,
    ps2.assignment_notes,
    ps2.assigned_date,
    u.display_name as assigned_by_user
FROM project_subareas_2 ps2
JOIN projects p ON ps2.project_id = p.id
JOIN subareas_2 s2 ON ps2.subarea_2_id = s2.id
JOIN users u ON ps2.assigned_by = u.id
WHERE p.project_code = 'JEC-2024-001';

PRINT '';
PRINT '✅ Area Assignment Test Complete!';
PRINT 'This demonstrates the flexible many-to-many area assignment system:';
PRINT '- Projects can be assigned to multiple areas, subareas_1, and subareas_2';
PRINT '- Each assignment includes who assigned it, when, and optional notes';
PRINT '- The project_areas_hierarchy view shows the complete structure';
PRINT '- Safety patrols can reference any level: area_id, subarea_1_id, or subarea_2_id';