-- Fix Supabase role ENUM to only allow 4 roles
-- Simplified approach that works with existing ENUM constraints

-- Step 1: Check current ENUM values
SELECT unnest(enum_range(NULL::user_role)) AS current_roles;

-- Step 2: Update existing users with old roles to new simplified roles
-- Cast to text first, then cast back to the ENUM type
UPDATE public.users 
SET role = 
  CASE role::text
    WHEN 'project_manager' THEN 'admin'::user_role
    WHEN 'site_manager' THEN 'admin'::user_role  
    WHEN 'qshe_manager' THEN 'admin'::user_role
    WHEN 'supervisor' THEN 'admin'::user_role
    ELSE role -- Keep existing valid roles as-is
  END
WHERE role::text IN ('project_manager', 'site_manager', 'qshe_manager', 'supervisor');

-- Step 3: Show updated role distribution
SELECT role, COUNT(*) as count
FROM public.users 
GROUP BY role
ORDER BY role;

-- Step 4: Add CHECK constraint as additional validation layer
-- This prevents future inserts of old role values even if they exist in the ENUM
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_simplified_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_simplified_check 
CHECK (role::text IN ('system_admin', 'admin', 'member', 'worker'));

-- Step 5: Update column comment
COMMENT ON COLUMN public.users.role IS 'User role: system_admin, admin, member, or worker (simplified from 8 to 4 roles)';

-- Step 6: Verify constraint was added
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_role_simplified_check';

SELECT 'Role field updated - only 4 roles now allowed via CHECK constraint' as status;
