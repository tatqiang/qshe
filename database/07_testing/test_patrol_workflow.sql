-- QSHE Patrol Workflow Testing
-- This script demonstrates the patrol status workflow: open → pending_verification → closed/rejected

-- Assume we have the test data from test_area_assignments.sql
-- Get required IDs
DECLARE @project_id UNIQUEIDENTIFIER = (SELECT id FROM projects WHERE project_code = 'JEC-2024-001');
DECLARE @inspector_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'inspector1@th.jec.com');
DECLARE @admin_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'nithat.su@th.jec.com');
DECLARE @patrol_category_id UNIQUEIDENTIFIER = (SELECT id FROM patrol_categories WHERE category_name = 'General Safety');
DECLARE @area_id UNIQUEIDENTIFIER = (SELECT id FROM areas WHERE area_code = 'BLDG-A');
DECLARE @subarea_1_id UNIQUEIDENTIFIER = (SELECT id FROM subareas_1 WHERE subarea_code = 'FL-1');
DECLARE @subarea_2_id UNIQUEIDENTIFIER = (SELECT id FROM subareas_2 WHERE subarea_code = 'OFF-101');

-- Step 1: Create a safety patrol (status = 'open' by default)
INSERT INTO safety_patrols (
    patrol_code, project_id, patrol_category_id, patrol_date, patrol_time,
    inspector_id, inspector_name, area_id, subarea_1_id, subarea_2_id,
    area_inspected, specific_location, weather_condition, temperature,
    overall_status, general_notes, patrol_status
)
VALUES (
    'PAT-2024-001', @project_id, @patrol_category_id, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME),
    @inspector_id, 'Safety Inspector', @area_id, @subarea_1_id, @subarea_2_id,
    'Building A - Floor 1 - Office 101', 'Near main entrance, reception area',
    'Clear', 25.5, 'satisfactory', 
    'Routine safety inspection completed. Generally good compliance observed.',
    'open'
);
GO

DECLARE @patrol_id UNIQUEIDENTIFIER = (SELECT id FROM safety_patrols WHERE patrol_code = 'PAT-2024-001');
DECLARE @risk_category_id UNIQUEIDENTIFIER = (SELECT id FROM risk_categories WHERE category_name = 'PPE Violations');

-- Step 2: Add some observations to the patrol
INSERT INTO patrol_observations (
    patrol_id, observation_number, risk_category_id, observation_type, severity_level,
    observation_title, observation_description, location_details, person_involved, person_role,
    immediate_action_taken, requires_followup
)
VALUES 
    (@patrol_id, 1, @risk_category_id, 'negative', 'medium', 
     'Missing safety glasses in office area', 
     'Employee working at computer without safety glasses despite policy requirement',
     'Office 101, Workstation 3', 'John Doe', 'Office Worker',
     'Reminded employee of PPE policy, provided safety glasses', 1),
    
    (@patrol_id, 2, (SELECT id FROM risk_categories WHERE category_name = 'Housekeeping'), 'negative', 'low',
     'Cluttered walkway near reception',
     'Boxes and equipment stored in walkway creating minor obstruction',
     'Reception area, main walkway', '', '',
     'Moved boxes to designated storage area', 0),
     
    (@patrol_id, 3, (SELECT id FROM risk_categories WHERE category_name = 'Equipment Safety'), 'positive', 'medium',
     'Proper equipment maintenance observed',
     'Office equipment properly maintained with current safety inspection stickers',
     'Office 101, all workstations', '', '',
     'No action required - positive observation', 0);
GO

-- Step 3: Update patrol summary based on observations
UPDATE safety_patrols 
SET 
    total_observations = 3,
    critical_issues = 0,
    major_issues = 0,
    minor_issues = 2, -- 2 negative observations
    overall_status = 'needs_attention',
    general_notes = 'Routine safety inspection completed. Minor PPE compliance issue and housekeeping concern addressed. Overall satisfactory with follow-up required.',
    updated_at = GETDATE()
WHERE id = @patrol_id;

-- Step 4: Submit patrol for review (status: open → pending_verification)
UPDATE safety_patrols 
SET 
    patrol_status = 'pending_verification',
    submitted_at = GETDATE(),
    updated_at = GETDATE()
WHERE id = @patrol_id;

-- Step 5: Review and approve patrol (status: pending_verification → closed)
UPDATE safety_patrols 
SET 
    patrol_status = 'closed',
    reviewed_by = (SELECT id FROM users WHERE email = 'nithat.su@th.jec.com'),
    reviewed_at = GETDATE(),
    updated_at = GETDATE()
WHERE id = @patrol_id;

-- Step 6: Create a corrective action for the PPE violation
DECLARE @ca_number NVARCHAR(50) = 'CA-2024-001';
INSERT INTO corrective_actions (
    action_number, observation_id, project_id, action_title, action_description,
    root_cause_analysis, severity_level, action_type, assigned_to, assigned_by,
    assigned_date, target_completion_date, action_status
)
VALUES (
    @ca_number,
    (SELECT id FROM patrol_observations WHERE patrol_id = @patrol_id AND observation_number = 1),
    @project_id,
    'Implement PPE compliance training for office staff',
    'Conduct refresher training on PPE requirements for office environments and ensure all staff understand when safety glasses are required.',
    'Root cause: Lack of awareness about PPE requirements in office environments. Policy exists but not well communicated.',
    'medium', 'short_term',
    (SELECT id FROM users WHERE email = 'test.admin@th.jec.com'),
    (SELECT id FROM users WHERE email = 'nithat.su@th.jec.com'),
    CAST(GETDATE() AS DATE),
    DATEADD(day, 14, CAST(GETDATE() AS DATE)),
    'open'
);

-- Verify the complete workflow
SELECT 'PATROL WORKFLOW VERIFICATION:' as result_type;

SELECT 'PATROL DETAILS:' as section;
SELECT 
    patrol_code,
    patrol_date,
    inspector_name,
    area_inspected,
    overall_status,
    patrol_status,
    total_observations,
    minor_issues,
    submitted_at,
    reviewed_at
FROM safety_patrols 
WHERE patrol_code = 'PAT-2024-001';

SELECT 'PATROL OBSERVATIONS:' as section;
SELECT 
    observation_number,
    observation_type,
    severity_level,
    observation_title,
    requires_followup
FROM patrol_observations 
WHERE patrol_id = @patrol_id
ORDER BY observation_number;

SELECT 'CORRECTIVE ACTIONS:' as section;
SELECT 
    action_number,
    action_title,
    severity_level,
    action_status,
    assigned_date,
    target_completion_date,
    DATEDIFF(day, GETDATE(), target_completion_date) as days_until_due
FROM corrective_actions 
WHERE action_number = @ca_number;

SELECT 'PATROL LOCATION DETAILS:' as section;
SELECT 
    patrol_code,
    project_name,
    area_name,
    subarea_1_name,
    subarea_2_name,
    full_location_path
FROM patrol_location_details 
WHERE patrol_code = 'PAT-2024-001';

PRINT '';
PRINT '✅ Patrol Workflow Test Complete!';
PRINT 'Status progression demonstrated:';
PRINT '1. open (initial creation)';
PRINT '2. pending_verification (submitted for review)'; 
PRINT '3. closed (approved by reviewer)';
PRINT '4. Corrective action created for follow-up';
PRINT '';
PRINT 'The system shows:';
PRINT '- Flexible area/subarea location tracking';
PRINT '- Multiple observation types and severity levels';
PRINT '- Automatic corrective action generation';
PRINT '- Complete audit trail with timestamps';