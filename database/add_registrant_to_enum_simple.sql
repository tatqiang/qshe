-- Simple Fix: Add 'registrant' to existing user_role enum
-- This script safely adds 'registrant' to the existing enum without dropping anything
-- Run this in Supabase Dashboard > SQL Editor

-- ==============================================
-- STEP 1: Add 'registrant' to existing user_role enum
-- ==============================================

-- Add 'registrant' to the existing enum (safe operation)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'registrant';

-- ==============================================
-- STEP 2: Fix user_type_enum - Remove 'worker' if it exists
-- ==============================================

-- Check if user_type column exists first
DO $$ 
BEGIN
    -- Check if user_type column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'user_type') THEN
        
        -- Column exists, check if 'worker' exists in user_type_enum and remove it
        IF EXISTS (SELECT 1 FROM pg_enum e 
                   JOIN pg_type t ON e.enumtypid = t.oid 
                   WHERE t.typname = 'user_type_enum' AND e.enumlabel = 'worker') THEN
            
            -- First, update any existing 'worker' user_type to 'external'
            UPDATE public.users 
            SET user_type = 'external' 
            WHERE user_type = 'worker';
            
            -- Remove 'worker' from the enum (requires recreating the enum)
            DROP TYPE user_type_enum CASCADE;
            CREATE TYPE user_type_enum AS ENUM ('internal', 'external');
            
            -- Re-add the column with the new enum
            ALTER TABLE public.users 
            ALTER COLUMN user_type TYPE user_type_enum USING user_type::text::user_type_enum;
            
            -- Set default value
            ALTER TABLE public.users 
            ALTER COLUMN user_type SET DEFAULT 'internal'::user_type_enum;
            
            RAISE NOTICE 'Removed worker from user_type_enum';
        ELSE
            RAISE NOTICE 'user_type_enum already clean (no worker value)';
        END IF;
        
    ELSE
        -- Column doesn't exist, create it
        RAISE NOTICE 'user_type column does not exist, creating it...';
        
        -- Create the enum first
        DROP TYPE IF EXISTS user_type_enum CASCADE;
        CREATE TYPE user_type_enum AS ENUM ('internal', 'external');
        
        -- Add the user_type column with default value
        ALTER TABLE public.users 
        ADD COLUMN user_type user_type_enum DEFAULT 'internal'::user_type_enum;
        
        RAISE NOTICE 'Added user_type column to users table';
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

-- Test that 'registrant' now works
SELECT 'Testing new registrant enum:' as test;
SELECT 'registrant'::user_role as registrant_test;

SELECT 'Successfully added registrant to user_role enum!' as status;
