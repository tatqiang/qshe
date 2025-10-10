-- Simplified User Management Schema Migration
-- This script consolidates pre_registrations into users table with improved design

-- 1. First, add new fields to users table for invitation management
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registration_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Check if authority_level exists and rename to role (more standard)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'authority_level') THEN
        ALTER TABLE public.users RENAME COLUMN authority_level TO role;
    END IF;
    
    -- If role column doesn't exist, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR DEFAULT 'member';
    END IF;
END $$;

-- 3. Update status enum to include invitation states
DO $$ 
DECLARE
    view_definition TEXT;
BEGIN
    -- Store the view definition before dropping it
    SELECT pg_get_viewdef('user_details'::regclass) INTO view_definition;
    
    -- Drop the view temporarily
    DROP VIEW IF EXISTS user_details CASCADE;
    
    -- Drop existing type if it exists
    DROP TYPE IF EXISTS user_status CASCADE;
    
    -- Create new enum type
    CREATE TYPE user_status AS ENUM (
        'invited',              -- Admin created invitation, user hasn't started
        'pending_completion',   -- User started registration but hasn't finish 
        'active',              -- Fully registered and can use system
        'inactive',            -- User disabled
        'expired'              -- Invitation expired
    );
    
    -- Drop any existing default
    ALTER TABLE public.users ALTER COLUMN status DROP DEFAULT;
    
    -- Update the column type
    ALTER TABLE public.users ALTER COLUMN status TYPE user_status USING 
        CASE 
            WHEN status = 'pending' THEN 'pending_completion'::user_status
            WHEN status = 'active' THEN 'active'::user_status
            WHEN status = 'inactive' THEN 'inactive'::user_status
            ELSE 'active'::user_status
        END;
    
    -- Set new default after type change
    ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'active'::user_status;
    
    -- Recreate the view if it existed
    IF view_definition IS NOT NULL THEN
        EXECUTE 'CREATE VIEW user_details AS ' || view_definition;
    END IF;
    
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null; -- View might not exist
END $$;

-- 4. Migrate existing pre_registrations data to users table (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_registrations') THEN
        INSERT INTO public.users (
            id,
            email,
            user_type,
            status,
            role,
            invitation_token,
            invited_by,
            invitation_expires_at,
            created_at,
            updated_at
        )
        SELECT 
            gen_random_uuid(),  -- Generate new UUID for users table
            email,
            user_type,
            CASE 
                WHEN status = 'pending' THEN 'invited'::user_status
                WHEN status = 'registered' THEN 'active'::user_status
                WHEN status = 'expired' THEN 'expired'::user_status
                ELSE 'invited'::user_status
            END,
            'member',  -- Default role for migrated users
            invitation_token,
            CASE 
                WHEN invited_by IS NOT NULL THEN invited_by::UUID
                ELSE NULL
            END,
            expires_at,
            created_at,
            created_at  -- Use created_at for updated_at since updated_at doesn't exist in pre_registrations
        FROM public.pre_registrations
        WHERE email NOT IN (SELECT email FROM public.users);  -- Avoid duplicates
        
        -- Update migrated users who completed registration
        UPDATE public.users 
        SET 
            registration_completed_at = pr.registered_at,
            status = 'active'::user_status,
            updated_at = COALESCE(pr.registered_at, pr.created_at)
        FROM public.pre_registrations pr 
        WHERE public.users.email = pr.email 
        AND pr.status = 'registered'
        AND pr.registered_at IS NOT NULL;
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON public.users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 6. Update RLS policies if needed (optional - review existing policies)
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
-- CREATE POLICY "Users can view own profile" ON public.users
--     FOR SELECT USING (auth.uid() = id);

-- 7. Verification query
SELECT 
    'Migration Summary' as action,
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'invited' THEN 1 END) as invited_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN invitation_token IS NOT NULL THEN 1 END) as users_with_tokens
FROM public.users;

-- 8. Show sample of migrated data
SELECT 
    email,
    status,
    role,
    invitation_token IS NOT NULL as has_token,
    registration_completed_at IS NOT NULL as completed_registration
FROM public.users 
WHERE invitation_token IS NOT NULL
LIMIT 5;

-- 9. After verification, you can drop the pre_registrations table:
-- DROP TABLE IF EXISTS public.pre_registrations CASCADE;

COMMENT ON TABLE public.users IS 'Unified user management table handling invitations, registration, and user profiles';
COMMENT ON COLUMN public.users.status IS 'User lifecycle status: invited -> pending_completion -> active';
COMMENT ON COLUMN public.users.role IS 'User authority level in the system';
COMMENT ON COLUMN public.users.invitation_token IS 'Unique token for invitation links';
COMMENT ON COLUMN public.users.position_id IS 'Reference to positions table for job title and hierarchy';
