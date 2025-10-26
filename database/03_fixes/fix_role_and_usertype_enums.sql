-- Fix Role and User Type Enums in Database
-- This script updates the enums to match the new role-based system
-- Run this in Supabase Dashboard > SQL Editor

-- ==============================================
-- STEP 1: Fix user_role enum - Replace 'worker' with 'registrant'
-- ==============================================

-- Check if role column exists and add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        -- Create the enum first
        DROP TYPE IF EXISTS user_role CASCADE;
        CREATE TYPE user_role AS ENUM (
            'system_admin',
            'admin', 
            'member',
            'registrant'
        );
        
        -- Add the role column with default value
        ALTER TABLE public.users 
        ADD COLUMN role user_role DEFAULT 'member'::user_role;
        
        RAISE NOTICE 'Added role column to users table';
    ELSE
        -- Column exists, update any 'worker' roles to 'member' first
        UPDATE public.users 
        SET role = 'member' 
        WHERE role = 'worker';

        -- Drop the existing enum and recreate with correct values
        DROP TYPE IF EXISTS user_role CASCADE;
        CREATE TYPE user_role AS ENUM (
            'system_admin',
            'admin', 
            'member',
            'registrant'
        );

        -- Re-add the column with the new enum
        ALTER TABLE public.users 
        ALTER COLUMN role TYPE user_role USING role::text::user_role;

        -- Set default value
        ALTER TABLE public.users 
        ALTER COLUMN role SET DEFAULT 'member'::user_role;
        
        RAISE NOTICE 'Updated existing role column';
    END IF;
END $$;

-- ==============================================
-- STEP 2: Fix user_type_enum - Remove 'worker'
-- ==============================================

-- Check if user_type column exists and handle appropriately
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_type') THEN
        -- Create the enum first
        DROP TYPE IF EXISTS user_type_enum CASCADE;
        CREATE TYPE user_type_enum AS ENUM (
            'internal',
            'external'
        );
        
        -- Add the user_type column with default value
        ALTER TABLE public.users 
        ADD COLUMN user_type user_type_enum DEFAULT 'internal'::user_type_enum;
        
        RAISE NOTICE 'Added user_type column to users table';
    ELSE
        -- Column exists, update any 'worker' user_type to 'external' first
        UPDATE public.users 
        SET user_type = 'external' 
        WHERE user_type = 'worker';

        -- Drop the existing enum and recreate with only organizational types
        DROP TYPE IF EXISTS user_type_enum CASCADE;
        CREATE TYPE user_type_enum AS ENUM (
            'internal',   -- Company employees
            'external'    -- Contractors/vendors
        );

        -- Re-add the column with the new enum
        ALTER TABLE public.users 
        ALTER COLUMN user_type TYPE user_type_enum USING user_type::text::user_type_enum;

        -- Set default value
        ALTER TABLE public.users 
        ALTER COLUMN user_type SET DEFAULT 'internal'::user_type_enum;
        
        RAISE NOTICE 'Updated existing user_type column';
    END IF;
END $$;

-- ==============================================
-- STEP 3: Add missing fields (nationality, Thai names)
-- ==============================================

-- Add nationality field
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add Thai name fields (if not already added)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name_thai VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name_thai VARCHAR(255);

-- ==============================================
-- STEP 4: Create indexes and comments
-- ==============================================

-- Create index for nationality field
CREATE INDEX IF NOT EXISTS idx_users_nationality ON public.users(nationality);

-- Add comments for documentation
COMMENT ON COLUMN public.users.role IS 'User access level: system_admin, admin, member, registrant (no login)';
COMMENT ON COLUMN public.users.user_type IS 'Organizational category: internal (employees) or external (contractors)';
COMMENT ON COLUMN public.users.nationality IS 'User nationality for demographic tracking';
COMMENT ON COLUMN public.users.first_name_thai IS 'First name in Thai language';
COMMENT ON COLUMN public.users.last_name_thai IS 'Last name in Thai language';

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

-- Show updated table structure
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('role', 'user_type', 'nationality', 'first_name_thai', 'last_name_thai')
ORDER BY column_name;

-- Test the new enum values work
SELECT 'Testing enum values:' as test;
SELECT 'system_admin'::user_role as role_test;
SELECT 'registrant'::user_role as registrant_test;
SELECT 'internal'::user_type_enum as internal_test;
SELECT 'external'::user_type_enum as external_test;

-- ==============================================
-- STEP 6: Optional - Update specific users to registrant role
-- ==============================================

-- Example: Update users who should be registrants (no login capability)
-- Uncomment and modify as needed:
/*
UPDATE public.users 
SET role = 'registrant' 
WHERE email IN (
    'worker1@company.com',
    'worker2@company.com'
    -- Add specific worker emails here
);
*/

-- Or update based on position titles:
/*
UPDATE public.users 
SET role = 'registrant' 
WHERE position_id IN (
    SELECT id FROM positions 
    WHERE position_title LIKE '%Worker%' 
       OR position_title LIKE '%Laborer%'
       OR position_title LIKE '%Helper%'
);
*/

SELECT 'Database enums fixed successfully!' as status;
SELECT 'Note: You may want to manually update specific users to registrant role' as note;
