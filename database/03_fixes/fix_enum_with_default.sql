-- Fix ENUM recreation by handling default values properly
-- This addresses the default value casting error

-- Step 1: Check current default value
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

-- Step 2: Remove the default value temporarily
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- Step 3: Update all existing users to use only the 4 allowed roles
UPDATE public.users 
SET role = 
  CASE role::text
    WHEN 'project_manager' THEN 'admin'::user_role
    WHEN 'site_manager' THEN 'admin'::user_role  
    WHEN 'qshe_manager' THEN 'admin'::user_role
    WHEN 'supervisor' THEN 'admin'::user_role
    ELSE role -- Keep system_admin, admin, member, worker as-is
  END
WHERE role::text IN ('project_manager', 'site_manager', 'qshe_manager', 'supervisor');

-- Step 4: Create the new ENUM with only 4 values
CREATE TYPE user_role_simplified AS ENUM (
    'system_admin',
    'admin', 
    'member',
    'worker'
);

-- Step 5: Update the users table to use the new ENUM
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role_simplified 
USING role::text::user_role_simplified;

-- Step 6: Set a new default value using the new ENUM
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'member'::user_role_simplified;

-- Step 7: Drop the old ENUM and rename the new one
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_simplified RENAME TO user_role;

-- Step 8: Update the default to use the renamed type
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'member'::user_role;

-- Step 9: Verify the result
SELECT unnest(enum_range(NULL::user_role)) AS available_roles;

-- Step 10: Check current user roles
SELECT role, COUNT(*) as user_count
FROM public.users 
GROUP BY role
ORDER BY role;

-- Step 11: Verify default value is set correctly
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';

SELECT 'user_role ENUM successfully recreated with only 4 options and proper default value' as status;
