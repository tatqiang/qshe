-- QSHE Schema Verification Queries
-- Run these after deploying simplified_qshe_schema.sql

-- =============================================
-- 1. CHECK ALL TABLES CREATED
-- =============================================
PRINT 'Checking tables created...';
SELECT 
    name as table_name,
    create_date,
    object_id
FROM sys.tables 
WHERE name IN (
    'users', 'projects', 'areas', 'subareas_1', 'subareas_2',
    'project_areas', 'project_subareas_1', 'project_subareas_2',
    'safety_patrols', 'patrol_observations', 'corrective_actions', 
    'attachments', 'risk_categories', 'system_settings'
)
ORDER BY name;

-- =============================================
-- 2. CHECK VIEWS CREATED
-- =============================================
PRINT 'Checking views created...';
SELECT 
    name as view_name,
    create_date
FROM sys.views 
WHERE name IN ('active_projects', 'project_areas_hierarchy', 'patrol_location_details', 'pending_patrols', 'overdue_corrective_actions', 'user_summary')
ORDER BY name;

-- =============================================
-- 3. VERIFY TEST DATA
-- =============================================
PRINT 'Checking test users...';
SELECT 
    email,
    role,
    display_name,
    department,
    is_active,
    created_at
FROM users 
ORDER BY role, email;

-- =============================================
-- 4. CHECK ROLE VALUES
-- =============================================
PRINT 'Checking available roles...';
SELECT DISTINCT role, COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY 
    CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'qshe_manager' THEN 2
        WHEN 'safety_officer' THEN 3
        WHEN 'project_manager' THEN 4
        WHEN 'supervisor' THEN 5
        WHEN 'inspector' THEN 6
        WHEN 'employee' THEN 7
        ELSE 999
    END;

-- =============================================
-- 5. CHECK SYSTEM SETTINGS
-- =============================================
PRINT 'Checking system settings...';
SELECT 
    setting_key,
    setting_value,
    setting_description,
    setting_type,
    is_public
FROM system_settings
ORDER BY setting_key;

-- =============================================
-- 5A. CHECK AREA HIERARCHY SAMPLE DATA
-- =============================================
PRINT 'Checking area hierarchy sample data...';
SELECT 'Areas' as table_type, area_code as code, area_name as name, area_type as type FROM areas
UNION ALL
SELECT 'Subareas_1' as table_type, subarea_code as code, subarea_name as name, subarea_type as type FROM subareas_1
UNION ALL
SELECT 'Subareas_2' as table_type, subarea_code as code, subarea_name as name, subarea_type as type FROM subareas_2
ORDER BY table_type, code;

-- =============================================
-- 6. VERIFY INDEXES CREATED
-- =============================================
PRINT 'Checking performance indexes...';
SELECT 
    t.name as table_name,
    i.name as index_name,
    i.type_desc as index_type
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN (
    'users', 'projects', 'areas', 'subareas_1', 'subareas_2',
    'project_areas', 'project_subareas_1', 'project_subareas_2',
    'safety_patrols', 'corrective_actions', 'patrol_observations', 'attachments'
)
AND i.name IS NOT NULL
ORDER BY t.name, i.name;

-- =============================================
-- 7. CHECK FOREIGN KEY CONSTRAINTS
-- =============================================
PRINT 'Checking foreign key relationships...';
SELECT 
    fk.name as constraint_name,
    tp.name as parent_table,
    cp.name as parent_column,
    tr.name as referenced_table,
    cr.name as referenced_column
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
ORDER BY tp.name, fk.name;

-- =============================================
-- 8. SAMPLE PERMISSION TEST
-- =============================================
PRINT 'Testing role hierarchy...';
SELECT 
    email,
    role,
    CASE role
        WHEN 'system_admin' THEN 'Full system access and user management'
        WHEN 'admin' THEN 'QSHE management and role assignment permissions'
        WHEN 'member' THEN 'Can create patrols, observations, and corrective actions'
        WHEN 'registrant' THEN 'Basic access, view only (new users)'
        ELSE 'Unknown permissions'
    END as permissions_summary
FROM users
WHERE is_active = 1
ORDER BY 
    CASE role
        WHEN 'system_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
        WHEN 'registrant' THEN 4
        ELSE 999
    END;

PRINT '';
PRINT '=============================================';
PRINT '✅ QSHE Schema Verification Complete!';
PRINT '=============================================';
PRINT '';
PRINT 'If all queries above returned data successfully,';
PRINT 'your simplified QSHE system is ready to use!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Test Azure AD login with nithat.su@th.jec.com';
PRINT '2. Verify auto-registration creates user with system_admin role';
PRINT '3. Test role-based permissions: system_admin > admin > member > registrant';
PRINT '4. Create projects and assign areas using junction tables';
PRINT '5. Test safety patrols with area/subarea hierarchy';
PRINT '6. New users auto-register as registrant, promote to member/admin as needed';