-- Delete all existing users from the users table
-- This will clear the table completely for fresh registration testing

DELETE FROM public.users;

-- Reset the ID sequence to start from 1 again
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as user_count FROM public.users;

-- Show the table structure to confirm it's ready
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;