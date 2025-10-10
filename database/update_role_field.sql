-- Update Supabase database to only allow 4 roles
-- This script will modify the users table role column to restrict values

-- Step 1: First, update any existing users with old roles to the new simplified roles
UPDATE public.users 
SET role = CASE 
    WHEN role IN ('project_manager', 'site_manager', 'qshe_manager', 'supervisor') THEN 'admin'
    WHEN role = 'system_admin' THEN 'system_admin'
    WHEN role = 'member' THEN 'member'
    WHEN role = 'worker' THEN 'worker'
    ELSE 'member' -- Default fallback
END
WHERE role NOT IN ('system_admin', 'admin', 'member', 'worker');

-- Step 2: Drop the existing role column constraint (if any)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add a CHECK constraint to only allow the 4 valid roles
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('system_admin', 'admin', 'member', 'worker'));

-- Step 4: Update the column comment to reflect the change
COMMENT ON COLUMN public.users.role IS 'User role: system_admin, admin, member, or worker';

-- Step 5: Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' AND tc.constraint_type = 'CHECK';

-- Step 6: Show current role distribution
SELECT role, COUNT(*) as count
FROM public.users 
GROUP BY role
ORDER BY role;

SELECT 'Database role field updated to only allow 4 roles: system_admin, admin, member, worker' as status;
