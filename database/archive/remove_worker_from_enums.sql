-- Remove 'worker' from both enums
-- Run this in Supabase Dashboard > SQL Editor
-- This will clean up the enum values to only have the correct ones

-- ==============================================
-- STEP 0: Drop unused pre_registrations table
-- ==============================================

-- Drop the pre_registrations table since it's not used anymore
-- This removes the dependency on user_type_enum
DROP TABLE IF EXISTS public.pre_registrations CASCADE;

-- ==============================================
-- STEP 1: Update any remaining 'worker' data first
-- ==============================================

-- Update any users with role = 'worker' to 'registrant' 
UPDATE public.users 
SET role = 'registrant' 
WHERE role = 'worker';

-- Update any users with user_type = 'worker' to 'external'
UPDATE public.users 
SET user_type = 'external' 
WHERE user_type = 'worker';

-- ==============================================
-- STEP 2: Recreate user_role enum without 'worker'
-- ==============================================

-- First, drop constraints that reference the enum
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Remove the default value temporarily
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- Recreate the enum without 'worker'
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
    'system_admin',
    'admin', 
    'member',
    'registrant'
);

-- Update the column to use the new enum
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Drop the old enum
DROP TYPE user_role_old;

-- Set the new default value
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'member'::user_role;

-- Add back the constraint
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY[
    'system_admin'::text,
    'admin'::text, 
    'member'::text,
    'registrant'::text
]));

-- ==============================================
-- STEP 3: Recreate user_type_enum without 'worker'
-- ==============================================

-- First, drop constraints that reference the enum
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_check;

-- Remove the default value temporarily
ALTER TABLE public.users ALTER COLUMN user_type DROP DEFAULT;

-- Recreate the enum without 'worker'
ALTER TYPE user_type_enum RENAME TO user_type_enum_old;

CREATE TYPE user_type_enum AS ENUM (
    'internal',
    'external'
);

-- Update the column to use the new enum
ALTER TABLE public.users 
ALTER COLUMN user_type TYPE user_type_enum USING user_type::text::user_type_enum;

-- Drop the old enum
DROP TYPE user_type_enum_old;

-- Set the new default value
ALTER TABLE public.users ALTER COLUMN user_type SET DEFAULT 'internal'::user_type_enum;

-- Add back the email constraint without 'worker'
ALTER TABLE public.users ADD CONSTRAINT users_email_check 
CHECK (
    (
        (user_type = 'internal'::user_type_enum)
        AND (email IS NOT NULL)
        AND ((email)::text <> ''::text)
    )
    OR (
        user_type = 'external'::user_type_enum
    )
);

-- ==============================================
-- STEP 4: Verify the cleanup
-- ==============================================

-- Show the cleaned enums (should not have 'worker' anymore)
SELECT 
    t.typname,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('user_role', 'user_type_enum')
GROUP BY t.typname
ORDER BY t.typname;

-- Test that the enums work correctly
SELECT 'Testing cleaned enums:' as test;
SELECT 'registrant'::user_role as registrant_test;
SELECT 'internal'::user_type_enum as internal_test;
SELECT 'external'::user_type_enum as external_test;

-- Show current user data
SELECT 
    role,
    user_type,
    COUNT(*) as count
FROM public.users 
GROUP BY role, user_type
ORDER BY role, user_type;

SELECT 'Successfully removed worker from both enums!' as status;
