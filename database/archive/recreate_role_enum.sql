-- Recreate user_role ENUM with only 4 options
-- This will replace the current ENUM entirely

-- Step 1: First, update all existing users to use only the 4 allowed roles
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

-- Step 2: Create the new ENUM with only 4 values
CREATE TYPE user_role_simplified AS ENUM (
    'system_admin',
    'admin', 
    'member',
    'worker'
);

-- Step 3: Update the users table to use the new ENUM
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role_simplified 
USING role::text::user_role_simplified;

-- Step 4: Drop the old ENUM and rename the new one
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_simplified RENAME TO user_role;

-- Step 5: Recreate any dependent objects (if needed)
-- Note: This might affect other tables/functions that use user_role

-- Step 6: Verify the result
SELECT unnest(enum_range(NULL::user_role)) AS available_roles;

-- Step 7: Check current user roles
SELECT role, COUNT(*) as user_count
FROM public.users 
GROUP BY role
ORDER BY role;

SELECT 'user_role ENUM successfully limited to 4 options only' as status;
