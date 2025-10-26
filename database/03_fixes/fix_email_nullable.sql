-- Fix email column to allow NULL values for external users
-- This removes the NOT NULL constraint on the email column

-- Step 1: Check current constraint
SELECT 
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'email';

-- Step 2: Remove the NOT NULL constraint from email column
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Step 3: Verify the change
SELECT 
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'email';

-- Step 4: Update existing empty string emails to NULL
UPDATE public.users 
SET email = NULL 
WHERE email = '';

-- Step 5: Add a check constraint to ensure internal users always have email
-- but allow external/worker users to have NULL email
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_email_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_email_check 
CHECK (
  (user_type = 'internal' AND email IS NOT NULL AND email != '') OR 
  (user_type IN ('external', 'worker'))
);

-- Step 6: Verify final state
SELECT 
  'Email column can now be NULL for external users but required for internal users' as status;

-- Show current users and their email status
SELECT 
  user_type,
  COUNT(*) as total,
  COUNT(email) as with_email,
  COUNT(*) - COUNT(email) as null_email
FROM public.users 
GROUP BY user_type;
