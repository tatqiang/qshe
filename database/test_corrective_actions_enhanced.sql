-- Test Script for Enhanced Corrective Actions with Approval Workflow
-- Run this script in Supabase SQL Editor after running the main schema

-- =============================================================================
-- 1. SETUP TEST DATA
-- =============================================================================

-- Insert test corrective action
INSERT INTO corrective_actions (
    id,
    patrol_id,
    action_number,
    description,
    action_type,
    root_cause_analysis,
    assigned_to,
    due_date,
    status,
    estimated_cost,
    resources_required,
    created_by
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM safety_patrols LIMIT 1), -- Use existing patrol
    'CA-2025001',
    'Repair damaged safety barrier and install warning signs',
    'immediate',
    'Safety barrier damaged due to vehicle impact. Root cause: inadequate speed control measures.',
    '00000000-0000-0000-0001-000000000001', -- Test user
    CURRENT_DATE + INTERVAL '7 days',
    'draft',
    1500.00,
    ARRAY['Safety barriers', 'Warning signs', 'Installation tools'],
    '00000000-0000-0000-0001-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. TEST APPROVAL WORKFLOW SUBMISSION
-- =============================================================================

-- Submit the corrective action for approval
SELECT submit_corrective_action_for_approval(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0001-000000000001'
);

-- Verify approval workflow was created
SELECT 
    'Approval Workflow Created' as test_name,
    COUNT(*) as approval_records_created
FROM corrective_action_approvals 
WHERE action_id = '11111111-1111-1111-1111-111111111111';

-- Check workflow status
SELECT 
    'Workflow Status' as test_name,
    current_status,
    current_stage,
    next_required_action
FROM corrective_action_workflow 
WHERE action_id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- 3. TEST APPROVAL PROCESS
-- =============================================================================

-- Test supervisor approval
SELECT process_corrective_action_approval(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0001-000000000002', -- Supervisor user
    'supervisor',
    'approved',
    'Approved for immediate implementation',
    'Must be completed within 48 hours',
    NULL
);

-- Verify approval was processed
SELECT 
    'Supervisor Approval' as test_name,
    approval_status,
    approval_notes,
    conditions
FROM corrective_action_approvals 
WHERE action_id = '11111111-1111-1111-1111-111111111111'
AND approval_level = 'supervisor';

-- Check updated workflow status
SELECT 
    'Updated Workflow' as test_name,
    current_status,
    current_stage,
    approval_completed_date IS NOT NULL as is_approved
FROM corrective_action_workflow 
WHERE action_id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- 4. TEST PHOTO UPLOAD
-- =============================================================================

-- Insert test photos for different phases
INSERT INTO corrective_action_photos (
    id,
    action_id,
    r2_bucket,
    r2_key,
    r2_url,
    filename,
    original_filename,
    file_size,
    mime_type,
    photo_type,
    phase,
    caption,
    sequence_order,
    taken_by
) VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'qshe-corrective-actions',
    'actions/11111111-1111-1111-1111-111111111111/planning/planning_001.jpg',
    'https://qshe-corrective-actions.r2.dev/actions/11111111-1111-1111-1111-111111111111/planning/planning_001.jpg',
    'planning_001.jpg',
    'damaged_barrier_plan.jpg',
    245760,
    'image/jpeg',
    'planning',
    'planning',
    'Planning photo showing damaged safety barrier location',
    1,
    '00000000-0000-0000-0001-000000000001'
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'qshe-corrective-actions',
    'actions/11111111-1111-1111-1111-111111111111/before/before_001.jpg',
    'https://qshe-corrective-actions.r2.dev/actions/11111111-1111-1111-1111-111111111111/before/before_001.jpg',
    'before_001.jpg',
    'before_repair.jpg',
    189430,
    'image/jpeg',
    'before',
    'implementation',
    'Before photo showing damaged barrier before repair',
    1,
    '00000000-0000-0000-0001-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Verify photos were inserted
SELECT 
    'Photos Uploaded' as test_name,
    COUNT(*) as photo_count,
    STRING_AGG(photo_type::text, ', ') as photo_types
FROM corrective_action_photos 
WHERE action_id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- 5. TEST WORKFLOW PROGRESSION
-- =============================================================================

-- Update action status to in_progress
UPDATE corrective_actions 
SET status = 'in_progress',
    updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Update workflow status
UPDATE corrective_action_workflow 
SET current_status = 'in_progress',
    current_stage = 'Implementation in Progress',
    next_required_action = 'Complete corrective action work',
    work_started_date = NOW(),
    updated_at = NOW()
WHERE action_id = '11111111-1111-1111-1111-111111111111';

-- =============================================================================
-- 6. TEST NOTIFICATION SYSTEM
-- =============================================================================

-- Insert test notifications
INSERT INTO corrective_action_notifications (
    id,
    action_id,
    notification_type,
    recipient_id,
    recipient_role,
    title,
    message,
    priority,
    scheduled_for
) VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'work_assignment',
    '00000000-0000-0000-0001-000000000001',
    'assigned_user',
    'Corrective Action Assigned',
    'You have been assigned corrective action CA-2025001. Please review and begin work.',
    'high',
    NOW()
),
(
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'due_date_reminder',
    '00000000-0000-0000-0001-000000000001',
    'assigned_user',
    'Action Due Date Approaching',
    'Corrective action CA-2025001 is due in 3 days. Please update progress.',
    'normal',
    NOW() + INTERVAL '4 days'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. COMPREHENSIVE TEST QUERIES
-- =============================================================================

-- Test complete corrective action details query
SELECT 
    'Complete Action Details' as test_name,
    ca.action_number,
    ca.description,
    ca.status,
    ca.estimated_cost,
    caw.current_status as workflow_status,
    caw.current_stage,
    COUNT(DISTINCT caa.id) as approval_count,
    COUNT(DISTINCT cap.id) as photo_count,
    COUNT(DISTINCT can.id) as notification_count
FROM corrective_actions ca
LEFT JOIN corrective_action_workflow caw ON ca.id = caw.action_id
LEFT JOIN corrective_action_approvals caa ON ca.id = caa.action_id
LEFT JOIN corrective_action_photos cap ON ca.id = cap.action_id
LEFT JOIN corrective_action_notifications can ON ca.id = can.action_id
WHERE ca.id = '11111111-1111-1111-1111-111111111111'
GROUP BY ca.id, ca.action_number, ca.description, ca.status, ca.estimated_cost, 
         caw.current_status, caw.current_stage;

-- Test approval workflow query
SELECT 
    'Approval Workflow Details' as test_name,
    approval_level,
    approval_status,
    sequence_order,
    approval_date,
    approval_notes
FROM corrective_action_approvals 
WHERE action_id = '11111111-1111-1111-1111-111111111111'
ORDER BY sequence_order;

-- Test photos by type query
SELECT 
    'Photos by Type' as test_name,
    photo_type,
    COUNT(*) as count,
    STRING_AGG(caption, '; ') as captions
FROM corrective_action_photos 
WHERE action_id = '11111111-1111-1111-1111-111111111111'
GROUP BY photo_type;

-- Test notification query
SELECT 
    'Notifications' as test_name,
    notification_type,
    title,
    priority,
    scheduled_for
FROM corrective_action_notifications 
WHERE action_id = '11111111-1111-1111-1111-111111111111'
ORDER BY scheduled_for;

-- =============================================================================
-- 8. PERFORMANCE TESTS
-- =============================================================================

-- Test index usage for common queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT ca.*, caw.current_status 
FROM corrective_actions ca
JOIN corrective_action_workflow caw ON ca.id = caw.action_id
WHERE ca.status = 'in_progress';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM corrective_action_approvals 
WHERE approval_status = 'pending'
ORDER BY sequence_order;

-- =============================================================================
-- 9. SUMMARY REPORT
-- =============================================================================

SELECT 
    'TEST SUMMARY' as report_section,
    (SELECT COUNT(*) FROM corrective_actions) as total_actions,
    (SELECT COUNT(*) FROM corrective_action_workflow) as workflow_records,
    (SELECT COUNT(*) FROM corrective_action_approvals) as approval_records,
    (SELECT COUNT(*) FROM corrective_action_photos) as photo_records,
    (SELECT COUNT(*) FROM corrective_action_notifications) as notification_records;

SELECT 'Enhanced Corrective Actions Test Completed Successfully!' as status;
