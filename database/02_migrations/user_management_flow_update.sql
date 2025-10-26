-- User Management Flow Update
-- This script implements the new user management flow where:
-- 1. Admin fills all user data directly (no pre-registration table)
-- 2. Users get a link/QR code to complete their profile (password, face recognition)
-- 3. Username field is added and must be unique

-- 1. Add username field to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;

-- 2. Update users table structure for new flow
-- Add invitation-related fields if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- 3. Update user status enum to support new flow
-- First, check if we're using enum type or constraint
DO $$ 
DECLARE
    enum_exists BOOLEAN;
    user_status_enum_exists BOOLEAN;
BEGIN
    -- Check if user_status type exists (newer schema)
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_status'
    ) INTO enum_exists;
    
    -- Check if user_status_enum type exists (older schema)
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_status_enum'
    ) INTO user_status_enum_exists;
    
    IF enum_exists THEN
        -- We're using user_status enum type
        -- 'invited' will be the initial state after admin creates user
        -- 'active' will be the state after user completes profile
        
        -- Check if 'invited' value exists in enum, if not add it
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = 'user_status'::regtype 
            AND enumlabel = 'invited'
        ) THEN
            ALTER TYPE user_status ADD VALUE 'invited';
        END IF;
        
        -- Set default status for new admin-created users
        ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'invited'::user_status;
        
    ELSIF user_status_enum_exists THEN
        -- We're using user_status_enum type (older schema)
        -- Check if 'invited' or 'pending' value exists in enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = 'user_status_enum'::regtype 
            AND enumlabel = 'invited'
        ) THEN
            IF EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumtypid = 'user_status_enum'::regtype 
                AND enumlabel = 'pending'
            ) THEN
                -- Use 'pending' if it exists
                ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'pending'::user_status_enum;
            ELSE
                -- Add 'invited' if neither exists
                ALTER TYPE user_status_enum ADD VALUE 'invited';
                ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'invited'::user_status_enum;
            END IF;
        ELSE
            ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'invited'::user_status_enum;
        END IF;
        
    ELSE
        -- We're using constraint, update it
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
        ALTER TABLE public.users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('invited', 'pending_completion', 'active', 'inactive', 'suspended', 'expired'));
        
        -- Set default status for new admin-created users
        ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'invited';
    END IF;
END $$;

-- 4. Make first_name and last_name nullable (will be filled during profile completion)
ALTER TABLE public.users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_name DROP NOT NULL;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON public.users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 6. Add RLS policies for the new flow
-- Allow users to update their own profile during completion
CREATE POLICY "Users can update own profile during completion" ON public.users
FOR UPDATE 
USING (
  auth.uid() = id OR 
  (invitation_token IS NOT NULL AND status IN ('invited', 'pending_completion'))
);

-- Allow anonymous access to users with valid invitation tokens
CREATE POLICY "Allow token-based profile completion" ON public.users
FOR SELECT
USING (
  invitation_token IS NOT NULL AND 
  status = 'invited' AND 
  invitation_expires_at > NOW()
);

-- 7. Create function to generate invitation links
CREATE OR REPLACE FUNCTION generate_user_invitation_link(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token VARCHAR;
    base_url VARCHAR := 'https://your-domain.com'; -- Update this with your actual domain
BEGIN
    -- Generate random token
    token := encode(gen_random_bytes(32), 'base64');
    token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
    
    -- Update user with invitation token and expiry
    UPDATE public.users 
    SET 
        invitation_token = token,
        invitation_expires_at = NOW() + INTERVAL '7 days'
    WHERE id = user_id;
    
    -- Return the invitation link
    RETURN base_url || '/complete-profile?token=' || token;
END;
$$;

-- 8. Create function to generate QR code data for invitation
CREATE OR REPLACE FUNCTION generate_user_qr_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_link TEXT;
BEGIN
    -- Get the invitation link
    invitation_link := generate_user_invitation_link(user_id);
    
    -- Return QR code data (the link itself - QR code generation happens on frontend)
    RETURN invitation_link;
END;
$$;

-- 9. Update existing users to have unique usernames (if needed)
-- This is optional - only run if you have existing users without usernames
DO $$
DECLARE
    user_record RECORD;
    new_username VARCHAR;
    counter INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id, email FROM public.users WHERE username IS NULL
    LOOP
        -- Generate username from email (before @ symbol)
        new_username := split_part(user_record.email, '@', 1);
        
        -- Check if username already exists and make it unique
        WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
            counter := counter + 1;
            new_username := split_part(user_record.email, '@', 1) || counter::text;
        END LOOP;
        
        -- Update user with generated username
        UPDATE public.users 
        SET username = new_username 
        WHERE id = user_record.id;
        
        counter := 0;
    END LOOP;
END $$;

-- 10. Add comments for documentation
COMMENT ON COLUMN public.users.username IS 'Unique username for login. Required for internal users, optional for external users.';
COMMENT ON COLUMN public.users.invitation_token IS 'Unique token for profile completion link';
COMMENT ON COLUMN public.users.invitation_expires_at IS 'Expiry time for invitation token';
COMMENT ON COLUMN public.users.profile_completed_at IS 'Timestamp when user completed their profile setup';
COMMENT ON COLUMN public.users.status IS 'User status: invited (admin created, awaiting profile completion) -> pending_completion (user started) -> active (profile completed)';

-- 11. Show updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

COMMENT ON TABLE public.users IS 'Unified user management - admins create users with all data, users complete profile via invitation link';
