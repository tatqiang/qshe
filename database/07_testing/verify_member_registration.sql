-- ============================================
-- Verify Member Registration & Auto-Company Link
-- ============================================
-- Run these queries to verify everything worked correctly

-- 1. Check the member_applications record
SELECT 
  id,
  submission_number,
  form_data->>'first_name' AS first_name,
  form_data->>'last_name' AS last_name,
  form_data->>'phone' AS phone,
  company_id AS primary_company_id,
  project_id,
  status,
  submitted_at
FROM member_applications
WHERE submission_number = 'MA-2025-001'
ORDER BY submitted_at DESC
LIMIT 1;

-- 2. Check if member_companies record was auto-created by trigger
SELECT 
  mc.id,
  mc.member_application_id,
  mc.company_id,
  c.name AS company_name,
  c.name_th AS company_name_th,
  mc.status,
  mc.start_date,
  mc.notes,
  mc.created_at
FROM member_companies mc
JOIN companies c ON mc.company_id = c.id
WHERE mc.member_application_id IN (
  SELECT id FROM member_applications WHERE submission_number = 'MA-2025-001'
);

-- 3. Check the helper view (all companies for this member)
SELECT 
  member_id,
  submission_number,
  first_name,
  last_name,
  primary_company_name,
  primary_company_name_th,
  all_companies,
  active_company_count,
  member_status
FROM member_all_companies
WHERE submission_number = 'MA-2025-001';

-- 4. Verify token usage was incremented
SELECT 
  token,
  current_uses,
  max_uses,
  is_active,
  expires_at
FROM member_application_tokens
WHERE id IN (
  SELECT token_id FROM member_applications WHERE submission_number = 'MA-2025-001'
);

-- Expected Results:
-- 1. member_applications: Should show the new member with company_id
-- 2. member_companies: Should have 1 record (auto-created by trigger)
-- 3. member_all_companies: Should show member with primary company
-- 4. token: current_uses should be 1
