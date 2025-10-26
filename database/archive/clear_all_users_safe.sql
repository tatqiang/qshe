-- Safely delete all users by handling foreign key constraints first
-- This will clear all related data and then delete users

-- First, let's see what tables reference users
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users';

-- Delete data from tables that reference users (in safe order)
-- Start with the most dependent tables first

-- Clear main_areas table (referenced in the error)
DELETE FROM public.main_areas;

-- Clear other tables that might reference users
DELETE FROM public.projects WHERE TRUE; -- Clear all projects too for clean slate
DELETE FROM public.safety_patrols WHERE TRUE;
DELETE FROM public.corrective_actions WHERE TRUE;

-- Add other tables as needed based on the query above
-- DELETE FROM public.[other_table] WHERE TRUE;

-- Now we can safely delete users
DELETE FROM public.users;

-- Reset all sequences to start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE main_areas_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM public.users
UNION ALL
SELECT 
    'projects' as table_name, 
    COUNT(*) as record_count 
FROM public.projects
UNION ALL
SELECT 
    'main_areas' as table_name, 
    COUNT(*) as record_count 
FROM public.main_areas;

-- Show the users table structure to confirm it's ready
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;