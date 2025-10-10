-- Ultra Simple Fix: Just update the enum values
-- Based on actual schema provided by user
-- Run this in Supabase Dashboard > SQL Editor
-- NOTE: Run each section separately to avoid transaction issues

-- ==============================================
-- STEP 1: Add 'registrant' to user_role enum
-- ==============================================

-- Add 'registrant' to the existing enum (safe operation)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'registrant';

-- STOP HERE: Run this first, then run the rest separately
-- This is required because new enum values must be committed before use

/*
-- ==============================================
-- STEP 2: Update existing 'worker' role users to 'registrant'
-- (Run this AFTER Step 1 is committed)
-- ==============================================

-- Update any users with role = 'worker' to 'registrant' 
UPDATE public.users 
SET role = 'registrant' 
WHERE role = 'worker';

-- ==============================================
-- STEP 3: Update existing 'worker' user_type to 'external'
-- ==============================================

-- Update any users with user_type = 'worker' to 'external'
UPDATE public.users 
SET user_type = 'external' 
WHERE user_type = 'worker';

-- ==============================================
-- STEP 4: Remove old constraints and add new ones
-- ==============================================

-- Drop the old role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new role check constraint without 'worker'
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY[
    'system_admin'::text,
    'admin'::text, 
    'member'::text,
    'registrant'::text  -- Changed from 'worker' to 'registrant'
]));

-- Drop the old email check constraint 
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_check;

-- Add new email check constraint without 'worker' in user_type
ALTER TABLE public.users ADD CONSTRAINT users_email_check 
CHECK (
    (
        (user_type = 'internal'::user_type_enum)
        AND (email IS NOT NULL)
        AND ((email)::text <> ''::text)
    )
    OR (
        user_type = 'external'::user_type_enum  -- Removed 'worker' from here
    )
);

-- ==============================================
-- STEP 5: Verify the changes
-- ==============================================

-- Show the updated enums
SELECT 
    t.typname,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('user_role', 'user_type_enum')
GROUP BY t.typname
ORDER BY t.typname;

-- Test that 'registrant' now works
SELECT 'Testing new registrant enum:' as test;
SELECT 'registrant'::user_role as registrant_test;

-- Show current user data
SELECT 
    role,
    user_type,
    COUNT(*) as count
FROM public.users 
GROUP BY role, user_type
ORDER BY role, user_type;

SELECT 'Successfully updated enums and constraints!' as status;
*/
