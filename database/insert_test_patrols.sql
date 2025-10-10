-- Insert test patrol data into the basic patrols table
-- Run this in Supabase SQL Editor to add sample data

-- First, get project IDs from the existing projects
INSERT INTO patrols (title, date, project_id, status, created_by)
SELECT 
    'Safety inspection of work area',
    CURRENT_DATE,
    p.id,
    'draft',
    NULL
FROM projects p 
WHERE p.project_code = 'AIC'
LIMIT 1;

INSERT INTO patrols (title, date, project_id, status, created_by)
SELECT 
    'Equipment safety check',
    CURRENT_DATE - INTERVAL '1 day',
    p.id,
    'completed',
    NULL
FROM projects p 
WHERE p.project_code = 'RM1'
LIMIT 1;

INSERT INTO patrols (title, date, project_id, status, created_by)
SELECT 
    'Weekly safety patrol',
    CURRENT_DATE - INTERVAL '2 days',
    p.id,
    'draft',
    NULL
FROM projects p 
WHERE p.project_code = 'MEGA'
LIMIT 1;

INSERT INTO patrols (title, date, project_id, status, created_by)
SELECT 
    'Emergency equipment check',
    CURRENT_DATE - INTERVAL '3 days',
    p.id,
    'completed',
    NULL
FROM projects p 
WHERE p.project_code = 'GG-U001'
LIMIT 1;

-- Verify the inserted data
SELECT 
    p.id,
    p.title,
    p.date,
    p.status,
    pr.project_code,
    pr.name as project_name
FROM patrols p
JOIN projects pr ON p.project_id = pr.id
ORDER BY p.created_at DESC;
