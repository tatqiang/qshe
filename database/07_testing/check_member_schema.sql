-- Check member_applications table structure
-- Run this to see the full schema and relationships

-- Show columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'member_applications'
ORDER BY ordinal_position;

-- Show all data with relationships
SELECT 
    ma.id,
    ma.submission_number,
    ma.project_id,
    ma.company_id,
    ma.token_id,
    ma.status,
    p.name as project_name,
    c.name as company_name,
    mat.token as token_value
FROM member_applications ma
LEFT JOIN projects p ON p.id = ma.project_id
LEFT JOIN companies c ON c.id = ma.company_id  
LEFT JOIN member_application_tokens mat ON mat.id = ma.token_id
ORDER BY ma.submitted_at DESC
LIMIT 10;
