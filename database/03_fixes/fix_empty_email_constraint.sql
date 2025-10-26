-- Fix empty email constraint issue for external users
-- This script handles the case where multiple users have empty string emails

-- Step 1: Check current situation
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email = '' THEN 1 END) as empty_string_emails,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
FROM public.users;

-- Step 2: Show users with empty emails
SELECT id, email, user_type, first_name, last_name, username
FROM public.users 
WHERE email = '' OR email IS NULL
ORDER BY created_at;

-- Step 3: Update empty string emails to NULL for external users (keeping one for internal if needed)
-- First, let's update external users with empty emails to have NULL
UPDATE public.users 
SET email = NULL 
WHERE email = '' AND user_type IN ('external', 'worker');

-- Step 4: For any remaining users with empty string email, update all but the first one to NULL
-- This keeps one user with empty email if needed for internal users
WITH ranked_empty_emails AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.users 
  WHERE email = ''
)
UPDATE public.users 
SET email = NULL 
WHERE id IN (
  SELECT id FROM ranked_empty_emails WHERE rn > 1
);

-- Step 5: Verify the fix
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email = '' THEN 1 END) as empty_string_emails,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
FROM public.users;

-- Step 6: Show remaining users with empty/null emails
SELECT id, email, user_type, first_name, last_name, username
FROM public.users 
WHERE email = '' OR email IS NULL
ORDER BY created_at;

SELECT 'Empty email constraint fixed! External users can now have NULL emails without conflicts.' as status;
