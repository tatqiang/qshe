-- Quick QSHE Schema Verification
-- Copy and paste these queries into Azure Data Studio or your SQL client

-- 1. Check that all main tables exist
SELECT 'Tables Created' as check_type, COUNT(*) as count_found
FROM sys.tables 
WHERE name IN (
    'users', 'projects', 'areas', 'subareas_1', 'subareas_2',
    'project_areas', 'project_subareas_1', 'project_subareas_2',
    'safety_patrols', 'patrol_observations', 'corrective_actions', 
    'attachments', 'risk_categories', 'patrol_categories', 'system_settings'
);

-- 2. Check that all views exist
SELECT 'Views Created' as check_type, COUNT(*) as count_found
FROM sys.views 
WHERE name IN ('active_projects', 'project_areas_hierarchy', 'patrol_location_details', 'pending_patrols', 'overdue_corrective_actions', 'user_summary');

-- 3. Check sample data in areas
SELECT 'Sample Areas' as check_type, COUNT(*) as count_found FROM areas;
SELECT 'Sample Subareas_1' as check_type, COUNT(*) as count_found FROM subareas_1;
SELECT 'Sample Subareas_2' as check_type, COUNT(*) as count_found FROM subareas_2;
SELECT 'Patrol Categories' as check_type, COUNT(*) as count_found FROM patrol_categories;
SELECT 'Risk Categories' as check_type, COUNT(*) as count_found FROM risk_categories;
SELECT 'System Settings' as check_type, COUNT(*) as count_found FROM system_settings;

-- 4. Show actual sample data
SELECT 'AREAS:' as data_type, area_code, area_name, area_type FROM areas;
SELECT 'SUBAREAS_1:' as data_type, subarea_code, subarea_name, subarea_type FROM subareas_1;
SELECT 'SUBAREAS_2:' as data_type, subarea_code, subarea_name, subarea_type FROM subareas_2;

-- 5. Expected results if deployment was successful:
-- Tables Created: 14
-- Views Created: 6  
-- Sample Areas: 4
-- Sample Subareas_1: 5
-- Sample Subareas_2: 5
-- Patrol Categories: 10
-- Risk Categories: 10
-- System Settings: 8